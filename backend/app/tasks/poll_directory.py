"""Celery task for polling directory-based data sources for new files."""

import glob
import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session

from app.config import settings
from app.models.data_source import (
    DataSource,
    DataSourceStatus,
    DataSourceType,
    ProcessedFile,
)
from app.models.raw_data import ParseStatus, RawData, SourceType
from app.tasks import celery_app

logger = logging.getLogger(__name__)

# Use sync engine for Celery tasks
sync_engine = create_engine(settings.DATABASE_URL_SYNC)

# System directories that must never be accessed by tasks
_BLOCKED_SYSTEM_DIRS = ["/etc", "/proc", "/sys", "/dev", "/boot", "/root"]


def _validate_directory_path(path: str) -> str:
    """Validate and resolve a directory path at task execution time.

    Re-validates the path from the database to prevent TOCTOU attacks
    where symlinks may have changed between API validation and task execution.

    Returns the resolved real path.

    Raises:
        ValueError: If the path is invalid or not allowed.
    """
    # Resolve symlinks to get the true filesystem path
    real_path = os.path.realpath(path)

    # Check for path traversal in the resolved path
    if ".." in real_path:
        raise ValueError(
            "Directory path must not contain '..' after symlink resolution."
        )

    # Block system directories
    for sys_dir in _BLOCKED_SYSTEM_DIRS:
        if real_path == sys_dir or real_path.startswith(sys_dir + "/"):
            raise ValueError("Directory path resolves to a blocked system directory.")

    # Check against allowed data directories
    allowed = settings.ALLOWED_DATA_DIRS
    if not allowed:
        raise ValueError(
            "No allowed data directories configured. Contact administrator."
        )

    in_allowed = False
    for allowed_dir in allowed:
        allowed_real = os.path.realpath(allowed_dir)
        if real_path == allowed_real or real_path.startswith(allowed_real + "/"):
            in_allowed = True
            break
    if not in_allowed:
        raise ValueError("Directory path is not within allowed data directories.")

    return real_path


