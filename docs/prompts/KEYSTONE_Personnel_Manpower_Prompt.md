# KEYSTONE — Personnel & Manning: Comprehensive Expansion

## Mission

Expand the KEYSTONE Personnel module from basic CRUD into a full-featured personnel and manning management system. This includes:

1. **Personnel model enrichment** — Add professional military qualifications, certifications, clearances, and readiness metrics
2. **Manning models** — Table of Organization (T/O) billets, manning snapshots, qualifications matrix
3. **Personnel Analytics Service** — Unit strength, MOS fill rates, qualification tracking, loss forecasting
4. **Expanded API endpoints** — Strength reports, T/O billets, qualifications, EAS tracking
5. **PersonnelPage frontend** — Alpha roster, strength charts, billet tracker, qualification matrix, EAS timeline
6. **Seed data** — Realistic USMC T/O for a battalion, common qualifications

---

## Part 1: Database Models

### 1.1 Expand Personnel Model

**File:** `backend/app/models/personnel.py`

**Update the existing `Personnel` model to add:**

```python
from datetime import date, datetime
from decimal import Decimal
import enum

# ─── NEW ENUMS ───────────────────────────────────────────────────────

class PayGrade(str, enum.Enum):
    """USMC Pay Grade (https://www.military.com/pay-charts)"""
    # Enlisted
    E1 = "E1"
    E2 = "E2"
    E3 = "E3"
    E4 = "E4"
    E5 = "E5"
    E6 = "E6"
    E7 = "E7"
    E8 = "E8"
    E9 = "E9"
    # Warrant Officers
    W1 = "W1"
    W2 = "W2"
    W3 = "W3"
    W4 = "W4"
    W5 = "W5"
    # Officers
    O1 = "O1"
    O2 = "O2"
    O3 = "O3"
    O4 = "O4"
    O5 = "O5"
    O6 = "O6"
    O7 = "O7"
    O8 = "O8"
    O9 = "O9"
    O10 = "O10"


class RifleQualification(str, enum.Enum):
    """Rifle Range qualification level"""
    EXPERT = "EXPERT"
    SHARPSHOOTER = "SHARPSHOOTER"
    MARKSMAN = "MARKSMAN"
    UNQUAL = "UNQUAL"


class SwimQualification(str, enum.Enum):
    """Combat Water Survival (CWS) qualification level"""
    CWS1 = "CWS1"
    CWS2 = "CWS2"
    CWS3 = "CWS3"
    CWS4 = "CWS4"
    UNQUAL = "UNQUAL"


class SecurityClearance(str, enum.Enum):
    """Security clearance level"""
    NONE = "NONE"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"
    TS_SCI = "TS_SCI"


class DutyStatus(str, enum.Enum):
    """Current duty/assignment status"""
    PRESENT = "PRESENT"
    UA = "UA"  # Unauthorized Absence
    DESERTER = "DESERTER"
    AWOL = "AWOL"  # Absent Without Leave
    CONFINEMENT = "CONFINEMENT"  # Brig/Jail
    LIMDU = "LIMDU"  # Limited Duty
    PTAD = "PTAD"  # Patient (med hold)


# ─── EXPANDED PERSONNEL TABLE ─────────────────────────────────────────

class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    edipi = Column(String(10), unique=True, nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    rank = Column(String(20), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)
    mos = Column(String(10), nullable=True)
    additional_mos = Column(Text, nullable=True)  # JSON array: ["5502", "0411"]
    blood_type = Column(String(5), nullable=True)
    status = Column(
        SQLEnum(PersonnelStatus), nullable=False, default=PersonnelStatus.ACTIVE
    )

    # ─── NEW FIELDS ───────────────────────────────────────────────────
    pay_grade = Column(SQLEnum(PayGrade), nullable=True)
    billet = Column(String(100), nullable=True)  # e.g., "Plt Sgt", "Co Cmdr", "S1 NCOIC"
    date_of_rank = Column(Date, nullable=True)
    eaos = Column(Date, nullable=True)  # End of Active Obligated Service
    pme_complete = Column(Boolean, default=False)  # Professional Military Education

    # ─── RIFLE RANGE QUALIFICATION ────────────────────────────────────
    rifle_qual = Column(
        SQLEnum(RifleQualification), nullable=True, default=RifleQualification.UNQUAL
    )
    rifle_qual_date = Column(Date, nullable=True)

    # ─── PHYSICAL FITNESS TEST (PFT) ──────────────────────────────────
    pft_score = Column(Integer, nullable=True)  # 0-300
    pft_date = Column(Date, nullable=True)

    # ─── COMBAT FITNESS TEST (CFT) ────────────────────────────────────
    cft_score = Column(Integer, nullable=True)  # 0-300
    cft_date = Column(Date, nullable=True)

    # ─── SWIM QUALIFICATION ───────────────────────────────────────────
    swim_qual = Column(
        SQLEnum(SwimQualification), nullable=True, default=SwimQualification.UNQUAL
    )

    # ─── SECURITY CLEARANCE ───────────────────────────────────────────
    security_clearance = Column(
        SQLEnum(SecurityClearance), nullable=True, default=SecurityClearance.NONE
    )
    clearance_expiry = Column(Date, nullable=True)

    # ─── DRIVER'S LICENSE ─────────────────────────────────────────────
    drivers_license_military = Column(Boolean, default=False)

    # ─── DUTY STATUS ──────────────────────────────────────────────────
    duty_status = Column(
        SQLEnum(DutyStatus), nullable=False, default=DutyStatus.PRESENT
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────
    unit = relationship("Unit", back_populates="personnel")
    weapons = relationship(
        "Weapon", back_populates="personnel", cascade="all, delete-orphan"
    )
    ammo_loads = relationship(
        "AmmoLoad", back_populates="personnel", cascade="all, delete-orphan"
    )
    convoy_assignments = relationship("ConvoyPersonnel", back_populates="personnel")
    qualifications = relationship(
        "Qualification", back_populates="personnel", cascade="all, delete-orphan"
    )
    billet_assignments = relationship(
        "BilletStructure",
        foreign_keys="BilletStructure.filled_by_id",
        back_populates="assigned_personnel"
    )
```

---

### 1.2 New Model: Manning (T/O & Billets)

**File:** `backend/app/models/manning.py`

