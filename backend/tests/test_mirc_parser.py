"""Tests for mIRC log parsing patterns and parser."""

import pytest

from app.ingestion.mirc_patterns import (
    parse_convoy_update,
    parse_equipment_status,
    parse_logstat_header,
    parse_supply_line,
    parse_supply_request,
)
from app.ingestion.mirc_parser import parse_mirc_log


class TestLogstatHeader:
    def test_standard_logstat_header(self):
        line = "[14:30:00] <S4_1stMarines> LOGSTAT AS OF 150600ZJAN26 // 1st Marines"
        result = parse_logstat_header(line)
        assert result is not None
        assert result["time"] == "14:30:00"
        assert result["sender"] == "S4_1stMarines"
        assert result["dtg"] == "150600ZJAN26"
        assert result["unit"] == "1st Marines"

    def test_logstat_header_different_format(self):
        line = "[08:15:30] <BN_S4> LOGSTAT AS OF 201200ZMAR26 // 1/1"
        result = parse_logstat_header(line)
        assert result is not None
        assert result["unit"] == "1/1"

    def test_no_match(self):
        line = "[14:30:00] <user> Hello everyone"
        result = parse_logstat_header(line)
        assert result is None


class TestSupplyLine:
    def test_standard_supply_line(self):
        line = "CL III: JP-8 45000 ON HAND / 60000 AUTH / 75.0% / 4.5 DOS"
        result = parse_supply_line(line)
        assert result is not None
        assert result["supply_class"] == "III"
        assert result["item_description"] == "JP-8"
        assert result["on_hand_qty"] == 45000.0
        assert result["required_qty"] == 60000.0
        assert result["dos"] == 4.5

    def test_class_v_ammo(self):
        line = "CL V: 5.56mm Ball 80000 ON HAND / 100000 AUTH / 80% / 6.2 DOS"
        result = parse_supply_line(line)
        assert result is not None
        assert result["supply_class"] == "V"
        assert result["on_hand_qty"] == 80000.0

    def test_class_i_rations(self):
        line = "CL I: MRE Cases 350 ON HAND / 500 AUTH / 70.0% / 3.5 DOS"
        result = parse_supply_line(line)
        assert result is not None
        assert result["supply_class"] == "I"
        assert result["item_description"] == "MRE Cases"
        assert result["dos"] == 3.5

    def test_no_match(self):
        line = "Everything is fine today"
        result = parse_supply_line(line)
        assert result is None


class TestSupplyRequest:
    def test_standard_request(self):
        line = "REQUEST CL V 5.56MM BALL 50000 RDS FOR 1/1"
        result = parse_supply_request(line)
        assert result is not None
        assert result["supply_class"] == "V"
        assert result["quantity"] == 50000.0
        assert "1/1" in (result.get("requesting_unit") or "")

    def test_req_abbreviation(self):
        line = "REQ CL III JP-8 10000 GAL TO 2/1"
        result = parse_supply_request(line)
        assert result is not None
        assert result["supply_class"] == "III"

    def test_need_keyword(self):
        line = "NEED CL I MRE 500 EACH FOR 3/1"
        result = parse_supply_request(line)
        assert result is not None
        assert result["supply_class"] == "I"


class TestConvoyUpdate:
    def test_standard_convoy(self):
        line = "CONVOY C-123 DEP CAMP LEJEUNE EN ROUTE CAMP PENDLETON ETA 1200Z 12 VEH"
        result = parse_convoy_update(line)
        assert result is not None
        assert result["convoy_id"] == "C-123"
        assert result["origin"] == "CAMP LEJEUNE"
        assert result["destination"] == "CAMP PENDLETON"
        assert result["vehicle_count"] == 12

    def test_convoy_no_eta(self):
        line = "CONVOY C-456 DEP 29 PALMS TO CAMP WILSON 8 VEHICLES"
        result = parse_convoy_update(line)
        assert result is not None
        assert result["vehicle_count"] == 8


class TestEquipmentStatus:
    def test_standard_equip_status(self):
        line = "HMMWV M1151 12/15 MC 2 NMCM 1 NMCS 80%"
        result = parse_equipment_status(line)
        assert result is not None
        assert result["nomenclature"] == "HMMWV"
        assert result["tamcn"] == "M1151"
        assert result["mission_capable"] == 12
        assert result["total_possessed"] == 15
        assert result["nmcm"] == 2
        assert result["nmcs"] == 1
        assert result["readiness_pct"] == 80.0

    def test_simple_equip_format(self):
        line = "TAMCN D1149 HMMWV M1151 12/15 80.0% MC"
        result = parse_equipment_status(line)
        assert result is not None
        assert result["mission_capable"] == 12
        assert result["total_possessed"] == 15


class TestFullParser:
    def test_parse_full_log(self):
        log_content = """[14:30:00] <S4_1stMar> LOGSTAT AS OF 150600ZJAN26 // 1st Marines
[14:30:05] <S4_1stMar> CL I: MRE Cases 350 ON HAND / 500 AUTH / 70.0% / 3.5 DOS
[14:30:10] <S4_1stMar> CL III: JP-8 45000 ON HAND / 60000 AUTH / 75.0% / 4.5 DOS
[14:30:15] <S4_1stMar> CL V: 5.56mm Ball 80000 ON HAND / 100000 AUTH / 80% / 6.2 DOS
[14:30:20] <S4_1stMar> HMMWV M1151 12/15 MC 2 NMCM 1 NMCS 80%
[14:31:00] <MOV_NCO> CONVOY C-123 DEP CAMP LEJEUNE EN ROUTE CAMP PENDLETON ETA 1200Z 12 VEH
"""
        records = parse_mirc_log(log_content)

        # Should parse all structured lines
        assert len(records) >= 5

        # Verify types
        types = [r["type"] for r in records]
        assert "LOGSTAT_HEADER" in types
        assert "SUPPLY" in types
        assert "EQUIPMENT" in types
        assert "TRANSPORTATION" in types

        # All regex-matched records should have confidence 1.0
        for record in records:
            if record["type"] in ("LOGSTAT_HEADER", "SUPPLY", "EQUIPMENT", "TRANSPORTATION"):
                assert record["confidence"] == 1.0

    def test_parse_empty_log(self):
        records = parse_mirc_log("")
        assert records == []

    def test_parse_with_unmatched_lines(self):
        log_content = """[14:30:00] <user1> Good morning everyone
[14:30:05] <user2> Need more ammo and fuel for the mission tomorrow
[14:30:10] <user3> Roger that
"""
        records = parse_mirc_log(log_content)
        # The ammo/fuel line should be picked up by NLP with lower confidence
        nlp_records = [r for r in records if r.get("confidence", 0) < 1.0]
        # At least the ammo/fuel line should match
        assert any(r for r in records if "ammo" in r.get("raw_text", "").lower() or "fuel" in r.get("raw_text", "").lower())