def _compute_file_hash(file_path: str) -> str:
    """Compute SHA-256 hash of a file's contents."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


@celery_app.task(name="poll_directory_source", bind=True, max_retries=3)
def poll_directory_source(self, source_id: int):
    """Poll a directory data source for new files.

    1. Load DataSource from database
    2. Glob files matching the configured pattern
    3. Filter out already-processed files
    4. For each new file: read contents, create RawData record, trigger parser
    5. Insert ProcessedFile record and update source stats

    Args:
        source_id: ID of the DataSource to poll.
    """
    try:
        with Session(sync_engine) as db:
            source = db.execute(
                select(DataSource).where(DataSource.id == source_id)
            ).scalar_one_or_none()

            if not source:
                logger.error(f"Data source {source_id} not found")
                return {"error": "Data source not found"}

            if not source.is_enabled:
                logger.info(f"Data source '{source.name}' is disabled, skipping poll")
                return {"status": "skipped", "reason": "disabled"}

            config: Any = source.config or {}
            directory_path = config.get("directory_path", "")
            file_pattern = config.get("file_pattern", "*.log")

            if not directory_path:
                error_msg = "No directory path configured"
                logger.error(error_msg)
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ERROR,
                        last_error=error_msg,
                        last_run=datetime.now(timezone.utc),
                    )
                )
                db.commit()
                return {"error": error_msg}

            # Re-validate directory path at task execution time (TOCTOU protection)
            try:
                resolved_dir = _validate_directory_path(directory_path)
            except ValueError as ve:
                error_msg = str(ve)
                logger.error(
                    f"Directory validation failed for source {source_id}: {error_msg}"
                )
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ERROR,
                        last_error=error_msg,
                        last_run=datetime.now(timezone.utc),
                    )
                )
                db.commit()
                return {"error": error_msg}

            if not os.path.isdir(resolved_dir):
                error_msg = f"Directory does not exist: {directory_path}"
                logger.error(error_msg)
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ERROR,
                        last_error=error_msg,
                        last_run=datetime.now(timezone.utc),
                    )
                )
                db.commit()
                return {"error": error_msg}

            # Get list of already-processed file paths for this source
            existing_result = db.execute(
                select(ProcessedFile.file_path).where(
                    ProcessedFile.data_source_id == source_id
                )
            )
            processed_paths = {row[0] for row in existing_result.all()}

            # Glob for matching files
            search_pattern = os.path.join(resolved_dir, file_pattern)
            all_files = sorted(glob.glob(search_pattern))

            # Verify each matched file's resolved path is within the allowed directory
            safe_files = []
            for f in all_files:
                real_file = os.path.realpath(f)
                if (
                    real_file.startswith(resolved_dir + "/")
                    or real_file == resolved_dir
                ):
                    safe_files.append(f)
                else:
                    logger.warning(
                        f"Skipping file outside allowed directory: {f} "
                        f"(resolves to {real_file})"
                    )

            # Filter to only new files
            new_files = [f for f in safe_files if f not in processed_paths]

            if not new_files:
                db.execute(
                    update(DataSource)
                    .where(DataSource.id == source_id)
                    .values(
                        status=DataSourceStatus.ACTIVE,
                        last_run=datetime.now(timezone.utc),
                        last_error=None,
                    )
                )
                db.commit()
                return {
                    "status": "success",
                    "source_id": source_id,
                    "new_files": 0,
                }

            # Determine source type for RawData and parser task
            if source.source_type == DataSourceType.MIRC_DIRECTORY:
                raw_source_type = SourceType.MIRC
            elif source.source_type == DataSourceType.EXCEL_DIRECTORY:
                raw_source_type = SourceType.EXCEL
            else:
                raw_source_type = SourceType.MANUAL

            total_records = 0

            for file_path in new_files:
                try:
                    # Read file contents
                    with open(file_path, "r", errors="replace") as fh:
                        content = fh.read()

                    file_hash = _compute_file_hash(file_path)
                    file_name = os.path.basename(file_path)

                    # Create RawData record
                    raw = RawData(
                        source_type=raw_source_type,
                        original_content=content,
                        file_name=file_name,
                        parse_status=ParseStatus.PENDING,
                        confidence_score=0.0,
                    )
                    db.add(raw)
                    db.flush()

                    # Trigger the appropriate parser task
                    try:
                        if source.source_type == DataSourceType.MIRC_DIRECTORY:
                            from app.tasks.ingest_mirc import process_mirc_upload

                            process_mirc_upload.delay(raw.id)
                        elif source.source_type == DataSourceType.EXCEL_DIRECTORY:
                            from app.tasks.ingest_excel import process_excel_upload

                            with open(file_path, "rb") as fb:
                                file_bytes = fb.read()
                            process_excel_upload.delay(raw.id, file_bytes)
                    except Exception as task_exc:
                        logger.warning(
                            f"Failed to enqueue parser task for {file_path}: {task_exc}"
                        )

                    # Record the processed file
                    processed = ProcessedFile(
                        data_source_id=source_id,
                        file_path=file_path,
                        file_hash=file_hash,
                        records_extracted=1,  # One raw data record created per file
                    )
                    db.add(processed)
                    total_records += 1

                except Exception as file_exc:
                    logger.warning(f"Error processing file {file_path}: {file_exc}")
                    continue

            # Update source stats
            db.execute(
                update(DataSource)
                .where(DataSource.id == source_id)
                .values(
                    status=DataSourceStatus.ACTIVE,
                    last_run=datetime.now(timezone.utc),
                    last_error=None,
                    files_processed=DataSource.files_processed + len(new_files),
                    records_ingested=DataSource.records_ingested + total_records,
                )
            )
            db.commit()

            logger.info(
                f"Polled data source '{source.name}': "
                f"{len(new_files)} new files, {total_records} records ingested"
            )

            return {
                "status": "success",
                "source_id": source_id,
                "new_files": len(new_files),
                "records_ingested": total_records,
            }

    except Exception as exc:
        logger.exception(f"Failed to poll directory source (source_id={source_id})")

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

        raise self.retry(exc=exc, countdown=60)
