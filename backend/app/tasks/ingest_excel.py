"""Celery task for processing uploaded Excel files."""

import logging

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import settings
from app.ingestion.excel_parser import parse_excel
from app.ingestion.normalizer import normalize_record
from app.models.raw_data import ParseStatus, RawData, SourceType
from app.tasks import celery_app

logger = logging.getLogger(__name__)

sync_engine = create_engine(settings.DATABASE_URL_SYNC)


@celery_app.task(name="process_excel_upload", bind=True, max_retries=3)
def process_excel_upload(self, raw_data_id: int, file_bytes: bytes = None):
    """Process an uploaded Excel file.

    1. Fetch raw data record
    2. Parse Excel content
    3. Normalize extracted records
    4. Update status
    """
    try:
        with Session(sync_engine) as db:
            raw = db.execute(
                select(RawData).where(RawData.id == raw_data_id)
            ).scalar_one_or_none()

            if not raw:
                logger.error(f"Raw data record {raw_data_id} not found")
                return {"error": "Record not found"}

            if not file_bytes:
                raw.parse_status = ParseStatus.FAILED
                raw.confidence_score = 0.0
                db.commit()
                return {"error": "No file content provided"}

            # Parse Excel
            parsed_records = parse_excel(file_bytes, raw.file_name or "")

            if not parsed_records:
                raw.parse_status = ParseStatus.FAILED
                raw.confidence_score = 0.0
                db.commit()
                return {"status": "no_records", "count": 0}

            # Check for errors
            if len(parsed_records) == 1 and "error" in parsed_records[0]:
                raw.parse_status = ParseStatus.FAILED
                raw.confidence_score = 0.0
                db.commit()
                return {"error": parsed_records[0]["error"]}

            # Normalize
            normalized = []
            total_confidence = 0.0

            for record in parsed_records:
                norm = normalize_record(record, SourceType.EXCEL)
                normalized.append(norm)
                total_confidence += record.get("confidence", 0.0)

            avg_confidence = total_confidence / len(parsed_records) if parsed_records else 0.0

            raw.parse_status = ParseStatus.PARSED
            raw.confidence_score = round(avg_confidence, 2)
            db.commit()

            logger.info(
                f"Processed Excel {raw_data_id}: "
                f"{len(normalized)} records, avg confidence {avg_confidence:.2f}"
            )

            return {
                "status": "success",
                "raw_data_id": raw_data_id,
                "records_parsed": len(normalized),
                "avg_confidence": round(avg_confidence, 2),
            }

    except Exception as exc:
        logger.exception(f"Failed to process Excel upload {raw_data_id}")
        try:
            with Session(sync_engine) as db:
                raw = db.execute(
                    select(RawData).where(RawData.id == raw_data_id)
                ).scalar_one_or_none()
                if raw:
                    raw.parse_status = ParseStatus.FAILED
                    db.commit()
        except Exception:
            pass

        raise self.retry(exc=exc, countdown=60)
