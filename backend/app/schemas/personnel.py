"""Personnel, weapon, ammo, convoy vehicle/assignment schemas."""

import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.personnel import ConvoyRole, PersonnelStatus


# --- Weapon schemas ---


class WeaponCreate(BaseModel):
    weapon_type: str = Field(..., max_length=50)
    serial_number: str = Field(..., max_length=50)
    optic: Optional[str] = Field(None, max_length=50)
    accessories: Optional[List[str]] = None

    @field_validator("accessories", mode="before")
    @classmethod
    def parse_accessories(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v


class WeaponUpdate(BaseModel):
    weapon_type: Optional[str] = Field(None, max_length=50)
    serial_number: Optional[str] = Field(None, max_length=50)
    optic: Optional[str] = Field(None, max_length=50)
    accessories: Optional[List[str]] = None

    @field_validator("accessories", mode="before")
    @classmethod
    def parse_accessories(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v


class WeaponResponse(BaseModel):
    id: int
    personnel_id: int
    weapon_type: str
    serial_number: str
    optic: Optional[str] = None
    accessories: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("accessories", mode="before")
    @classmethod
    def parse_accessories(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v


# --- AmmoLoad schemas ---


class AmmoLoadCreate(BaseModel):
    caliber: str = Field(..., max_length=20)
    magazine_count: int = Field(..., ge=0)
    rounds_per_magazine: int = Field(..., ge=0)


class AmmoLoadUpdate(BaseModel):
    caliber: Optional[str] = Field(None, max_length=20)
    magazine_count: Optional[int] = Field(None, ge=0)
    rounds_per_magazine: Optional[int] = Field(None, ge=0)


class AmmoLoadResponse(BaseModel):
    id: int
    personnel_id: int
    caliber: str
    magazine_count: int
    rounds_per_magazine: int
    total_rounds: int

    model_config = ConfigDict(from_attributes=True)


# --- Personnel schemas ---


class PersonnelCreate(BaseModel):
    edipi: str = Field(..., pattern=r"^\d{10}$")
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    rank: Optional[str] = Field(None, max_length=20)
    unit_id: Optional[int] = None
    mos: Optional[str] = Field(None, max_length=10)
    blood_type: Optional[str] = Field(None, max_length=5)
    status: PersonnelStatus = PersonnelStatus.ACTIVE
    weapons: Optional[List[WeaponCreate]] = None
    ammo_loads: Optional[List[AmmoLoadCreate]] = None


class PersonnelUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    rank: Optional[str] = Field(None, max_length=20)
    unit_id: Optional[int] = None
    mos: Optional[str] = Field(None, max_length=10)
    blood_type: Optional[str] = Field(None, max_length=5)
    status: Optional[PersonnelStatus] = None


class PersonnelSummaryResponse(BaseModel):
    id: int
    edipi: str
    first_name: str
    last_name: str
    rank: Optional[str] = None
    mos: Optional[str] = None
    status: PersonnelStatus

    model_config = ConfigDict(from_attributes=True)


class PersonnelResponse(BaseModel):
    id: int
    edipi: str
    first_name: str
    last_name: str
    rank: Optional[str] = None
    unit_id: Optional[int] = None
    mos: Optional[str] = None
    blood_type: Optional[str] = None
    status: PersonnelStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    weapons: List[WeaponResponse] = []
    ammo_loads: List[AmmoLoadResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- ConvoyVehicle schemas ---


class ConvoyVehicleCreate(BaseModel):
    vehicle_type: str = Field(..., max_length=80)
    tamcn: Optional[str] = Field(None, max_length=20)
    bumper_number: Optional[str] = Field(None, max_length=20)
    call_sign: Optional[str] = Field(None, max_length=30)
    sequence_number: Optional[int] = None


class ConvoyVehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = Field(None, max_length=80)
    tamcn: Optional[str] = Field(None, max_length=20)
    bumper_number: Optional[str] = Field(None, max_length=20)
    call_sign: Optional[str] = Field(None, max_length=30)
    sequence_number: Optional[int] = None


class ConvoyPersonnelCreate(BaseModel):
    personnel_id: int
    convoy_vehicle_id: Optional[int] = None
    role: ConvoyRole


class ConvoyPersonnelUpdate(BaseModel):
    convoy_vehicle_id: Optional[int] = None
    role: Optional[ConvoyRole] = None


class ConvoyPersonnelResponse(BaseModel):
    id: int
    movement_id: int
    personnel_id: int
    convoy_vehicle_id: Optional[int] = None
    role: ConvoyRole
    personnel: PersonnelSummaryResponse

    model_config = ConfigDict(from_attributes=True)


class ConvoyVehicleResponse(BaseModel):
    id: int
    movement_id: int
    vehicle_type: str
    tamcn: Optional[str] = None
    bumper_number: Optional[str] = None
    call_sign: Optional[str] = None
    sequence_number: Optional[int] = None
    assigned_personnel: List[ConvoyPersonnelResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Manifest schemas ---


class BulkVehicleEntry(BaseModel):
    vehicle_type: str = Field(..., max_length=80)
    tamcn: Optional[str] = Field(None, max_length=20)
    bumper_number: Optional[str] = Field(None, max_length=20)
    call_sign: Optional[str] = Field(None, max_length=30)
    sequence_number: Optional[int] = None
    personnel: List[ConvoyPersonnelCreate] = []


class BulkManifestCreate(BaseModel):
    vehicles: List[BulkVehicleEntry] = []
    unassigned_personnel: List[ConvoyPersonnelCreate] = []


class ConvoyManifestResponse(BaseModel):
    movement_id: int
    vehicles: List[ConvoyVehicleResponse] = []
    unassigned_personnel: List[ConvoyPersonnelResponse] = []
    total_vehicles: int = 0
    total_personnel: int = 0
