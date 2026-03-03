"""Celery Beat task for polling all enabled directory-based data sources."""

import logging

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.data_source import DataSource, DataSourceType
from app.tasks import celery_app

logger = logging.getLogger(__name__)

# Use sync engine for Celery tasks
sync_engine = create_engine(settings.DATABASE_URL_SYNC)

# Directory-based source types that should be polled on a schedule
_DIRECTORY_SOURCE_TYPES = [
    DataSourceType.MIRC_DIRECTORY,
    DataSourceType.EXCEL_DIRECTORY,
]


@celery_app.task(name="app.tasks.poll_all_sources.poll_all_enabled_sources")
def poll_all_enabled_sources():
    """Poll all enabled directory-type data sources.

    Queries for all enabled MIRC_DIRECTORY and EXCEL_DIRECTORY sources
    and enqueues individual poll_directory_source tasks for each.
    Intended to be called periodically via Celery Beat.
    """
    try:
        with Session(sync_engine) as db:
            result = db.execute(
                select(DataSource.id).where(
                    DataSource.is_enabled == True,  # noqa: E712
                    DataSource.source_type.in_(_DIRECTORY_SOURCE_TYPES),
                )
            )
            source_ids = [row[0] for row in result.all()]

        logger.info(f"Enqueuing directory polls for {len(source_ids)} enabled sources")

        from app.tasks.poll_directory import poll_directory_source

        for sid in source_ids:
            poll_directory_source.delay(sid)

        return {
            "status": "enqueued",
            "sources": len(source_ids),
        }

    except Exception as exc:
        logger.exception("Failed to enqueue data source polls")
        return {"error": str(exc)}