```python
"""Manning, T/O billets, and qualifications models."""

import enum
from datetime import date, datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    Boolean,
    Date,
    Enum as SQLEnum,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class BilletStructure(Base):
    """Table of Organization (T/O) billet definition.

    Represents authorized positions in a unit's structure.
    Example: Battalion S1 NCOIC (billet_id_code="0301-E7-01")
    """
    __tablename__ = "billet_structure"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ─── BILLET IDENTIFICATION ────────────────────────────────────────
    billet_id_code = Column(
        String(50), nullable=False, unique=True
    )  # e.g., "0301-O3-01", "0301-E7-02"
    billet_title = Column(String(100), nullable=False)  # "Company Commander", "Plt Sgt"

    # ─── T/O REQUIREMENTS ─────────────────────────────────────────────
    mos_required = Column(String(10), nullable=True)  # MOS code, may be NULL for flex
    rank_required = Column(String(20), nullable=True)  # Minimum rank, nullable for flex

    # ─── BILLET CHARACTERISTICS ──────────────────────────────────────
    is_key_billet = Column(Boolean, default=False)  # Critical leadership position
    is_filled = Column(Boolean, default=False)  # Filled or vacant

    # ─── ASSIGNMENT ───────────────────────────────────────────────────
    filled_by_id = Column(
        Integer, ForeignKey("personnel.id", ondelete="SET NULL"), nullable=True
    )
    filled_date = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────
    unit = relationship("Unit", back_populates="billets")
    assigned_personnel = relationship(
        "Personnel",
        foreign_keys=[filled_by_id],
        back_populates="billet_assignments"
    )


class ManningSnapshot(Base):
    """Point-in-time manning report.

    Captures unit manning status at a specific date for historical tracking
    and trend analysis.
    """
    __tablename__ = "manning_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ─── SNAPSHOT METADATA ────────────────────────────────────────────
    snapshot_date = Column(Date, nullable=False, index=True)

    # ─── MANNING COUNTS ───────────────────────────────────────────────
    authorized_total = Column(Integer, nullable=False)  # Total authorized strength
    assigned_total = Column(Integer, nullable=False)  # Total assigned to unit
    present_for_duty = Column(Integer, nullable=False)  # Minus UA, AWOL, etc.

    # ─── READINESS METRICS ────────────────────────────────────────────
    fill_rate_pct = Column(Float, nullable=False)  # assigned / authorized * 100

    # ─── SHORTFALLS (JSON) ────────────────────────────────────────────
    mos_shortfalls = Column(JSON, nullable=True)
    # Example: {"5502": -2, "0311": 0, "0411": -1}

    rank_distribution = Column(JSON, nullable=True)
    # Example: {"E4": 5, "E5": 3, "E6": 2, "E7": 1}

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ─── RELATIONSHIPS ────────────────────────────────────────────────
    unit = relationship("Unit", back_populates="manning_snapshots")


class Qualification(Base):
    """Individual qualification, certification, or school completion.

    Tracks all training/qualification milestones:
    - Rifle range (annual/bienniel)
    - PFT/CFT (semiannual)
    - PME schools (TBS, SCC, DCC, CCC, SNCO Academy)
    - Licenses (HMMWV, Truck, etc.)
    - MOS-specific certs
    """
    __tablename__ = "qualification"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(
        Integer, ForeignKey("personnel.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ─── QUALIFICATION TYPE ───────────────────────────────────────────
    qualification_type = Column(
        String(20), nullable=False
    )  # RANGE, PME, LICENSE, CERT, SCHOOL, OTHER

    # ─── QUALIFICATION DETAILS ────────────────────────────────────────
    qualification_name = Column(String(100), nullable=False)
    # Examples: "Rifle Range - Expert", "TBS Completed", "HMMWV License", "CWS2"

    # ─── DATES ────────────────────────────────────────────────────────
    date_achieved = Column(Date, nullable=False, index=True)
    expiration_date = Column(Date, nullable=True)  # NULL if no expiry (permanent)

    # ─── CURRENT STATUS ───────────────────────────────────────────────
    is_current = Column(
        Boolean, default=True
    )  # TRUE if not expired; auto-managed by service

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────
    personnel = relationship("Personnel", back_populates="qualifications")
```

---

### 1.3 Update Related Models

Update `backend/app/models/unit.py` to add relationships:

```python
# In the Unit model class, add:

billets = relationship(
    "BilletStructure", back_populates="unit", cascade="all, delete-orphan"
)
manning_snapshots = relationship(
    "ManningSnapshot", back_populates="unit", cascade="all, delete-orphan"
)
```

---

## Part 2: Pydantic Schemas

### 2.1 Personnel Schemas (Expand)

**File:** `backend/app/schemas/personnel.py`

Add new schemas:

```python
from datetime import date, datetime
from typing import List, Optional
from enum import Enum

from pydantic import BaseModel, Field

from app.models.personnel import (
    PayGrade,
    RifleQualification,
    SwimQualification,
    SecurityClearance,
    DutyStatus,
)


# ─── PERSONNEL CREATE/UPDATE SCHEMAS ───────────────────────────────────

class PersonnelCreate(BaseModel):
    """Create a new personnel record."""
    edipi: str
    first_name: str
    last_name: str
    rank: Optional[str] = None
    unit_id: Optional[int] = None
    mos: Optional[str] = None
    additional_mos: Optional[str] = None  # JSON string
    blood_type: Optional[str] = None
    pay_grade: Optional[PayGrade] = None
    billet: Optional[str] = None
    date_of_rank: Optional[date] = None
    eaos: Optional[date] = None
    pme_complete: bool = False
    rifle_qual: Optional[RifleQualification] = RifleQualification.UNQUAL
    rifle_qual_date: Optional[date] = None
    pft_score: Optional[int] = Field(None, ge=0, le=300)
    pft_date: Optional[date] = None
    cft_score: Optional[int] = Field(None, ge=0, le=300)
    cft_date: Optional[date] = None
    swim_qual: Optional[SwimQualification] = SwimQualification.UNQUAL
    security_clearance: Optional[SecurityClearance] = SecurityClearance.NONE
    clearance_expiry: Optional[date] = None
    drivers_license_military: bool = False
    duty_status: DutyStatus = DutyStatus.PRESENT
    status: Optional[str] = "ACTIVE"


class PersonnelUpdate(BaseModel):
    """Partial update of personnel record."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    rank: Optional[str] = None
    unit_id: Optional[int] = None
    mos: Optional[str] = None
    additional_mos: Optional[str] = None
    blood_type: Optional[str] = None
    pay_grade: Optional[PayGrade] = None
    billet: Optional[str] = None
    date_of_rank: Optional[date] = None
    eaos: Optional[date] = None
    pme_complete: Optional[bool] = None
    rifle_qual: Optional[RifleQualification] = None
    rifle_qual_date: Optional[date] = None
    pft_score: Optional[int] = Field(None, ge=0, le=300)
    pft_date: Optional[date] = None
    cft_score: Optional[int] = Field(None, ge=0, le=300)
    cft_date: Optional[date] = None
    swim_qual: Optional[SwimQualification] = None
    security_clearance: Optional[SecurityClearance] = None
    clearance_expiry: Optional[date] = None
    drivers_license_military: Optional[bool] = None
    duty_status: Optional[DutyStatus] = None
    status: Optional[str] = None


class PersonnelResponse(BaseModel):
    """Full personnel response with all details and relationships."""
    id: int
    edipi: str
    first_name: str
    last_name: str
    rank: Optional[str]
    unit_id: Optional[int]
    mos: Optional[str]
    additional_mos: Optional[str]
    blood_type: Optional[str]
    status: str
    pay_grade: Optional[PayGrade]
    billet: Optional[str]
    date_of_rank: Optional[date]
    eaos: Optional[date]
    pme_complete: bool
    rifle_qual: Optional[RifleQualification]
    rifle_qual_date: Optional[date]
    pft_score: Optional[int]
    pft_date: Optional[date]
    cft_score: Optional[int]
    cft_date: Optional[date]
    swim_qual: Optional[SwimQualification]
    security_clearance: Optional[SecurityClearance]
    clearance_expiry: Optional[date]
    drivers_license_military: bool
    duty_status: DutyStatus
    weapons: List["WeaponResponse"] = []
    ammo_loads: List["AmmoLoadResponse"] = []
    qualifications: List["QualificationResponse"] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PersonnelSummaryResponse(BaseModel):
    """Summary response for list views."""
    id: int
    edipi: str
    first_name: str
    last_name: str
    rank: Optional[str]
    unit_id: Optional[int]
    mos: Optional[str]
    pay_grade: Optional[PayGrade]
    billet: Optional[str]
    status: str
    duty_status: DutyStatus
    rifle_qual: Optional[RifleQualification]
    pft_score: Optional[int]
    cft_score: Optional[int]

    class Config:
        from_attributes = True
```

