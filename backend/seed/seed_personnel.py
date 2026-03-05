"""Seed personnel roster for a battalion (~28 Marines).

Idempotent — checks EDIPI uniqueness before inserting.
Also assigns key Marines to their matching billets.
"""

import logging
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import BilletStructure
from app.models.personnel import (
    DutyStatus,
    PayGrade,
    Personnel,
    PersonnelStatus,
    RifleQualification,
    SecurityClearance,
    SwimQualification,
)
from app.models.unit import Unit

logger = logging.getLogger(__name__)


# fmt: off
_PERSONNEL: list[dict] = [
    # ── Officers ──────────────────────────────────────────────────────────
    {
        "edipi": "1234567890", "first_name": "James", "last_name": "Richardson",
        "rank": "LtCol", "pay_grade": PayGrade.O5, "mos": "0302",
        "billet": "BN CDR", "security_clearance": SecurityClearance.TOP_SECRET,
        "pft_score": 278, "pft_date": date(2025, 11, 15),
        "cft_score": 285, "cft_date": date(2025, 10, 20),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 6, 10),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2023, 7, 1), "eaos": date(2028, 6, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O+",
    },
    {
        "edipi": "1234567891", "first_name": "Michael", "last_name": "Torres",
        "rank": "Maj", "pay_grade": PayGrade.O4, "mos": "0302",
        "billet": "BN XO", "security_clearance": SecurityClearance.TOP_SECRET,
        "pft_score": 282, "pft_date": date(2025, 11, 15),
        "cft_score": 270, "cft_date": date(2025, 10, 20),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 5, 22),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2023, 1, 1), "eaos": date(2028, 8, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A+",
    },
    {
        "edipi": "1234567892", "first_name": "David", "last_name": "Nguyen",
        "rank": "Capt", "pay_grade": PayGrade.O3, "mos": "0302",
        "billet": "ALPHA CO CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 268, "pft_date": date(2025, 12, 5),
        "cft_score": 275, "cft_date": date(2025, 11, 10),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 7, 15),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2024, 4, 1), "eaos": date(2026, 9, 15),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B+",
    },
    {
        "edipi": "1234567893", "first_name": "Kevin", "last_name": "Martinez",
        "rank": "Capt", "pay_grade": PayGrade.O3, "mos": "0802",
        "billet": "BRAVO CO CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 255, "pft_date": date(2025, 10, 18),
        "cft_score": 260, "cft_date": date(2025, 9, 25),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 4, 20),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 1, 1), "eaos": date(2028, 3, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "AB+",
    },
    {
        "edipi": "1234567894", "first_name": "Sarah", "last_name": "Chen",
        "rank": "Capt", "pay_grade": PayGrade.O3, "mos": "0302",
        "billet": "WPNS CO CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 290, "pft_date": date(2025, 11, 20),
        "cft_score": 288, "cft_date": date(2025, 10, 15),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 8, 5),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 7, 1), "eaos": date(2029, 6, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O-",
    },
    {
        "edipi": "1234567895", "first_name": "Ryan", "last_name": "Brooks",
        "rank": "1stLt", "pay_grade": PayGrade.O2, "mos": "0302",
        "billet": "1ST PLT CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 275, "pft_date": date(2025, 12, 1),
        "cft_score": 280, "cft_date": date(2025, 11, 5),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 9, 12),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2025, 1, 1), "eaos": date(2029, 1, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A+",
    },
    {
        "edipi": "1234567896", "first_name": "Maria", "last_name": "Santos",
        "rank": "1stLt", "pay_grade": PayGrade.O2, "mos": "0302",
        "billet": "2ND PLT CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 270, "pft_date": date(2025, 11, 22),
        "cft_score": 265, "cft_date": date(2025, 10, 28),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 7, 8),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 3, 1), "eaos": date(2029, 4, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B-",
    },
    {
        "edipi": "1234567897", "first_name": "Tyler", "last_name": "Washington",
        "rank": "2ndLt", "pay_grade": PayGrade.O1, "mos": "0302",
        "billet": "3RD PLT CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 260, "pft_date": date(2025, 12, 10),
        "cft_score": 255, "cft_date": date(2025, 11, 15),
        "rifle_qual": RifleQualification.MARKSMAN, "rifle_qual_date": date(2025, 10, 1),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 6, 1), "eaos": date(2029, 5, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": False, "blood_type": "O+",
    },
    # ── Senior Enlisted ───────────────────────────────────────────────────
    {
        "edipi": "1234567898", "first_name": "Robert", "last_name": "Jenkins",
        "rank": "SgtMaj", "pay_grade": PayGrade.E9, "mos": "0369",
        "billet": "BN SGTMAJ", "security_clearance": SecurityClearance.TOP_SECRET,
        "pft_score": 285, "pft_date": date(2025, 10, 10),
        "cft_score": 290, "cft_date": date(2025, 9, 18),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 5, 30),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2022, 8, 1), "eaos": date(2028, 7, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A-",
    },
    {
        "edipi": "1234567899", "first_name": "Antonio", "last_name": "Davis",
        "rank": "1stSgt", "pay_grade": PayGrade.E8, "mos": "0369",
        "billet": "ALPHA 1SG", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 275, "pft_date": date(2025, 11, 8),
        "cft_score": 280, "cft_date": date(2025, 10, 12),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 6, 22),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2023, 4, 1), "eaos": date(2027, 9, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O+",
    },
    {
        "edipi": "1234567900", "first_name": "Christopher", "last_name": "Lee",
        "rank": "MSgt", "pay_grade": PayGrade.E8, "mos": "0491",
        "billet": "H&S CO CDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 265, "pft_date": date(2025, 10, 25),
        "cft_score": 270, "cft_date": date(2025, 9, 30),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 4, 15),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2023, 10, 1), "eaos": date(2028, 11, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B+",
    },
    {
        "edipi": "1234567901", "first_name": "William", "last_name": "Brown",
        "rank": "GySgt", "pay_grade": PayGrade.E7, "mos": "0369",
        "billet": "OPS CHIEF", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 280, "pft_date": date(2025, 11, 1),
        "cft_score": 275, "cft_date": date(2025, 10, 5),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 7, 20),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 1, 1), "eaos": date(2028, 2, 28),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "AB-",
    },
    # ── Staff NCOs ────────────────────────────────────────────────────────
    {
        "edipi": "1234567902", "first_name": "Marcus", "last_name": "Johnson",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "0311",
        "billet": "1ST PLT SGT", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 270, "pft_date": date(2025, 12, 3),
        "cft_score": 278, "cft_date": date(2025, 11, 8),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 8, 10),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 4, 1), "eaos": date(2027, 10, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O+",
    },
    {
        "edipi": "1234567903", "first_name": "Derek", "last_name": "Williams",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "0311",
        "billet": "2ND PLT SGT", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 265, "pft_date": date(2025, 11, 18),
        "cft_score": 268, "cft_date": date(2025, 10, 22),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 6, 5),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 7, 1), "eaos": date(2028, 1, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A+",
    },
    {
        "edipi": "1234567904", "first_name": "James", "last_name": "Thompson",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "0311",
        "billet": "3RD PLT SGT", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 258, "pft_date": date(2025, 10, 28),
        "cft_score": 260, "cft_date": date(2025, 9, 15),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 5, 18),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2024, 10, 1), "eaos": date(2027, 12, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B+",
    },
    {
        "edipi": "1234567905", "first_name": "Carlos", "last_name": "Rivera",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "0811",
        "billet": "MORTAR SEC LDR", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 272, "pft_date": date(2025, 11, 12),
        "cft_score": 265, "cft_date": date(2025, 10, 18),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 7, 25),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2024, 1, 1), "eaos": date(2028, 4, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O-",
    },
    {
        "edipi": "1234567906", "first_name": "Brian", "last_name": "Anderson",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "0621",
        "billet": "COMMS CHIEF", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 250, "pft_date": date(2025, 12, 8),
        "cft_score": 255, "cft_date": date(2025, 11, 12),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 9, 5),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2024, 7, 1), "eaos": date(2027, 8, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A-",
    },
    {
        "edipi": "1234567907", "first_name": "Ahmed", "last_name": "Hassan",
        "rank": "SSgt", "pay_grade": PayGrade.E6, "mos": "3531",
        "billet": "MOTOR-T CHIEF", "security_clearance": SecurityClearance.SECRET,
        "pft_score": 248, "pft_date": date(2025, 10, 15),
        "cft_score": 252, "cft_date": date(2025, 9, 20),
        "rifle_qual": RifleQualification.MARKSMAN, "rifle_qual_date": date(2025, 4, 28),
        "swim_qual": SwimQualification.CWS3,
        "date_of_rank": date(2024, 10, 1), "eaos": date(2027, 11, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B-",
        "drivers_license_military": True,
    },
    # ── NCOs ──────────────────────────────────────────────────────────────
    {
        "edipi": "1234567908", "first_name": "Jason", "last_name": "Kim",
        "rank": "Sgt", "pay_grade": PayGrade.E5, "mos": "0311",
        "billet": "SQD LDR", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 268, "pft_date": date(2025, 11, 25),
        "cft_score": 272, "cft_date": date(2025, 10, 30),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 8, 15),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2025, 1, 1), "eaos": date(2027, 6, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O+",
    },
    {
        "edipi": "1234567909", "first_name": "Daniel", "last_name": "Garcia",
        "rank": "Sgt", "pay_grade": PayGrade.E5, "mos": "0311",
        "billet": "SQD LDR", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 262, "pft_date": date(2025, 12, 2),
        "cft_score": 258, "cft_date": date(2025, 11, 6),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 6, 18),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 4, 1), "eaos": date(2028, 5, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "A+",
    },
    {
        "edipi": "1234567910", "first_name": "Patrick", "last_name": "O'Brien",
        "rank": "Sgt", "pay_grade": PayGrade.E5, "mos": "0331",
        "billet": "MG SQD LDR", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 270, "pft_date": date(2025, 11, 10),
        "cft_score": 275, "cft_date": date(2025, 10, 15),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 7, 12),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2025, 1, 1), "eaos": date(2027, 3, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O-",
    },
    {
        "edipi": "1234567911", "first_name": "Isaiah", "last_name": "Washington",
        "rank": "Sgt", "pay_grade": PayGrade.E5, "mos": "0341",
        "billet": "MORTAR SQD LDR", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 255, "pft_date": date(2025, 10, 20),
        "cft_score": 260, "cft_date": date(2025, 9, 25),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 5, 10),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 7, 1), "eaos": date(2028, 8, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "AB+",
    },
    {
        "edipi": "1234567912", "first_name": "Rachel", "last_name": "Cooper",
        "rank": "Sgt", "pay_grade": PayGrade.E5, "mos": "0621",
        "billet": "RADIO CHIEF", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 258, "pft_date": date(2025, 11, 28),
        "cft_score": 250, "cft_date": date(2025, 10, 25),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 8, 22),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 4, 1), "eaos": date(2027, 7, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "B+",
    },
    # ── Junior Marines ────────────────────────────────────────────────────
    {
        "edipi": "1234567913", "first_name": "David", "last_name": "Park",
        "rank": "Cpl", "pay_grade": PayGrade.E4, "mos": "0311",
        "billet": "FIRE TEAM LDR", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 272, "pft_date": date(2025, 12, 5),
        "cft_score": 268, "cft_date": date(2025, 11, 10),
        "rifle_qual": RifleQualification.EXPERT, "rifle_qual_date": date(2025, 9, 18),
        "swim_qual": SwimQualification.CWS1,
        "date_of_rank": date(2025, 7, 1), "eaos": date(2028, 3, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": True, "blood_type": "O+",
    },
    {
        "edipi": "1234567914", "first_name": "Miguel", "last_name": "Hernandez",
        "rank": "Cpl", "pay_grade": PayGrade.E4, "mos": "0351",
        "billet": "ASSAULTMAN", "security_clearance": SecurityClearance.CONFIDENTIAL,
        "pft_score": 260, "pft_date": date(2025, 11, 15),
        "cft_score": 265, "cft_date": date(2025, 10, 20),
        "rifle_qual": RifleQualification.SHARPSHOOTER, "rifle_qual_date": date(2025, 7, 28),
        "swim_qual": SwimQualification.CWS2,
        "date_of_rank": date(2025, 10, 1), "eaos": date(2028, 1, 31),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": False, "blood_type": "A+",
    },
    {
        "edipi": "1234567915", "first_name": "Tyler", "last_name": "Reed",
        "rank": "LCpl", "pay_grade": PayGrade.E3, "mos": "0311",
        "billet": "RIFLEMAN", "security_clearance": SecurityClearance.NONE,
        "pft_score": 245, "pft_date": date(2025, 12, 10),
        "cft_score": 240, "cft_date": date(2025, 11, 15),
        "rifle_qual": RifleQualification.MARKSMAN, "rifle_qual_date": date(2025, 10, 5),
        "swim_qual": SwimQualification.CWS3,
        "date_of_rank": date(2025, 9, 1), "eaos": date(2026, 6, 1),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": False, "blood_type": "B-",
    },
    {
        "edipi": "1234567916", "first_name": "Jessica", "last_name": "Moore",
        "rank": "LCpl", "pay_grade": PayGrade.E3, "mos": "3521",
        "billet": "MECHANIC", "security_clearance": SecurityClearance.NONE,
        "pft_score": 238, "pft_date": date(2025, 10, 5),
        "cft_score": 235, "cft_date": date(2025, 9, 10),
        "rifle_qual": RifleQualification.MARKSMAN, "rifle_qual_date": date(2025, 6, 15),
        "swim_qual": SwimQualification.CWS3,
        "date_of_rank": date(2025, 8, 1), "eaos": date(2027, 9, 30),
        "status": PersonnelStatus.ACTIVE, "duty_status": DutyStatus.LIMDU,
        "pme_complete": False, "blood_type": "O+",
        "drivers_license_military": True,
    },
    {
        "edipi": "1234567917", "first_name": "Brandon", "last_name": "Scott",
        "rank": "PFC", "pay_grade": PayGrade.E2, "mos": "0311",
        "billet": "RIFLEMAN", "security_clearance": SecurityClearance.NONE,
        "pft_score": 220, "pft_date": date(2025, 12, 12),
        "cft_score": 215, "cft_date": date(2025, 11, 18),
        "rifle_qual": RifleQualification.UNQUAL, "rifle_qual_date": None,
        "swim_qual": SwimQualification.CWS4,
        "date_of_rank": date(2025, 11, 1), "eaos": date(2029, 10, 31),
        "status": PersonnelStatus.LEAVE, "duty_status": DutyStatus.PRESENT,
        "pme_complete": False, "blood_type": "A-",
    },
]
# fmt: on

