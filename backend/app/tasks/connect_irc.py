"""Celery task for connecting to IRC servers and ingesting messages."""

import logging
import socket
import ssl
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session

from app.config import settings
from app.models.data_source import DataSource, DataSourceStatus
from app.models.raw_data import ParseStatus, RawData, SourceType
from app.tasks import celery_app

logger = logging.getLogger(__name__)

# Use sync engine for Celery tasks
sync_engine = create_engine(settings.DATABASE_URL_SYNC)

# Maximum number of messages to buffer before forcing a flush
MAX_BUFFER_SIZE = 10000

# Maximum recv_buffer size in bytes (1 MB) to prevent memory exhaustion
MAX_RECV_BUFFER_SIZE = 1 * 1024 * 1024


def _send_irc(sock: socket.socket, message: str) -> None:
    """Send a raw IRC protocol message."""
    sock.sendall((message + "\r\n").encode("utf-8"))


def _flush_buffer_to_db(db: Session, source_id: int, buffer: list) -> int:
    """Flush buffered IRC messages to the database as RawData records.

    Returns the number of records written.
    """
    if not buffer:
        return 0

    combined_content = "\n".join(buffer)
    raw = RawData(
        source_type=SourceType.MIRC,
        original_content=combined_content,
        file_name=f"irc_buffer_{source_id}_{int(time.time())}",
        parse_status=ParseStatus.PENDING,
        confidence_score=0.0,
    )
    db.add(raw)
    db.flush()

    # Trigger mIRC parser for the buffered content
    try:
        from app.tasks.ingest_mirc import process_mirc_upload

        process_mirc_upload.delay(raw.id)
    except Exception as exc:
        logger.warning(f"Failed to enqueue mIRC parser for IRC buffer: {exc}")

    count = len(buffer)
    buffer.clear()
    return count