### 2.2 Manning Schemas

**File:** `backend/app/schemas/manning.py` (new)

```python
from datetime import date, datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class BilletStructureCreate(BaseModel):
    """Create a T/O billet."""
    unit_id: int
    billet_id_code: str
    billet_title: str
    mos_required: Optional[str] = None
    rank_required: Optional[str] = None
    is_key_billet: bool = False


class BilletStructureUpdate(BaseModel):
    """Update a billet."""
    billet_title: Optional[str] = None
    mos_required: Optional[str] = None
    rank_required: Optional[str] = None
    is_key_billet: Optional[bool] = None
    filled_by_id: Optional[int] = None


class BilletStructureResponse(BaseModel):
    """Full billet response."""
    id: int
    unit_id: int
    billet_id_code: str
    billet_title: str
    mos_required: Optional[str]
    rank_required: Optional[str]
    is_key_billet: bool
    is_filled: bool
    filled_by_id: Optional[int]
    filled_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ManningSnapshotCreate(BaseModel):
    """Create a manning snapshot."""
    unit_id: int
    snapshot_date: date
    authorized_total: int
    assigned_total: int
    present_for_duty: int
    fill_rate_pct: float
    mos_shortfalls: Optional[Dict[str, int]] = None
    rank_distribution: Optional[Dict[str, int]] = None


class ManningSnapshotResponse(BaseModel):
    """Full manning snapshot response."""
    id: int
    unit_id: int
    snapshot_date: date
    authorized_total: int
    assigned_total: int
    present_for_duty: int
    fill_rate_pct: float
    mos_shortfalls: Optional[Dict[str, int]]
    rank_distribution: Optional[Dict[str, int]]
    created_at: datetime

    class Config:
        from_attributes = True


class QualificationCreate(BaseModel):
    """Create a qualification."""
    personnel_id: int
    qualification_type: str  # RANGE, PME, LICENSE, CERT, SCHOOL, OTHER
    qualification_name: str
    date_achieved: date
    expiration_date: Optional[date] = None


class QualificationUpdate(BaseModel):
    """Update a qualification."""
    qualification_name: Optional[str] = None
    date_achieved: Optional[date] = None
    expiration_date: Optional[date] = None
    is_current: Optional[bool] = None


class QualificationResponse(BaseModel):
    """Full qualification response."""
    id: int
    personnel_id: int
    qualification_type: str
    qualification_name: str
    date_achieved: date
    expiration_date: Optional[date]
    is_current: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

---

## Part 3: Backend Services

### 3.1 Personnel Analytics Service

**File:** `backend/app/services/personnel_analytics.py` (new)

```python
"""Personnel analytics and readiness calculations."""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.personnel import Personnel, PersonnelStatus, DutyStatus, PayGrade
from app.models.manning import BilletStructure, ManningSnapshot, Qualification
from app.models.unit import Unit


