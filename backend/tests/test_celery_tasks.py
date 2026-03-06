"""Tests for Celery task functions with mocked broker."""

from unittest.mock import MagicMock, patch

import pytest


class TestGenerateReportTask:
    """Tests for the generate_report_task Celery task."""

    @patch("app.tasks.generate_report.sync_engine")
    def test_generate_report_not_found(self, mock_engine):
        """generate_report_task returns error when report ID not found."""
        mock_session = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)

        with patch("app.tasks.generate_report.Session", return_value=mock_session):
            from app.tasks.generate_report import generate_report_task

            # __wrapped__ is a bound method (self is already the task instance)
            result = generate_report_task.__wrapped__(999)
            assert result == {"error": "Report not found"}

    @patch("app.tasks.generate_report.sync_engine")
    def test_generate_report_logstat(self, mock_engine):
        """generate_report_task generates LOGSTAT content correctly."""
        from app.models.report import Report, ReportStatus, ReportType

        mock_report = MagicMock(spec=Report)
        mock_report.id = 1
        mock_report.report_type = ReportType.LOGSTAT
        mock_report.unit_id = 1
        mock_report.period_start = None
        mock_report.period_end = None
        mock_report.status = ReportStatus.DRAFT

        mock_unit = MagicMock()
        mock_unit.id = 1
        mock_unit.name = "Test Battalion"

        mock_session = MagicMock()

        def execute_side_effect(query):
            result = MagicMock()
            if not hasattr(execute_side_effect, "call_count"):
                execute_side_effect.call_count = 0
            execute_side_effect.call_count += 1

            if execute_side_effect.call_count == 1:
                result.scalar_one_or_none.return_value = mock_report
            elif execute_side_effect.call_count == 2:
                result.scalar_one_or_none.return_value = mock_unit
            else:
                result.scalars.return_value.all.return_value = []
            return result

        mock_session.execute.side_effect = execute_side_effect
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)

        with patch("app.tasks.generate_report.Session", return_value=mock_session):
            from app.tasks.generate_report import generate_report_task

            result = generate_report_task.__wrapped__(1)
            assert result["status"] == "success"
            assert result["report_id"] == 1


class TestProcessMIRCUploadTask:
    """Tests for the process_mirc_upload Celery task."""

    @patch("app.tasks.ingest_mirc.sync_engine")
    def test_process_mirc_not_found(self, mock_engine):
        """process_mirc_upload returns error when raw data not found."""
        mock_session = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)

        with patch("app.tasks.ingest_mirc.Session", return_value=mock_session):
            from app.tasks.ingest_mirc import process_mirc_upload

            result = process_mirc_upload.__wrapped__(999)
            assert result == {"error": "Record not found"}

    @patch("app.tasks.ingest_mirc.sync_engine")
    @patch("app.tasks.ingest_mirc.normalize_record")
    @patch("app.tasks.ingest_mirc.parse_mirc_log")
    def test_process_mirc_no_records(
        self, mock_parse, mock_normalize, mock_engine
    ):
        """process_mirc_upload handles empty parse results."""
        from app.models.raw_data import ParseStatus, RawData, SourceType

        mock_raw = MagicMock(spec=RawData)
        mock_raw.id = 1
        mock_raw.original_content = "no logistics data here"
        mock_raw.parse_status = ParseStatus.PENDING

        mock_session = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_raw
        mock_session.execute.return_value = mock_result
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)

        mock_parse.return_value = []

        with patch("app.tasks.ingest_mirc.Session", return_value=mock_session):
            from app.tasks.ingest_mirc import process_mirc_upload

            result = process_mirc_upload.__wrapped__(1)
            assert result["status"] == "no_records"
            assert result["count"] == 0

    @patch("app.tasks.ingest_mirc.sync_engine")
    @patch("app.tasks.ingest_mirc.normalize_record")
    @patch("app.tasks.ingest_mirc.parse_mirc_log")
    def test_process_mirc_success(
        self, mock_parse, mock_normalize, mock_engine
    ):
        """process_mirc_upload processes records successfully."""
        from app.models.raw_data import ParseStatus, RawData, SourceType

        mock_raw = MagicMock(spec=RawData)
        mock_raw.id = 1
        mock_raw.original_content = "logistics data"
        mock_raw.parse_status = ParseStatus.PENDING

        mock_session = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_raw
        mock_session.execute.return_value = mock_result
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)

        mock_parse.return_value = [
            {"type": "supply", "confidence": 0.9},
            {"type": "equipment", "confidence": 0.8},
        ]
        mock_normalize.return_value = {"normalized": True}

        with patch("app.tasks.ingest_mirc.Session", return_value=mock_session):
            from app.tasks.ingest_mirc import process_mirc_upload

            result = process_mirc_upload.__wrapped__(1)
            assert result["status"] == "success"
            assert result["records_parsed"] == 2
            assert result["avg_confidence"] == 0.85


class TestCeleryAppConfiguration:
    """Tests for Celery app configuration."""

    def test_celery_app_registered_tasks(self):
        """Celery app includes expected task modules."""
        from app.tasks import celery_app

        expected_includes = [
            "app.tasks.ingest_mirc",
            "app.tasks.ingest_excel",
            "app.tasks.generate_report",
        ]
        for module in expected_includes:
            assert module in celery_app.conf.include

    def test_celery_app_serializer_config(self):
        """Celery app uses JSON serialization."""
        from app.tasks import celery_app

        assert celery_app.conf.task_serializer == "json"
        assert "json" in celery_app.conf.accept_content

    def test_celery_app_utc_enabled(self):
        """Celery app has UTC enabled."""
        from app.tasks import celery_app

        assert celery_app.conf.enable_utc is True
        assert celery_app.conf.timezone == "UTC"

    def test_celery_beat_schedule_exists(self):
        """Celery beat has a poll-all-sources schedule."""
        from app.tasks import celery_app

        assert "poll-all-sources-every-60s" in celery_app.conf.beat_schedule
        schedule = celery_app.conf.beat_schedule["poll-all-sources-every-60s"]
        assert schedule["schedule"] == 60.0