@celery_app.task(name="connect_irc_source", bind=True, max_retries=3)
def connect_irc_source(self, source_id: int):
    """Connect to an IRC server and ingest messages.

    1. Load DataSource config from database
    2. Connect via socket (optionally with SSL)
    3. Register nick and join configured channels
    4. Buffer incoming messages and flush periodically
    5. Poll is_enabled flag for graceful shutdown
    6. Update status on connect/disconnect/error

    Args:
        source_id: ID of the DataSource (IRC_SERVER type) to connect.
    """
    sock: socket.socket | ssl.SSLSocket | None = None
    try:
        with Session(sync_engine) as db:
            source = db.execute(
                select(DataSource).where(DataSource.id == source_id)
            ).scalar_one_or_none()

            if not source:
                logger.error(f"Data source {source_id} not found")
                return {"error": "Data source not found"}

            if not source.is_enabled:
                logger.info(
                    f"Data source '{source.name}' is disabled, skipping IRC connect"
                )
                return {"status": "skipped", "reason": "disabled"}

            config: Any = source.config or {}
            host = config.get("host", "")
            port = config.get("port", 6667)
            use_ssl = config.get("use_ssl", True)
            nick = config.get("nick", "keystone-bot")
            channels = config.get("channels", [])
            buffer_seconds = config.get("buffer_seconds", 30)

            if not host:
                error_msg = "No host configured for IRC source"
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ERROR,
                        last_error=error_msg,
                    )
                )
                db.commit()
                return {"error": error_msg}

            # Update status to connecting
            db.execute(
                update(DataSource)
                .where(DataSource.id == source_id)
                .values(status=DataSourceStatus.CONNECTING, last_error=None)
            )
            db.commit()

        # Connect to IRC server
        raw_sock = socket.create_connection((host, port), timeout=30)
        if use_ssl:
            context = ssl.create_default_context()
            sock = context.wrap_socket(raw_sock, server_hostname=host)
        else:
            sock = raw_sock

        assert sock is not None
        sock.settimeout(5.0)  # Non-blocking reads with timeout

        # Register with IRC server
        _send_irc(sock, f"NICK {nick}")
        _send_irc(sock, f"USER {nick} 0 * :KEYSTONE IRC Ingest Bot")

        # Wait briefly for server welcome
        time.sleep(2)

        # Join configured channels
        for channel in channels:
            if not channel.startswith("#"):
                channel = "#" + channel
            _send_irc(sock, f"JOIN {channel}")

        # Update status to connected
        with Session(sync_engine) as db:
            db.execute(
                update(DataSource)
                .where(DataSource.id == source_id)
                .values(
                    status=DataSourceStatus.CONNECTED,
                    last_error=None,
                    last_run=datetime.now(timezone.utc),
                )
            )
            db.commit()

        logger.info(
            f"Connected to IRC server {host}:{port} for source {source_id}, "
            f"joined channels: {channels}"
        )

        # Message receive loop
        message_buffer: list[str] = []
        last_flush = time.time()
        total_records = 0
        recv_buffer = ""

        while True:
            # Check if source is still enabled (poll DB periodically)
            if time.time() - last_flush >= buffer_seconds:
                with Session(sync_engine) as db:
                    # Flush buffered messages
                    flushed = _flush_buffer_to_db(db, source_id, message_buffer)
                    total_records += flushed

                    # Update stats
                    if flushed > 0:
                        db.execute(
                            update(DataSource)
                            .where(DataSource.id == source_id)
                            .values(
                                records_ingested=DataSource.records_ingested + flushed,
                                last_run=datetime.now(timezone.utc),
                            )
                        )

                    # Check if we should still be running
                    result = db.execute(
                        select(DataSource.is_enabled).where(DataSource.id == source_id)
                    )
                    is_enabled = result.scalar_one_or_none()
                    db.commit()

                    if not is_enabled:
                        logger.info(
                            f"Data source {source_id} disabled, disconnecting from IRC"
                        )
                        break

                last_flush = time.time()

            # Read data from socket
            try:
                assert sock is not None
                data = sock.recv(4096).decode("utf-8", errors="replace")
                if not data:
                    logger.warning(f"IRC server {host}:{port} closed connection")
                    break

                recv_buffer += data

                # Disconnect if recv_buffer exceeds max size (prevent memory exhaustion)
                if len(recv_buffer) > MAX_RECV_BUFFER_SIZE:
                    logger.warning(
                        f"recv_buffer exceeded {MAX_RECV_BUFFER_SIZE} bytes "
                        f"for source {source_id}, disconnecting"
                    )
                    break

                lines = recv_buffer.split("\r\n")
                recv_buffer = lines.pop()  # Keep incomplete line in buffer

                for line in lines:
                    if not line:
                        continue

                    # Respond to PING to stay connected
                    if line.startswith("PING"):
                        pong_param = line.split(" ", 1)[1] if " " in line else ""
                        assert sock is not None
                        _send_irc(sock, f"PONG {pong_param}")
                        continue

                    # Capture PRIVMSG lines (actual channel messages)
                    if "PRIVMSG" in line:
                        message_buffer.append(line)

                        # Flush early if buffer is full
                        if len(message_buffer) >= MAX_BUFFER_SIZE:
                            logger.info(
                                f"Message buffer full ({MAX_BUFFER_SIZE}), "
                                f"flushing early for source {source_id}"
                            )
                            with Session(sync_engine) as db:
                                flushed = _flush_buffer_to_db(
                                    db, source_id, message_buffer
                                )
                                total_records += flushed
                                if flushed > 0:
                                    db.execute(
                                        update(DataSource)
                                        .where(DataSource.id == source_id)
                                        .values(
                                            records_ingested=DataSource.records_ingested
                                            + flushed,
                                            last_run=datetime.now(timezone.utc),
                                        )
                                    )
                                db.commit()
                            last_flush = time.time()

            except socket.timeout:
                # No data available, continue loop
                continue
            except OSError:
                logger.warning(f"Socket error on IRC source {source_id}")
                break

        # Final flush of any remaining messages
        with Session(sync_engine) as db:
            flushed = _flush_buffer_to_db(db, source_id, message_buffer)
            total_records += flushed

            db.execute(
                update(DataSource)
                .where(DataSource.id == source_id)
                .values(
                    status=DataSourceStatus.DISCONNECTED,
                    last_run=datetime.now(timezone.utc),
                    records_ingested=DataSource.records_ingested + flushed,
                )
            )
            db.commit()

        logger.info(
            f"IRC session ended for source {source_id}: "
            f"{total_records} total records ingested"
        )

        return {
            "status": "disconnected",
            "source_id": source_id,
            "records_ingested": total_records,
        }

    except Exception as exc:
        logger.exception(f"Failed IRC connection for source {source_id}: {exc}")

        # Update source status to error
        try:
            with Session(sync_engine) as db:
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ERROR,
                        last_error=str(exc),
                        last_run=datetime.now(timezone.utc),
                    )
                )
                db.commit()
        except Exception:
            pass

        raise self.retry(exc=exc, countdown=120)

    finally:
        if sock:
            try:
                _send_irc(sock, "QUIT :KEYSTONE shutting down")
                sock.close()
            except Exception:
                pass
