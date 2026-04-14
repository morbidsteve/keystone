"""Seed a few sample data sources for development.

Idempotent — only inserts if the data_sources table is empty.
"""

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource, DataSourceStatus, DataSourceType

logger = logging.getLogger(__name__)


# Dev-only sample data sources. Config shape must match the Pydantic schema
# for each source_type (see app/schemas/data_source.py).
_DATA_SOURCE_FIXTURES: list[dict] = [
    {
        "name": "TAK Server CoT Feed",
        "source_type": DataSourceType.IRC_SERVER,
        "is_enabled": False,
        "config": {
            "host": "tak.internal",
            "port": 8089,
            "use_ssl": True,
            "nick": "keystone-bot",
            "channels": ["#marti-cot"],
            "buffer_seconds": 30,
        },
        "status": DataSourceStatus.INACTIVE,
    },
    {
        "name": "GCCS-MC mIRC Exports",
        "source_type": DataSourceType.MIRC_DIRECTORY,
        "is_enabled": False,
        "config": {
            "directory_path": "/var/keystone/drop/mirc",
            "file_pattern": "*.log",
            "poll_interval_seconds": 60,
        },
        "status": DataSourceStatus.INACTIVE,
    },
    {
        "name": "Daily LOGSTAT Excel Drop",
        "source_type": DataSourceType.EXCEL_DIRECTORY,
        "is_enabled": False,
        "config": {
            "directory_path": "/var/keystone/drop/logstat",
            "file_pattern": "*.xlsx",
            "poll_interval_seconds": 300,
        },
        "status": DataSourceStatus.INACTIVE,
    },
    {
        "name": "Fuel Point ROC Excel Drop",
        "source_type": DataSourceType.EXCEL_DIRECTORY,
        "is_enabled": False,
        "config": {
            "directory_path": "/var/keystone/drop/fuel",
            "file_pattern": "*.xlsx",
            "poll_interval_seconds": 600,
        },
        "status": DataSourceStatus.INACTIVE,
    },
]


async def seed_data_sources(db: AsyncSession) -> int:
    """Insert sample data sources if the table is empty.

    Returns the number of rows inserted.
    """
    existing = await db.execute(select(func.count(DataSource.id)))
    if (existing.scalar() or 0) > 0:
        return 0

    count = 0
    for fixture in _DATA_SOURCE_FIXTURES:
        db.add(DataSource(**fixture))
        count += 1

    if count:
        await db.flush()

    return count
