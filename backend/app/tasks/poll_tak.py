"""Celery task for periodic TAK server polling.

Polls configured TAK server connections for new CoT messages and
processes them into KEYSTONE data records.
"""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from app.config import settings
from app.ingestion.tak_connector import tak_connector
from app.models.raw_data import ParseStatus, RawData, SourceType
from app.models.tak_connection import ConnectionStatus, TAKConnection
from app.tasks import celery_app

logger = logging.getLogger(__name__)

# Use sync engine for Celery tasks
sync_engine = create_engine(settings.DATABASE_URL_SYNC)


@celery_app.task(name="poll_tak_server", bind=True, max_retries=3)
def poll_tak_server(self, connection_id: int):
    """Periodic task to poll a TAK server for new CoT messages.

    1. Load connection config from database
    2. Poll TAK server REST API for recent messages
    3. Parse and process each message
    4. Store raw data records for audit trail
    5. Update connection status

    Args:
        connection_id: ID of the TAKConnection to poll.
    """
    try:
        with Session(sync_engine) as db:
            connection = db.execute(
                select(TAKConnection).where(TAKConnection.id == connection_id)
            ).scalar_one_or_none()

            if not connection:
                logger.error(f"TAK connection {connection_id} not found")
                return {"error": "Connection not found"}

            if not connection.is_active:
                logger.info(
                    f"TAK connection {connection.name} is inactive, skipping poll"
                )
                return {"status": "skipped", "reason": "inactive"}

            # Run async polling in a new event loop
            loop = asyncio.new_event_loop()
            try:
                messages = loop.run_until_complete(
                    tak_connector.poll_messages(connection)
                )
            finally:
                loop.close()

            if not messages:
                # Update last poll time even if no messages
                db.execute(
                    update(TAKConnection)
                    .where(TAKConnection.id == connection_id)
                    .values(
                        connection_status=ConnectionStatus.CONNECTED,
                        last_connected=datetime.now(timezone.utc),
                    )
                )
                db.commit()
                return {
                    "status": "success",
                    "connection_id": connection_id,
                    "messages": 0,
                }

            # Process each message
            processed_count = 0
            error_count = 0

            for msg_data in messages:
                try:
                    # Store raw CoT data for audit
                    raw = RawData(
                        source_type=SourceType.MANUAL,  # Will extend enum for TAK
                        original_content=msg_data.get("raw_xml", ""),
                        channel_name=msg_data.get("group_name"),
                        sender=msg_data.get("callsign"),
                        file_name=f"tak_cot_{msg_data.get('uid', 'unknown')}",
                        parse_status=ParseStatus.PARSED,
                        confidence_score=1.0,
                    )
                    db.add(raw)
                    processed_count += 1

                except Exception as exc:
                    logger.warning(
                        f"Error processing CoT message {msg_data.get('uid')}: {exc}"
                    )
                    error_count += 1

            # Update connection status
            db.execute(
                update(TAKConnection)
                .where(TAKConnection.id == connection_id)
                .values(
                    connection_status=ConnectionStatus.CONNECTED,
                    last_connected=datetime.now(timezone.utc),
                    last_error=None,
                )
            )
            db.commit()

            logger.info(
                f"TAK poll complete for {connection.name}: "
                f"{processed_count} processed, {error_count} errors"
            )

            return {
                "status": "success",
                "connection_id": connection_id,
                "messages": processed_count,
                "errors": error_count,
            }

    except Exception as exc:
        logger.exception(f"Failed to poll TAK server (connection_id={connection_id})")

        # Update connection status to error
        try:
            with Session(sync_engine) as db:
                db.execute(
                    update(TAKConnection)
                    .where(TAKConnection.id == connection_id)
                    .values(
                        connection_status=ConnectionStatus.ERROR,
                        last_error=str(exc),
                    )
                )
                db.commit()
        except Exception:
            pass

        raise self.retry(exc=exc, countdown=120)


@celery_app.task(name="poll_all_tak_servers")
def poll_all_tak_servers():
    """Poll all active TAK server connections.

    Enqueues individual poll_tak_server tasks for each active connection.
    Intended to be called periodically via Celery Beat.
    """
    try:
        with Session(sync_engine) as db:
            result = db.execute(
                select(TAKConnection.id).where(
                    TAKConnection.is_active == True  # noqa: E712
                )
            )
            connection_ids = [row[0] for row in result.all()]

        logger.info(f"Enqueuing TAK polls for {len(connection_ids)} active connections")

        for conn_id in connection_ids:
            poll_tak_server.delay(conn_id)

        return {
            "status": "enqueued",
            "connections": len(connection_ids),
        }

    except Exception as exc:
        logger.exception("Failed to enqueue TAK server polls")
        return {"error": str(exc)}