class PersonnelAnalyticsService:
    """Analytics for personnel and manning data."""

    @staticmethod
    async def get_unit_strength(db: AsyncSession, unit_id: int) -> Dict[str, int]:
        """
        Get current strength breakdown by status.

        Returns:
        {
            "total_authorized": <int>,
            "total_assigned": <int>,
            "present_for_duty": <int>,
            "deployed": <int>,
            "tdy": <int>,
            "leave": <int>,
            "medical": <int>,
            "inactive": <int>,
            "fill_rate_pct": <float>
        }
        """
        # Get all personnel assigned to unit
        query = select(Personnel).where(Personnel.unit_id == unit_id)
        result = await db.execute(query)
        personnel = result.scalars().all()

        total_assigned = len(personnel)

        # Count by status
        status_counts = {}
        present_count = 0
        for p in personnel:
            status = p.status
            status_counts[status] = status_counts.get(status, 0) + 1
            if p.duty_status == DutyStatus.PRESENT:
                present_count += 1

        # Count billets to get authorized strength
        billets_query = select(func.count(BilletStructure.id)).where(
            BilletStructure.unit_id == unit_id
        )
        billets_result = await db.execute(billets_query)
        authorized_total = billets_result.scalar() or total_assigned

        fill_rate = (total_assigned / authorized_total * 100) if authorized_total > 0 else 0

        return {
            "total_authorized": authorized_total,
            "total_assigned": total_assigned,
            "present_for_duty": present_count,
            "deployed": status_counts.get(PersonnelStatus.DEPLOYED, 0),
            "tdy": status_counts.get(PersonnelStatus.TDY, 0),
            "leave": status_counts.get(PersonnelStatus.LEAVE, 0),
            "medical": status_counts.get(PersonnelStatus.MEDICAL, 0),
            "inactive": status_counts.get(PersonnelStatus.INACTIVE, 0),
            "fill_rate_pct": round(fill_rate, 2),
        }

    @staticmethod
    async def get_mos_fill(db: AsyncSession, unit_id: int) -> Dict[str, Dict[str, int]]:
        """
        Get T/O vs assigned personnel by MOS.

        Returns:
        {
            "5502": {"required": 8, "assigned": 6, "shortfall": -2},
            "0311": {"required": 12, "assigned": 12, "shortfall": 0},
            ...
        }
        """
        # Get all billets requiring an MOS
        billets_query = (
            select(BilletStructure.mos_required, func.count(BilletStructure.id))
            .where(
                and_(
                    BilletStructure.unit_id == unit_id,
                    BilletStructure.mos_required.isnot(None),
                )
            )
            .group_by(BilletStructure.mos_required)
        )
        billets_result = await db.execute(billets_query)
        billet_counts = dict(billets_result.all())

        # Get assigned personnel by primary MOS
        personnel_query = (
            select(Personnel.mos, func.count(Personnel.id))
            .where(
                and_(
                    Personnel.unit_id == unit_id,
                    Personnel.mos.isnot(None),
                )
            )
            .group_by(Personnel.mos)
        )
        personnel_result = await db.execute(personnel_query)
        personnel_counts = dict(personnel_result.all())

        # Build response
        all_mos = set(billet_counts.keys()) | set(personnel_counts.keys())
        result = {}
        for mos in sorted(all_mos):
            required = billet_counts.get(mos, 0)
            assigned = personnel_counts.get(mos, 0)
            result[mos] = {
                "required": required,
                "assigned": assigned,
                "shortfall": assigned - required,
            }

        return result

    @staticmethod
    async def get_qualification_status(
        db: AsyncSession, unit_id: int
    ) -> Dict[str, Dict[str, int]]:
        """
        Get percentage of personnel current on each qualification type.

        Returns:
        {
            "rifle_range": {"total": 45, "current": 42, "percent": 93.3},
            "pft": {"total": 45, "current": 44, "percent": 97.8},
            ...
        }
        """
        # Get all personnel in unit
        personnel_query = select(Personnel).where(Personnel.unit_id == unit_id)
        personnel_result = await db.execute(personnel_query)
        personnel_list = personnel_result.scalars().all()
        total = len(personnel_list)

        if total == 0:
            return {}

        # Rifle Range
        rifle_qual_count = sum(1 for p in personnel_list if p.rifle_qual != "UNQUAL")

        # PFT
        pft_count = sum(
            1
            for p in personnel_list
            if p.pft_score and p.pft_date and (date.today() - p.pft_date).days <= 180
        )

        # CFT
        cft_count = sum(
            1
            for p in personnel_list
            if p.cft_score and p.cft_date and (date.today() - p.cft_date).days <= 180
        )

        # Swim
        swim_qual_count = sum(1 for p in personnel_list if p.swim_qual != "UNQUAL")

        result = {
            "rifle_range": {
                "total": total,
                "current": rifle_qual_count,
                "percent": round(rifle_qual_count / total * 100, 1),
            },
            "pft": {
                "total": total,
                "current": pft_count,
                "percent": round(pft_count / total * 100, 1),
            },
            "cft": {
                "total": total,
                "current": cft_count,
                "percent": round(cft_count / total * 100, 1),
            },
            "swim": {
                "total": total,
                "current": swim_qual_count,
                "percent": round(swim_qual_count / total * 100, 1),
            },
        }

        return result

    @staticmethod
    async def get_upcoming_losses(
        db: AsyncSession, unit_id: int, days: int = 90
    ) -> List[Dict]:
        """
        Get personnel EASing (End of Active Service) within N days.

        Returns:
        [
            {
                "id": 123,
                "edipi": "1234567890",
                "first_name": "John",
                "last_name": "Doe",
                "rank": "GySgt",
                "mos": "0311",
                "eaos": "2024-04-15",
                "days_until_eas": 47
            },
            ...
        ]
        """
        cutoff_date = date.today() + timedelta(days=days)
        query = (
            select(Personnel)
            .where(
                and_(
                    Personnel.unit_id == unit_id,
                    Personnel.eaos.isnot(None),
                    Personnel.eaos <= cutoff_date,
                    Personnel.eaos > date.today(),
                )
            )
            .order_by(Personnel.eaos)
        )
        result = await db.execute(query)
        personnel = result.scalars().all()

        losses = []
        for p in personnel:
            days_until = (p.eaos - date.today()).days
            losses.append(
                {
                    "id": p.id,
                    "edipi": p.edipi,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "rank": p.rank,
                    "mos": p.mos,
                    "pay_grade": p.pay_grade,
                    "billet": p.billet,
                    "eaos": p.eaos,
                    "days_until_eas": days_until,
                }
            )

        return losses

    @staticmethod
    async def get_key_billet_vacancies(db: AsyncSession, unit_id: int) -> List[Dict]:
        """
        Get all unfilled key billets.

        Returns:
        [
            {
                "id": 1,
                "billet_id_code": "0301-O3-01",
                "billet_title": "Company Commander",
                "mos_required": "0301",
                "rank_required": "O3",
                "is_filled": False
            },
            ...
        ]
        """
        query = (
            select(BilletStructure)
            .where(
                and_(
                    BilletStructure.unit_id == unit_id,
                    BilletStructure.is_key_billet == True,
                    BilletStructure.is_filled == False,
                )
            )
            .order_by(BilletStructure.billet_title)
        )
        result = await db.execute(query)
        billets = result.scalars().all()

        vacancies = [
            {
                "id": b.id,
                "billet_id_code": b.billet_id_code,
                "billet_title": b.billet_title,
                "mos_required": b.mos_required,
                "rank_required": b.rank_required,
                "is_filled": b.is_filled,
            }
            for b in billets
        ]

        return vacancies

    @staticmethod
    async def calculate_personnel_readiness(db: AsyncSession, unit_id: int) -> Dict:
        """
        Calculate overall P-rating (Personnel Readiness) for a unit.

        Factors:
        - Fill rate (50%)
        - Qualification status (30%)
        - Fitness (PFT/CFT) (20%)

        Returns:
        {
            "p_rating": "P1",  # P1, P2, P3, P4, P5
            "percent_ready": 87.5,
            "fill_rate_pct": 92.0,
            "qualification_pct": 88.0,
            "fitness_pct": 85.0
        }
        """
        strength = await PersonnelAnalyticsService.get_unit_strength(db, unit_id)
        qual_status = await PersonnelAnalyticsService.get_qualification_status(
            db, unit_id
        )

        fill_rate = strength.get("fill_rate_pct", 0)

        # Average qualification currency
        qual_pcts = [v["percent"] for v in qual_status.values()]
        qual_avg = sum(qual_pcts) / len(qual_pcts) if qual_pcts else 0

        # Fitness: average of PFT and CFT currency
        pft_pct = qual_status.get("pft", {}).get("percent", 0)
        cft_pct = qual_status.get("cft", {}).get("percent", 0)
        fitness_avg = (pft_pct + cft_pct) / 2 if (pft_pct or cft_pct) else 0

        # Weighted readiness
        readiness = (fill_rate * 0.5) + (qual_avg * 0.3) + (fitness_avg * 0.2)

        # P-rating
        if readiness >= 90:
            p_rating = "P1"
        elif readiness >= 75:
            p_rating = "P2"
        elif readiness >= 60:
            p_rating = "P3"
        elif readiness >= 45:
            p_rating = "P4"
        else:
            p_rating = "P5"

        return {
            "p_rating": p_rating,
            "percent_ready": round(readiness, 1),
            "fill_rate_pct": round(fill_rate, 1),
            "qualification_pct": round(qual_avg, 1),
            "fitness_pct": round(fitness_avg, 1),
        }
```

---

## Part 4: API Endpoints

### 4.1 Expand Personnel Endpoints

**File:** `backend/app/api/personnel.py` (update)

Add these new endpoints to the existing router:

```python
from app.services.personnel_analytics import PersonnelAnalyticsService
from app.schemas.manning import (
    QualificationCreate,
    QualificationResponse,
    QualificationUpdate,
)
from app.models.manning import Qualification


# ─── NEW: STRENGTH & READINESS ENDPOINTS ────────────────────────────────

