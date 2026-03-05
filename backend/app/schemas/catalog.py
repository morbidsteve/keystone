"""Catalog schemas — read-only reference data for equipment, supply, and ammunition."""

from typing import Optional

from pydantic import BaseModel, ConfigDict


# --- Equipment Catalog ---


class EquipmentCatalogResponse(BaseModel):
    id: int
    tamcn: Optional[str] = None
    niin: Optional[str] = None
    nsn: Optional[str] = None
    nomenclature: str
    common_name: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    supply_class: str
    manufacturer: Optional[str] = None
    weight_lbs: Optional[int] = None
    crew_size: Optional[int] = None
    pax_capacity: Optional[int] = None
    is_serialized: bool
    echelon_typical: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Supply Catalog ---


class SupplyCatalogResponse(BaseModel):
    id: int
    nsn: Optional[str] = None
    niin: Optional[str] = None
    lin: Optional[str] = None
    dodic: Optional[str] = None
    nomenclature: str
    common_name: Optional[str] = None
    supply_class: str
    supply_subclass: Optional[str] = None
    unit_of_issue: str
    unit_of_issue_desc: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    is_controlled: bool
    is_hazmat: bool
    shelf_life_days: Optional[int] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Ammunition Catalog ---


class AmmunitionCatalogResponse(BaseModel):
    id: int
    dodic: str
    nsn: Optional[str] = None
    nomenclature: str
    common_name: Optional[str] = None
    caliber: Optional[str] = None
    weapon_system: Optional[str] = None
    unit_of_issue: str
    rounds_per_unit: Optional[int] = None
    weight_per_round_lbs: Optional[float] = None
    is_controlled: bool
    hazard_class: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Aggregation helpers ---


class CategoryInfo(BaseModel):
    category: str
    subcategories: list[str]


class SupplyClassInfo(BaseModel):
    supply_class: str
    item_count: int
