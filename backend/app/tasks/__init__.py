"""Celery application and task registration."""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "keystone",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.ingest_mirc",
        "app.tasks.ingest_excel",
        "app.tasks.generate_report",
        "app.tasks.poll_tak",
        "app.tasks.poll_directory",
        "app.tasks.connect_irc",
        "app.tasks.poll_all_sources",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    "poll-all-sources-every-60s": {
        "task": "app.tasks.poll_all_sources.poll_all_enabled_sources",
        "schedule": 60.0,
    },
}