@router.get("/strength/{unit_id}")
async def get_unit_strength(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current unit strength report."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    strength = await PersonnelAnalyticsService.get_unit_strength(db, unit_id)
    return strength


@router.get("/mos-fill/{unit_id}")
async def get_mos_fill_rates(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get MOS fill rates vs T/O."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    mos_fill = await PersonnelAnalyticsService.get_mos_fill(db, unit_id)
    return mos_fill


@router.get("/readiness/{unit_id}")
async def get_unit_readiness(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get unit P-rating and readiness metrics."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    readiness = await PersonnelAnalyticsService.calculate_personnel_readiness(
        db, unit_id
    )
    return readiness


@router.get("/upcoming-losses/{unit_id}")
async def get_upcoming_losses(
    unit_id: int,
    days: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personnel EASing within N days."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    losses = await PersonnelAnalyticsService.get_upcoming_losses(db, unit_id, days)
    return losses


@router.get("/qualifications/{person_id}", response_model=List[QualificationResponse])
async def get_personnel_qualifications(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all qualifications for a personnel."""
    person_result = await db.execute(select(Personnel).where(Personnel.id == person_id))
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", person_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", person_id)

    query = select(Qualification).where(Qualification.personnel_id == person_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/qualifications",
    response_model=QualificationResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_qualification(
    data: QualificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a qualification to a personnel record."""
    person_result = await db.execute(
        select(Personnel).where(Personnel.id == data.personnel_id)
    )
    person = person_result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", data.personnel_id)

    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Personnel", data.personnel_id)

    qual = Qualification(
        personnel_id=data.personnel_id,
        qualification_type=data.qualification_type,
        qualification_name=data.qualification_name,
        date_achieved=data.date_achieved,
        expiration_date=data.expiration_date,
        is_current=True,
    )
    db.add(qual)
    await db.flush()
    await db.refresh(qual)
    return qual


@router.put(
    "/qualifications/{qual_id}",
    response_model=QualificationResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_qualification(
    qual_id: int,
    data: QualificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a qualification."""
    qual_result = await db.execute(
        select(Qualification).where(Qualification.id == qual_id)
    )
    qual = qual_result.scalar_one_or_none()
    if not qual:
        raise NotFoundError("Qualification", qual_id)

    # Verify access to personnel
    person_result = await db.execute(
        select(Personnel).where(Personnel.id == qual.personnel_id)
    )
    person = person_result.scalar_one_or_none()
    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Qualification", qual_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(qual, field, value)

    await db.flush()
    await db.refresh(qual)
    return qual


@router.delete(
    "/qualifications/{qual_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_qualification(
    qual_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a qualification."""
    qual_result = await db.execute(
        select(Qualification).where(Qualification.id == qual_id)
    )
    qual = qual_result.scalar_one_or_none()
    if not qual:
        raise NotFoundError("Qualification", qual_id)

    # Verify access
    person_result = await db.execute(
        select(Personnel).where(Personnel.id == qual.personnel_id)
    )
    person = person_result.scalar_one_or_none()
    accessible = await get_accessible_units(db, current_user)
    if person.unit_id and person.unit_id not in accessible:
        raise NotFoundError("Qualification", qual_id)

    await db.delete(qual)
    await db.flush()
```

### 4.2 New Manning Endpoints

**File:** `backend/app/api/manning.py` (new)

```python
"""Manning, T/O billets, and qualifications endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.manning import BilletStructure, ManningSnapshot
from app.models.personnel import Personnel
from app.models.user import Role, User
from app.schemas.manning import (
    BilletStructureCreate,
    BilletStructureUpdate,
    BilletStructureResponse,
    ManningSnapshotCreate,
    ManningSnapshotResponse,
)
from app.services.personnel_analytics import PersonnelAnalyticsService

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S1, Role.S3]


# ─── BILLET ENDPOINTS ──────────────────────────────────────────────────

@router.get("/billets/{unit_id}", response_model=List[BilletStructureResponse])
async def list_unit_billets(
    unit_id: int,
    filled_only: bool = Query(False),
    key_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List T/O billets for a unit."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    query = select(BilletStructure).where(BilletStructure.unit_id == unit_id)

    if filled_only:
        query = query.where(BilletStructure.is_filled == True)
    if key_only:
        query = query.where(BilletStructure.is_key_billet == True)

    query = query.order_by(BilletStructure.billet_title)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/billets/{unit_id}/vacancies", response_model=List[BilletStructureResponse])
async def get_vacant_billets(
    unit_id: int,
    key_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all unfilled billets for a unit."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    vacancies = await PersonnelAnalyticsService.get_key_billet_vacancies(db, unit_id)
    return vacancies


@router.post(
    "/billets",
    response_model=BilletStructureResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_billet(
    data: BilletStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new T/O billet."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    billet = BilletStructure(**data.model_dump())
    db.add(billet)
    await db.flush()
    await db.refresh(billet)
    return billet


@router.put(
    "/billets/{billet_id}",
    response_model=BilletStructureResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_billet(
    billet_id: int,
    data: BilletStructureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a billet."""
    billet_result = await db.execute(
        select(BilletStructure).where(BilletStructure.id == billet_id)
    )
    billet = billet_result.scalar_one_or_none()
    if not billet:
        raise NotFoundError("BilletStructure", billet_id)

    accessible = await get_accessible_units(db, current_user)
    if billet.unit_id not in accessible:
        raise NotFoundError("BilletStructure", billet_id)

    # If assigning a person, verify they exist and set is_filled
    if data.filled_by_id is not None:
        person_result = await db.execute(
            select(Personnel).where(Personnel.id == data.filled_by_id)
        )
        person = person_result.scalar_one_or_none()
        if not person:
            raise NotFoundError("Personnel", data.filled_by_id)

        from datetime import date as date_module
        billet.filled_by_id = data.filled_by_id
        billet.is_filled = True
        billet.filled_date = date_module.today()
    else:
        billet.is_filled = False
        billet.filled_by_id = None
        billet.filled_date = None

    update_data = data.model_dump(exclude_unset=True, exclude={"filled_by_id"})
    for field, value in update_data.items():
        setattr(billet, field, value)

    await db.flush()
    await db.refresh(billet)
    return billet


@router.delete(
    "/billets/{billet_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_billet(
    billet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a billet."""
    billet_result = await db.execute(
        select(BilletStructure).where(BilletStructure.id == billet_id)
    )
    billet = billet_result.scalar_one_or_none()
    if not billet:
        raise NotFoundError("BilletStructure", billet_id)

    accessible = await get_accessible_units(db, current_user)
    if billet.unit_id not in accessible:
        raise NotFoundError("BilletStructure", billet_id)

    await db.delete(billet)
    await db.flush()


# ─── MANNING SNAPSHOT ENDPOINTS ────────────────────────────────────────

@router.get(
    "/snapshots/{unit_id}", response_model=List[ManningSnapshotResponse]
)
async def list_manning_snapshots(
    unit_id: int,
    limit: int = Query(12, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent manning snapshots for a unit."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    query = (
        select(ManningSnapshot)
        .where(ManningSnapshot.unit_id == unit_id)
        .order_by(ManningSnapshot.snapshot_date.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/snapshots",
    response_model=ManningSnapshotResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_manning_snapshot(
    data: ManningSnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a manning snapshot."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    snapshot = ManningSnapshot(**data.model_dump())
    db.add(snapshot)
    await db.flush()
    await db.refresh(snapshot)
    return snapshot
```

---

## Part 5: Frontend Components

### 5.1 PersonnelPage.tsx (NEW)

**File:** `frontend/src/pages/PersonnelPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlphaRosterTable from '@/components/personnel/AlphaRosterTable';
import StrengthChart from '@/components/personnel/StrengthChart';
import BilletTracker from '@/components/personnel/BilletTracker';
import QualificationMatrix from '@/components/personnel/QualificationMatrix';
import EASTimeline from '@/components/personnel/EASTimeline';
import ReadinessIndicator from '@/components/personnel/ReadinessIndicator';
import UnitSelector from '@/components/common/UnitSelector';

export default function PersonnelPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const strengthQuery = useQuery({
    queryKey: ['personnel-strength', selectedUnitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel/strength/${selectedUnitId}`);
      return res.json();
    },
    enabled: !!selectedUnitId,
  });

  const readinessQuery = useQuery({
    queryKey: ['personnel-readiness', selectedUnitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel/readiness/${selectedUnitId}`);
      return res.json();
    },
    enabled: !!selectedUnitId,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Personnel & Manning</h1>
        <p className="text-gray-500 mt-2">Unit strength, billets, qualifications, and readiness</p>
      </div>

      <UnitSelector value={selectedUnitId} onChange={setSelectedUnitId} />

      {selectedUnitId && (
        <>
          {/* ─── Readiness Summary ─────────────────────────────────────────── */}
          {readinessQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle>Unit Readiness (P-Rating)</CardTitle>
              </CardHeader>
              <CardContent>
                <ReadinessIndicator data={readinessQuery.data} />
              </CardContent>
            </Card>
          )}

          {/* ─── Strength Overview ────────────────────────────────────────── */}
          {strengthQuery.data && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Authorized</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strengthQuery.data.total_authorized}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strengthQuery.data.total_assigned}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strengthQuery.data.present_for_duty}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Fill Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strengthQuery.data.fill_rate_pct}%</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tabbed Content ───────────────────────────────────────────── */}
          <Tabs defaultValue="roster" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="roster">Alpha Roster</TabsTrigger>
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="billets">Billets</TabsTrigger>
              <TabsTrigger value="quals">Qualifications</TabsTrigger>
              <TabsTrigger value="eas">EAS Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="roster" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alpha Roster</CardTitle>
                  <CardDescription>All personnel assigned to unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlphaRosterTable unitId={selectedUnitId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strength" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Strength Report</CardTitle>
                  <CardDescription>MOS fill rates and shortfalls</CardDescription>
                </CardHeader>
                <CardContent>
                  <StrengthChart unitId={selectedUnitId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billet Tracker</CardTitle>
                  <CardDescription>T/O structure and key billet vacancies</CardDescription>
                </CardHeader>
                <CardContent>
                  <BilletTracker unitId={selectedUnitId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Qualification Matrix</CardTitle>
                  <CardDescription>Personnel currency on required qualifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <QualificationMatrix unitId={selectedUnitId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>EAS Timeline</CardTitle>
                  <CardDescription>Personnel separating in next 90 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <EASTimeline unitId={selectedUnitId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
```

### 5.2 Sub-Components

**File:** `frontend/src/components/personnel/AlphaRosterTable.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';

interface Personnel {
  id: number;
  edipi: string;
  first_name: string;
  last_name: string;
  rank: string;
  mos: string;
  pay_grade: string;
  billet: string;
  status: string;
  duty_status: string;
  rifle_qual: string;
  pft_score: number | null;
  cft_score: number | null;
}

export default function AlphaRosterTable({ unitId }: { unitId: number }) {
  const query = useQuery({
    queryKey: ['personnel-list', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel?unit_id=${unitId}&limit=500`);
      return res.json() as Promise<Personnel[]>;
    },
    enabled: !!unitId,
  });

  const columnHelper = createColumnHelper<Personnel>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('last_name', {
        header: 'Name',
        cell: (info) => {
          const row = info.row.original;
          return `${row.last_name}, ${row.first_name}`;
        },
      }),
      columnHelper.accessor('edipi', {
        header: 'EDIPI',
      }),
      columnHelper.accessor('rank', {
        header: 'Rank',
      }),
      columnHelper.accessor('pay_grade', {
        header: 'Pay Grade',
      }),
      columnHelper.accessor('mos', {
        header: 'MOS',
      }),
      columnHelper.accessor('billet', {
        header: 'Billet',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() === 'ACTIVE' ? 'default' : 'secondary'}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('duty_status', {
        header: 'Duty Status',
      }),
      columnHelper.accessor('rifle_qual', {
        header: 'Rifle Qual',
        cell: (info) => {
          const qual = info.getValue();
          const colorMap: Record<string, string> = {
            EXPERT: 'text-green-600',
            SHARPSHOOTER: 'text-blue-600',
            MARKSMAN: 'text-yellow-600',
            UNQUAL: 'text-red-600',
          };
          return <span className={colorMap[qual]}>{qual}</span>;
        },
      }),
      columnHelper.accessor('pft_score', {
        header: 'PFT',
        cell: (info) => info.getValue()?.toString() || '—',
      }),
      columnHelper.accessor('cft_score', {
        header: 'CFT',
        cell: (info) => info.getValue()?.toString() || '—',
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return <DataTable table={table} isLoading={query.isLoading} />;
}
```

**File:** `frontend/src/components/personnel/StrengthChart.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StrengthChart({ unitId }: { unitId: number }) {
  const query = useQuery({
    queryKey: ['mos-fill', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel/mos-fill/${unitId}`);
      return res.json();
    },
    enabled: !!unitId,
  });

  const chartData = useMemo(() => {
    if (!query.data) return [];
    return Object.entries(query.data).map(([mos, data]: [string, any]) => ({
      mos,
      required: data.required,
      assigned: data.assigned,
      shortfall: Math.abs(data.shortfall),
    }));
  }, [query.data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mos" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="required" fill="#8884d8" />
        <Bar dataKey="assigned" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**File:** `frontend/src/components/personnel/BilletTracker.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Billet {
  id: number;
  billet_id_code: string;
  billet_title: string;
  mos_required: string;
  rank_required: string;
  is_key_billet: boolean;
  is_filled: boolean;
}

export default function BilletTracker({ unitId }: { unitId: number }) {
  const billetQuery = useQuery({
    queryKey: ['billets', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/manning/billets/${unitId}`);
      return res.json() as Promise<Billet[]>;
    },
    enabled: !!unitId,
  });

  const vacancyQuery = useQuery({
    queryKey: ['billet-vacancies', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/manning/billets/${unitId}/vacancies`);
      return res.json() as Promise<Billet[]>;
    },
    enabled: !!unitId,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Billets</p>
              <p className="text-3xl font-bold">{billetQuery.data?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Vacancies</p>
              <p className="text-3xl font-bold text-red-600">{vacancyQuery.data?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {vacancyQuery.data && vacancyQuery.data.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-red-600">Key Billet Vacancies</h4>
          {vacancyQuery.data.map((billet) => (
            <Card key={billet.id} className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{billet.billet_title}</p>
                    <p className="text-sm text-gray-600">{billet.billet_id_code}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requires: {billet.rank_required || '—'} {billet.mos_required || '—'}
                    </p>
                  </div>
                  <Badge variant="destructive">VACANT</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**File:** `frontend/src/components/personnel/EASTimeline.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EASRecord {
  id: number;
  edipi: string;
  first_name: string;
  last_name: string;
  rank: string;
  mos: string;
  eaos: string;
  days_until_eas: number;
}

export default function EASTimeline({ unitId }: { unitId: number }) {
  const query = useQuery({
    queryKey: ['upcoming-losses', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel/upcoming-losses/${unitId}?days=90`);
      return res.json() as Promise<EASRecord[]>;
    },
    enabled: !!unitId,
  });

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return 'bg-red-100 border-l-red-500';
    if (days <= 60) return 'bg-yellow-100 border-l-yellow-500';
    return 'bg-blue-100 border-l-blue-500';
  };

  return (
    <div className="space-y-3">
      {query.data && query.data.length === 0 && (
        <p className="text-gray-500 text-center py-8">No personnel EASing in next 90 days</p>
      )}
      {query.data?.map((loss) => (
        <Card key={loss.id} className={`border-l-4 ${getUrgencyColor(loss.days_until_eas)}`}>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">
                  {loss.rank} {loss.last_name}, {loss.first_name}
                </p>
                <p className="text-sm text-gray-600">
                  {loss.mos} • EDIPI {loss.edipi}
                </p>
                <p className="text-xs text-gray-500 mt-1">EAS: {loss.eaos}</p>
              </div>
              <Badge variant="outline">{loss.days_until_eas} days</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**File:** `frontend/src/components/personnel/ReadinessIndicator.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReadinessData {
  p_rating: string;
  percent_ready: number;
  fill_rate_pct: number;
  qualification_pct: number;
  fitness_pct: number;
}

export default function ReadinessIndicator({ data }: { data: ReadinessData }) {
  const ratingColor: Record<string, string> = {
    P1: 'text-green-600 bg-green-50',
    P2: 'text-blue-600 bg-blue-50',
    P3: 'text-yellow-600 bg-yellow-50',
    P4: 'text-orange-600 bg-orange-50',
    P5: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${ratingColor[data.p_rating]}`}>
        <div className="text-center">
          <p className="text-sm font-semibold mb-2">Unit P-Rating</p>
          <p className="text-5xl font-bold">{data.p_rating}</p>
          <p className="text-sm mt-2">{data.percent_ready}% Ready</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Fill Rate</p>
          <Progress value={data.fill_rate_pct} className="mb-1" />
          <p className="text-xs text-gray-600">{data.fill_rate_pct}%</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Qualifications</p>
          <Progress value={data.qualification_pct} className="mb-1" />
          <p className="text-xs text-gray-600">{data.qualification_pct}%</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Fitness</p>
          <Progress value={data.fitness_pct} className="mb-1" />
          <p className="text-xs text-gray-600">{data.fitness_pct}%</p>
        </div>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/personnel/QualificationMatrix.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';

export default function QualificationMatrix({ unitId }: { unitId: number }) {
  const query = useQuery({
    queryKey: ['qual-status', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/personnel/qualifications?unit_id=${unitId}`);
      return res.json();
    },
    enabled: !!unitId,
  });

  if (query.isLoading) return <Spinner />;

  const qualTypes = [
    { key: 'rifle_range', label: 'Rifle Range', color: 'bg-green-100' },
    { key: 'pft', label: 'PFT', color: 'bg-blue-100' },
    { key: 'cft', label: 'CFT', color: 'bg-purple-100' },
    { key: 'swim', label: 'Swim Qual', color: 'bg-cyan-100' },
  ];

  return (
    <div className="space-y-4">
      {qualTypes.map((qt) => {
        const data = query.data?.[qt.key];
        if (!data) return null;

        const percent = data.percent || 0;
        const isCurrent = percent >= 85;

        return (
          <div key={qt.key} className={`p-4 rounded-lg ${qt.color}`}>
            <div className="flex justify-between items-center">
              <p className="font-semibold">{qt.label}</p>
              <p className={isCurrent ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {data.current}/{data.total} ({percent}%)
              </p>
            </div>
            <div className="w-full bg-gray-300 rounded h-2 mt-2">
              <div
                className={`h-full rounded ${isCurrent ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Part 6: Seed Data

### 6.1 Battalion T/O Structure

**File:** `backend/seed/seed_manning_2_5.py`

```python
"""Seed T/O billets for 2nd Battalion, 5th Marines."""

from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import BilletStructure
from app.models.unit import Unit


async def seed_2_5_billets(db: AsyncSession):
    """Create realistic T/O billets for 2/5."""

    # Get or create unit (should already exist from equipment seeding)
    unit = await db.get(Unit, value=1)  # Adjust based on your unit hierarchy
    if not unit:
        print("Unit not found for seeding billets")
        return

    billets = [
        # ─── BATTALION COMMAND ──────────────────────────────────────────
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0301-O5-01",
            billet_title="Battalion Commander",
            mos_required="0301",
            rank_required="O5",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0301-O4-01",
            billet_title="Battalion S1",
            mos_required="0401",
            rank_required="O4",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0301-E8-01",
            billet_title="Battalion Master Gunnery Sergeant",
            mos_required="0302",
            rank_required="E8",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0301-E8-02",
            billet_title="Battalion Sergeant Major",
            mos_required="0302",
            rank_required="E8",
            is_key_billet=True,
            is_filled=False,
        ),

        # ─── ALPHA COMPANY ──────────────────────────────────────────────
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0311-O3-01",
            billet_title="Company Commander (A Co)",
            mos_required="0311",
            rank_required="O3",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0311-E6-01",
            billet_title="Company Gunnery Sergeant (A Co)",
            mos_required="0311",
            rank_required="E6",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0311-E5-01",
            billet_title="Plt Sgt 1st Plt (A Co)",
            mos_required="0311",
            rank_required="E5",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0311-E5-02",
            billet_title="Plt Sgt 2nd Plt (A Co)",
            mos_required="0311",
            rank_required="E5",
            is_key_billet=True,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0311-E5-03",
            billet_title="Plt Sgt 3rd Plt (A Co)",
            mos_required="0311",
            rank_required="E5",
            is_key_billet=True,
            is_filled=False,
        ),

        # ─── RIFLE SQUAD LEADERS (SAMPLE) ──────────────────────────────
        *[
            BilletStructure(
                unit_id=unit.id,
                billet_id_code=f"0311-E4-{i:02d}",
                billet_title=f"Squad Leader {i}",
                mos_required="0311",
                rank_required="E4",
                is_key_billet=False,
                is_filled=False,
            )
            for i in range(1, 10)
        ],

        # ─── SUPPORT MOS ───────────────────────────────────────────────
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0451-E5-01",
            billet_title="Machine Gunner",
            mos_required="0451",
            rank_required="E3",
            is_key_billet=False,
            is_filled=False,
        ),
        BilletStructure(
            unit_id=unit.id,
            billet_id_code="0341-E5-01",
            billet_title="Mortar Fire Control Sergeant",
            mos_required="0341",
            rank_required="E5",
            is_key_billet=False,
            is_filled=False,
        ),
    ]

    db.add_all(billets)
    await db.flush()
    print(f"Seeded {len(billets)} billets for unit {unit.name}")


# Call from main seed script
```

### 6.2 Qualifications Master List

**File:** `backend/seed/seed_qualifications_master.py`

```python
"""Master list of common USMC qualifications."""

from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import Qualification
from app.models.personnel import Personnel


QUALIFICATION_TEMPLATES = [
    # ─── RIFLE RANGE ──────────────────────────────────────────────────
    {
        "qualification_type": "RANGE",
        "qualification_name": "Rifle Range - Expert",
        "expires_days": 365,
    },
    {
        "qualification_type": "RANGE",
        "qualification_name": "Rifle Range - Sharpshooter",
        "expires_days": 365,
    },
    {
        "qualification_type": "RANGE",
        "qualification_name": "Rifle Range - Marksman",
        "expires_days": 365,
    },

    # ─── PHYSICAL FITNESS ──────────────────────────────────────────────
    {
        "qualification_type": "CERT",
        "qualification_name": "PFT Passed",
        "expires_days": 180,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "CFT Passed",
        "expires_days": 180,
    },

    # ─── SWIM QUALIFICATIONS ──────────────────────────────────────────
    {
        "qualification_type": "CERT",
        "qualification_name": "Combat Water Survival - Level 1",
        "expires_days": None,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Combat Water Survival - Level 2",
        "expires_days": None,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Combat Water Survival - Level 3",
        "expires_days": None,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Combat Water Survival - Level 4",
        "expires_days": None,
    },

    # ─── PME SCHOOLS ──────────────────────────────────────────────────
    {
        "qualification_type": "SCHOOL",
        "qualification_name": "Marine Corps Martial Arts Program - Yellow Belt",
        "expires_days": None,
    },
    {
        "qualification_type": "SCHOOL",
        "qualification_name": "Marine Corps Martial Arts Program - Green Belt",
        "expires_days": None,
    },
    {
        "qualification_type": "SCHOOL",
        "qualification_name": "Marine Corps Martial Arts Program - Brown Belt",
        "expires_days": None,
    },
    {
        "qualification_type": "PME",
        "qualification_name": "Lance Corporal Course (LCC) Completed",
        "expires_days": None,
    },
    {
        "qualification_type": "PME",
        "qualification_name": "Sergeant Course (SCC) Completed",
        "expires_days": None,
    },
    {
        "qualification_type": "PME",
        "qualification_name": "Staff Sergeant Course (SSCC) Completed",
        "expires_days": None,
    },
    {
        "qualification_type": "PME",
        "qualification_name": "Gunnery Sergeant Course (GSC) Completed",
        "expires_days": None,
    },

    # ─── DRIVER LICENSES ───────────────────────────────────────────────
    {
        "qualification_type": "LICENSE",
        "qualification_name": "HMMWV Military Driver License",
        "expires_days": 365,
    },
    {
        "qualification_type": "LICENSE",
        "qualification_name": "Heavy Truck Military Driver License",
        "expires_days": 365,
    },
    {
        "qualification_type": "LICENSE",
        "qualification_name": "Helicopter Crew Member",
        "expires_days": None,
    },

    # ─── SECURITY CERTIFICATIONS ──────────────────────────────────────
    {
        "qualification_type": "CERT",
        "qualification_name": "Secret Security Clearance",
        "expires_days": 1825,  # 5 years
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Top Secret Security Clearance",
        "expires_days": 1825,
    },

    # ─── MOS-SPECIFIC ─────────────────────────────────────────────────
    {
        "qualification_type": "CERT",
        "qualification_name": "Basic Infantry Course",
        "expires_days": None,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Combat Marksmanship Instructor",
        "expires_days": 365,
    },
    {
        "qualification_type": "CERT",
        "qualification_name": "Nuclear/Biological/Chemical Defense (NBCD)",
        "expires_days": 365,
    },
]


async def create_sample_qualifications(db: AsyncSession):
    """Create sample qualifications for existing personnel (optional)."""
    # This is demo code; in practice, seeding would be done via data import
    query = select(Personnel).limit(5)
    result = await db.execute(query)
    personnel_list = result.scalars().all()

    for person in personnel_list:
        # Add a few random quals
        quals = [
            Qualification(
                personnel_id=person.id,
                qualification_type="RANGE",
                qualification_name="Rifle Range - Expert",
                date_achieved=date.today() - timedelta(days=30),
                expiration_date=date.today() + timedelta(days=335),
                is_current=True,
            ),
            Qualification(
                personnel_id=person.id,
                qualification_type="CERT",
                qualification_name="PFT Passed",
                date_achieved=date.today() - timedelta(days=60),
                expiration_date=date.today() + timedelta(days=120),
                is_current=True,
            ),
        ]
        db.add_all(quals)

    await db.flush()
    print(f"Seeded qualifications for {len(personnel_list)} personnel")
```

---

## Part 7: Routes & Integration

### 7.1 Add Routes to Main App

**File:** `backend/app/main.py` (update)

```python
from app.api import personnel, manning

app.include_router(personnel.router, prefix="/api/v1/personnel", tags=["personnel"])
app.include_router(manning.router, prefix="/api/v1/manning", tags=["manning"])
```

### 7.2 Update Frontend Router

**File:** `frontend/src/App.tsx` or routing config (update)

```typescript
import PersonnelPage from '@/pages/PersonnelPage';

const routes = [
  // ... existing routes
  {
    path: '/personnel',
    element: <PersonnelPage />,
    label: 'Personnel',
  },
];
```

---

## Part 8: Implementation Checklist

- [ ] Create/update Personnel model with all new fields
- [ ] Create manning.py models (BilletStructure, ManningSnapshot, Qualification)
- [ ] Update Unit model with relationships
- [ ] Create personnel schemas (expanded)
- [ ] Create manning schemas
- [ ] Implement PersonnelAnalyticsService
- [ ] Add strength/readiness/quals endpoints to personnel.py
- [ ] Create manning.py API router with billet/snapshot endpoints
- [ ] Build PersonnelPage.tsx
- [ ] Build sub-components (AlphaRosterTable, StrengthChart, BilletTracker, QualificationMatrix, EASTimeline, ReadinessIndicator)
- [ ] Seed 2/5 T/O billets
- [ ] Seed qualifications master list
- [ ] Add routes to main app
- [ ] Test end-to-end: create personnel, assign to billets, track quals
- [ ] QA: build passes, tests pass, no console errors

---

## Acceptance Criteria

1. **Models** — Personnel fully enriched; Manning models working with correct relationships
2. **API** — All endpoints return correct schemas and properly filter by user access
3. **Frontend** — PersonnelPage renders without errors; all tabs functional
4. **Analytics** — Strength, MOS fill, qualifications, EAS, readiness correctly calculated
5. **Seed Data** — At least 1 Battalion T/O seeded; qualifications template available
6. **Builds** — No TypeScript errors; all imports correct
7. **Tests** — Pass all build and unit tests