# Mapping: (last_name) -> partial billet_title match for billet assignment
_BILLET_ASSIGNMENTS: list[tuple[str, str]] = [
    ("1234567890", "Battalion Commander"),  # LtCol Richardson -> BN CDR
    ("1234567891", "Battalion Executive Officer"),  # Maj Torres -> BN XO
    ("1234567898", "Battalion Sergeant Major"),  # SgtMaj Jenkins -> BN SGTMAJ
    ("1234567892", "Alpha Company Commander"),  # Capt Nguyen -> ALPHA CO CDR
    ("1234567893", "Bravo Company Commander"),  # Capt Martinez -> BRAVO CO CDR
    ("1234567894", "Weapons Company Commander"),  # Capt Chen -> WPNS CO CDR
    ("1234567899", "Alpha Company First Sergeant"),  # 1stSgt Davis -> ALPHA 1SG
    ("1234567895", "1st Platoon Commander"),  # 1stLt Brooks -> 1ST PLT CDR
    ("1234567902", "1st Platoon Sergeant"),  # SSgt Johnson -> 1ST PLT SGT
]


async def seed_personnel(db: AsyncSession) -> int:
    """Seed personnel roster. Returns count of items inserted.

    Assigns personnel to the first Battalion-echelon unit found.
    Idempotent — checks EDIPI before inserting each record.
    """
    # Find the first BN-echelon unit
    result = await db.execute(select(Unit).where(Unit.echelon == "BN").limit(1))
    unit = result.scalar_one_or_none()
    if not unit:
        logger.warning("No battalion-echelon unit found for personnel seeding.")
        return 0

    inserted = 0
    for person_data in _PERSONNEL:
        # Check uniqueness by EDIPI
        existing = await db.execute(
            select(Personnel).where(Personnel.edipi == person_data["edipi"])
        )
        if existing.scalar_one_or_none():
            continue

        person = Personnel(unit_id=unit.id, **person_data)
        db.add(person)
        inserted += 1

    if inserted:
        await db.flush()

    logger.info(f"Personnel seeded: {inserted} new records.")
    return inserted


async def seed_billet_assignments(db: AsyncSession) -> int:
    """Assign key personnel to their matching billets.

    Idempotent — skips billets already filled.
    """
    assigned = 0
    for edipi, billet_title in _BILLET_ASSIGNMENTS:
        # Find the personnel record
        result = await db.execute(select(Personnel).where(Personnel.edipi == edipi))
        person = result.scalar_one_or_none()
        if not person:
            logger.warning(f"Personnel EDIPI {edipi} not found for billet assignment.")
            continue

        # Find the matching billet (exact title match)
        result = await db.execute(
            select(BilletStructure).where(
                BilletStructure.billet_title == billet_title,
                BilletStructure.is_filled == False,  # noqa: E712
            )
        )
        billet = result.scalar_one_or_none()
        if not billet:
            # Could already be filled or title doesn't match
            continue

        billet.filled_by_id = person.id
        billet.is_filled = True
        billet.filled_date = date(2025, 1, 15)
        assigned += 1

    if assigned:
        await db.flush()

    logger.info(f"Billet assignments seeded: {assigned} billets filled.")
    return assigned
