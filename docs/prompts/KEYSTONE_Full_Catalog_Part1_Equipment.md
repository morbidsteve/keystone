# KEYSTONE — Full Equipment & Supply Catalog (Part 1 of 2): Models + Equipment

## Mission

Add comprehensive, pre-populated catalog tables for military equipment, weapons systems, vehicles, supply items, and ammunition to KEYSTONE's database. This enables **dropdown selection, type-ahead search, and automatic field population** instead of forcing users to manually type TAMCNs, NSNs, nomenclatures, and supply class codes. When a user selects "JLTV M1280" from a dropdown, the system auto-fills the TAMCN, NSN, supply class, nomenclature, and unit of issue.

**This is Part 1 of 2.** This part creates the database models, API endpoints, frontend selectors, and seeds ALL equipment catalog items (~110 items). Part 2 seeds ALL supply items and ammunition (~290 items).

---

## Database Models

### New Models to Create

Create the following new models in `backend/app/models/`:

#### `catalog_equipment.py` — Principal End Items / Major Equipment

```python
class EquipmentCatalogItem(Base):
    """Master catalog of USMC equipment — vehicles, weapons, systems.

    This is a REFERENCE TABLE — not per-unit equipment status.
    Per-unit status uses the existing EquipmentStatus model with a
    foreign key to this catalog.
    """
    __tablename__ = "equipment_catalog"

    id = Column(Integer, primary_key=True, index=True)
    tamcn = Column(String(10), unique=True, nullable=True, index=True)      # e.g., "E0846"
    niin = Column(String(13), nullable=True, index=True)                     # National Item ID Number
    nsn = Column(String(16), nullable=True, index=True)                      # Full 13-digit NSN
    nomenclature = Column(String(150), nullable=False, index=True)           # e.g., "JLTV M1280A1"
    common_name = Column(String(100), nullable=True)                         # e.g., "Joint Light Tactical Vehicle"
    category = Column(String(50), nullable=False)                            # e.g., "Tactical Vehicle"
    subcategory = Column(String(50), nullable=True)                          # e.g., "Utility"
    supply_class = Column(String(10), nullable=False, default="VII")         # Almost always VII for end items
    manufacturer = Column(String(100), nullable=True)                        # e.g., "Oshkosh Defense"
    weight_lbs = Column(Integer, nullable=True)                              # Combat weight
    crew_size = Column(Integer, nullable=True)
    pax_capacity = Column(Integer, nullable=True)                            # Passenger capacity
    is_serialized = Column(Boolean, default=True)                            # Tracked by serial number
    is_active = Column(Boolean, default=True)                                # Still in active inventory
    echelon_typical = Column(String(10), nullable=True)                      # Typical echelon (CO, BN, REGT)
    notes = Column(Text, nullable=True)

    # Relationships
    equipment_statuses = relationship("EquipmentStatus", back_populates="catalog_item")
```

#### `catalog_supply.py` — Supply Items (CL I through X)

```python
class SupplyCatalogItem(Base):
    """Master catalog of supply items — rations, fuel, ammo, medical, parts."""
    __tablename__ = "supply_catalog"

    id = Column(Integer, primary_key=True, index=True)
    nsn = Column(String(16), unique=True, nullable=True, index=True)        # Full NSN
    niin = Column(String(13), nullable=True, index=True)                     # NIIN only
    lin = Column(String(10), nullable=True, index=True)                      # Line Item Number
    dodic = Column(String(6), nullable=True, index=True)                     # DoD ID Code (ammo)
    nomenclature = Column(String(200), nullable=False, index=True)           # Official name
    common_name = Column(String(100), nullable=True)                         # Friendly name
    supply_class = Column(String(5), nullable=False, index=True)             # I, II, III, IV, V, VII, VIII, IX, X
    supply_subclass = Column(String(5), nullable=True)                       # Subclass code
    unit_of_issue = Column(String(10), nullable=False, default="EA")         # EA, BX, GL, RD, CS, etc.
    unit_of_issue_desc = Column(String(50), nullable=True)                   # "Each", "Box", "Gallon", etc.
    category = Column(String(50), nullable=True)                             # e.g., "Rations", "POL", "Ammunition"
    subcategory = Column(String(50), nullable=True)                          # e.g., "Small Arms", "Fuel"
    is_controlled = Column(Boolean, default=False)                           # Controlled item (ammo, crypto)
    is_hazmat = Column(Boolean, default=False)                               # Hazardous material
    shelf_life_days = Column(Integer, nullable=True)                         # Shelf life if perishable
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

    # Relationships
    supply_records = relationship("SupplyStatusRecord", back_populates="catalog_item")
```

#### `catalog_ammunition.py` — Ammunition (CL V Detail)

```python
class AmmunitionCatalogItem(Base):
    """Detailed ammunition catalog with DODIC codes."""
    __tablename__ = "ammunition_catalog"

    id = Column(Integer, primary_key=True, index=True)
    dodic = Column(String(6), unique=True, nullable=False, index=True)       # e.g., "A059"
    nsn = Column(String(16), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False, index=True)           # e.g., "CART, 5.56MM, BALL, M855"
    common_name = Column(String(100), nullable=True)                         # e.g., "5.56mm Ball"
    caliber = Column(String(30), nullable=True)                              # e.g., "5.56x45mm"
    weapon_system = Column(String(100), nullable=True)                       # e.g., "M27 IAR, M4, M249"
    unit_of_issue = Column(String(10), nullable=False, default="RD")         # RD=Round, EA=Each, BX=Box
    rounds_per_unit = Column(Integer, nullable=True)                         # If boxed/canned
    weight_per_round_lbs = Column(Float, nullable=True)
    is_controlled = Column(Boolean, default=True)
    hazard_class = Column(String(10), nullable=True)                         # 1.1, 1.2, 1.3, 1.4
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
```

### Update Existing Models

Update `EquipmentStatus` and `SupplyStatusRecord` to add optional foreign keys to the catalog tables:

```python
# In EquipmentStatus:
catalog_item_id = Column(Integer, ForeignKey("equipment_catalog.id"), nullable=True)
catalog_item = relationship("EquipmentCatalogItem", back_populates="equipment_statuses")

# In SupplyStatusRecord:
catalog_item_id = Column(Integer, ForeignKey("supply_catalog.id"), nullable=True)
catalog_item = relationship("SupplyCatalogItem", back_populates="supply_records")
```

---

## API Endpoints

Create catalog search endpoints in `backend/app/api/catalog.py`:

```python
@router.get("/equipment", response_model=list[EquipmentCatalogResponse])
async def search_equipment_catalog(
    q: str = Query(None, description="Search by TAMCN, nomenclature, or common name"),
    category: str = Query(None),
    subcategory: str = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Search the equipment master catalog. Used by dropdowns and type-ahead."""

@router.get("/supply", response_model=list[SupplyCatalogResponse])
async def search_supply_catalog(
    q: str = Query(None, description="Search by NSN, DODIC, nomenclature, or common name"),
    supply_class: str = Query(None, description="Filter by supply class (I, III, V, VIII, etc.)"),
    category: str = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Search the supply item master catalog."""

@router.get("/ammunition", response_model=list[AmmunitionCatalogResponse])
async def search_ammunition_catalog(
    q: str = Query(None, description="Search by DODIC, caliber, nomenclature, or weapon system"),
    caliber: str = Query(None),
    weapon_system: str = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Search the ammunition catalog."""

@router.get("/equipment/categories")
async def get_equipment_categories(db: AsyncSession = Depends(get_db)):
    """Get all distinct equipment categories and subcategories for filter dropdowns."""

@router.get("/supply/classes")
async def get_supply_classes(db: AsyncSession = Depends(get_db)):
    """Get all supply class codes with descriptions."""
```

---

## Frontend Integration

### Equipment Selector Component

Create a reusable `<EquipmentSelector>` component:

- Type-ahead search that queries `/api/v1/catalog/equipment?q=...`
- Grouped by category (Tactical Vehicle, Combat Vehicle, Small Arms, Aviation, etc.)
- Shows TAMCN + nomenclature + common name in results
- On selection, auto-fills TAMCN, nomenclature, NSN into parent form
- Support filtering by category dropdown

### Supply Item Selector Component

Create a reusable `<SupplySelector>` component:

- Type-ahead search that queries `/api/v1/catalog/supply?q=...`
- Grouped by supply class (I, II, III, IV, V, VIII, IX, X)
- Shows NSN + nomenclature + unit of issue in results
- Ammo items show DODIC + caliber + weapon system
- On selection, auto-fills NSN, nomenclature, supply class, unit of issue

---

## Seed Data: Equipment Catalog

Create `backend/seed/seed_equipment_catalog.py` with ALL equipment items below:

### Tactical Vehicles

```python
TACTICAL_VEHICLES = [
    # ── JLTV Family ────────────────────────────────────────────────
    {"tamcn": "E0846", "nsn": "2320-01-669-2322", "nomenclature": "JLTV M1280A1, Utility",
     "common_name": "Joint Light Tactical Vehicle (JLTV) - Utility", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 14000, "crew_size": 2, "pax_capacity": 4, "echelon_typical": "CO"},
    {"tamcn": "E0847", "nsn": "2320-01-669-2323", "nomenclature": "JLTV M1280A1, General Purpose",
     "common_name": "JLTV - GP", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 15000, "crew_size": 2, "pax_capacity": 4, "echelon_typical": "CO"},
    {"tamcn": "E0848", "nsn": "2320-01-669-2324", "nomenclature": "JLTV M1280A1, Close Combat Weapons Carrier",
     "common_name": "JLTV - CCWC", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 16500, "crew_size": 2, "pax_capacity": 3, "echelon_typical": "CO"},
    {"tamcn": "E0849", "nsn": "2320-01-669-2325", "nomenclature": "JLTV M1280A1, Heavy Guns Carrier",
     "common_name": "JLTV - HGC", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 18000, "crew_size": 3, "pax_capacity": 2, "echelon_typical": "CO"},
    {"tamcn": "E0850", "nsn": "2320-01-669-2326", "nomenclature": "JLTV M1281A1, 2-Seat Companion Trailer",
     "common_name": "JLTV Trailer", "category": "Trailer",
     "subcategory": "Light Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 5000, "crew_size": 0, "echelon_typical": "CO"},

    # ── HMMWV Family ───────────────────────────────────────────────
    {"tamcn": "D1195", "nsn": "2320-01-346-9317", "nomenclature": "HMMWV M1151A1, Up-Armored",
     "common_name": "Humvee - Up-Armored", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "AM General",
     "weight_lbs": 12100, "crew_size": 2, "pax_capacity": 4, "echelon_typical": "CO"},
    {"tamcn": "D1191", "nsn": "2320-01-097-2145", "nomenclature": "HMMWV M998A2, Cargo/Troop Carrier",
     "common_name": "Humvee - Cargo", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "AM General",
     "weight_lbs": 8600, "crew_size": 1, "pax_capacity": 3, "echelon_typical": "CO"},
    {"tamcn": "D1193", "nsn": "2320-01-412-0143", "nomenclature": "HMMWV M1114, Up-Armored Armament Carrier",
     "common_name": "Humvee - UAH", "category": "Tactical Vehicle",
     "subcategory": "Light Tactical", "manufacturer": "AM General",
     "weight_lbs": 12900, "crew_size": 2, "pax_capacity": 4, "echelon_typical": "CO"},
    {"tamcn": "D1196", "nsn": "2310-01-350-3191", "nomenclature": "HMMWV M997A2, Ambulance",
     "common_name": "Humvee - Ambulance", "category": "Tactical Vehicle",
     "subcategory": "Ambulance", "manufacturer": "AM General",
     "weight_lbs": 9800, "crew_size": 2, "pax_capacity": 4, "echelon_typical": "BN"},

    # ── MTVR Family (7-ton) ───────────────────────────────────────
    {"tamcn": "D1234", "nsn": "2320-01-454-3385", "nomenclature": "MTVR MK23, Standard Cargo",
     "common_name": "7-ton Truck", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 30000, "crew_size": 2, "pax_capacity": 16, "echelon_typical": "BN"},
    {"tamcn": "D1235", "nsn": "2320-01-454-3386", "nomenclature": "MTVR MK25, Standard Cargo w/Winch",
     "common_name": "7-ton Truck w/Winch", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 30800, "crew_size": 2, "pax_capacity": 16, "echelon_typical": "BN"},
    {"tamcn": "D1236", "nsn": "2320-01-454-3387", "nomenclature": "MTVR MK27, Extended Cargo",
     "common_name": "7-ton Extended Bed", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 31000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "D1238", "nsn": "2320-01-454-3389", "nomenclature": "MTVR MK29, Dump Truck",
     "common_name": "7-ton Dump", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 33000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "D1240", "nsn": "2320-01-454-3391", "nomenclature": "MTVR MK31, Tractor",
     "common_name": "7-ton Tractor", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 28000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "D1244", "nsn": "2320-01-454-3395", "nomenclature": "MTVR MK36, Wrecker",
     "common_name": "7-ton Wrecker", "category": "Tactical Vehicle",
     "subcategory": "Recovery", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 48000, "crew_size": 3, "echelon_typical": "BN"},
    {"tamcn": "D1246", "nsn": "2320-01-521-4312", "nomenclature": "MTVR MK37, HIMARS Resupply Vehicle",
     "common_name": "HIMARS Resupply", "category": "Tactical Vehicle",
     "subcategory": "Medium Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 31500, "crew_size": 2, "echelon_typical": "BN"},

    # ── LVS Family ─────────────────────────────────────────────────
    {"tamcn": "D1266", "nsn": "2320-01-153-1584", "nomenclature": "LVS MK48/18, Tractor",
     "common_name": "LVS Power Unit", "category": "Tactical Vehicle",
     "subcategory": "Heavy Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 52000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "D1267", "nsn": "2320-01-153-1585", "nomenclature": "LVS MK48/15, Cargo Module",
     "common_name": "LVS Cargo", "category": "Tactical Vehicle",
     "subcategory": "Heavy Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 54000, "crew_size": 2, "echelon_typical": "BN"},

    # ── LVSR ───────────────────────────────────────────────────────
    {"tamcn": "E0880", "nsn": "2320-01-575-0890", "nomenclature": "LVSR MKR18, Cargo",
     "common_name": "LVSR Cargo", "category": "Tactical Vehicle",
     "subcategory": "Heavy Tactical", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 63500, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "E0881", "nsn": "2320-01-575-0891", "nomenclature": "LVSR MKR16, Wrecker",
     "common_name": "LVSR Wrecker", "category": "Tactical Vehicle",
     "subcategory": "Recovery", "manufacturer": "Oshkosh Defense",
     "weight_lbs": 67000, "crew_size": 3, "echelon_typical": "BN"},

    # ── Utility ────────────────────────────────────────────────────
    {"tamcn": "E0900", "nsn": "2320-01-598-4512", "nomenclature": "M1161 Growler ITV",
     "common_name": "Growler Internal Transport Vehicle", "category": "Tactical Vehicle",
     "subcategory": "Utility", "manufacturer": "General Dynamics",
     "weight_lbs": 4000, "crew_size": 2, "pax_capacity": 2, "echelon_typical": "CO"},
    {"tamcn": "E0902", "nsn": "2320-01-612-3345", "nomenclature": "MRZR-4 LT-ATV",
     "common_name": "Polaris MRZR Ultra-Light Tactical Vehicle", "category": "Tactical Vehicle",
     "subcategory": "Ultra-Light", "manufacturer": "Polaris Defense",
     "weight_lbs": 2200, "crew_size": 2, "pax_capacity": 2, "echelon_typical": "CO"},

    # ── Material Handling ──────────────────────────────────────────
    {"tamcn": "E0870", "nsn": "3930-01-523-4561", "nomenclature": "TRAM MK4, Forklift 6000lb",
     "common_name": "TRAM Rough Terrain Forklift", "category": "Material Handling",
     "subcategory": "Forklift", "manufacturer": "CAT",
     "weight_lbs": 16000, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "E0871", "nsn": "3930-01-523-4562", "nomenclature": "Forklift, 10K lb, Rough Terrain",
     "common_name": "10K Forklift", "category": "Material Handling",
     "subcategory": "Forklift", "manufacturer": "CAT",
     "weight_lbs": 28000, "crew_size": 1, "echelon_typical": "BN"},
]
```

### Combat Vehicles

```python
COMBAT_VEHICLES = [
    # ── ACV Family ─────────────────────────────────────────────────
    {"tamcn": "E0950", "nsn": "2350-01-687-1234", "nomenclature": "ACV-P, Amphibious Combat Vehicle - Personnel",
     "common_name": "ACV Personnel Variant", "category": "Combat Vehicle",
     "subcategory": "Amphibious", "manufacturer": "BAE Systems / IVECO",
     "weight_lbs": 70000, "crew_size": 3, "pax_capacity": 13, "echelon_typical": "CO"},
    {"tamcn": "E0951", "nsn": "2350-01-687-1235", "nomenclature": "ACV-30, Amphibious Combat Vehicle - 30mm",
     "common_name": "ACV Gun Variant", "category": "Combat Vehicle",
     "subcategory": "Amphibious", "manufacturer": "BAE Systems / IVECO",
     "weight_lbs": 72000, "crew_size": 3, "pax_capacity": 6, "echelon_typical": "CO"},
    {"tamcn": "E0952", "nsn": "2350-01-687-1236", "nomenclature": "ACV-C, Amphibious Combat Vehicle - Command",
     "common_name": "ACV Command Variant", "category": "Combat Vehicle",
     "subcategory": "Amphibious", "manufacturer": "BAE Systems / IVECO",
     "weight_lbs": 71000, "crew_size": 3, "pax_capacity": 8, "echelon_typical": "BN"},
    {"tamcn": "E0953", "nsn": "2350-01-687-1237", "nomenclature": "ACV-R, Amphibious Combat Vehicle - Recovery",
     "common_name": "ACV Recovery Variant", "category": "Combat Vehicle",
     "subcategory": "Recovery", "manufacturer": "BAE Systems / IVECO",
     "weight_lbs": 74000, "crew_size": 3, "echelon_typical": "BN"},

    # ── AAV-7 (legacy) ────────────────────────────────────────────
    {"tamcn": "B0155", "nsn": "2350-01-126-8215", "nomenclature": "AAV-P7A1, Assault Amphibian Vehicle - Personnel",
     "common_name": "Amtrac", "category": "Combat Vehicle",
     "subcategory": "Amphibious", "manufacturer": "BAE Systems / FMC",
     "weight_lbs": 60000, "crew_size": 3, "pax_capacity": 21, "echelon_typical": "CO"},
    {"tamcn": "B0157", "nsn": "2350-01-126-8217", "nomenclature": "AAV-C7A1, Assault Amphibian Vehicle - Command",
     "common_name": "Amtrac Command", "category": "Combat Vehicle",
     "subcategory": "Amphibious", "manufacturer": "BAE Systems / FMC",
     "weight_lbs": 58000, "crew_size": 3, "pax_capacity": 5, "echelon_typical": "BN"},
    {"tamcn": "B0158", "nsn": "2350-01-126-8218", "nomenclature": "AAV-R7A1, Assault Amphibian Vehicle - Recovery",
     "common_name": "Amtrac Recovery", "category": "Combat Vehicle",
     "subcategory": "Recovery", "manufacturer": "BAE Systems / FMC",
     "weight_lbs": 64000, "crew_size": 5, "echelon_typical": "BN"},

    # ── LAV Family ─────────────────────────────────────────────────
    {"tamcn": "B0163", "nsn": "2350-01-143-0345", "nomenclature": "LAV-25A2, Light Armored Vehicle",
     "common_name": "LAV-25", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 28400, "crew_size": 3, "pax_capacity": 6, "echelon_typical": "CO"},
    {"tamcn": "B0164", "nsn": "2350-01-143-0346", "nomenclature": "LAV-AT, Anti-Tank",
     "common_name": "LAV Anti-Tank (TOW)", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 27000, "crew_size": 4, "echelon_typical": "CO"},
    {"tamcn": "B0165", "nsn": "2350-01-143-0347", "nomenclature": "LAV-M, Mortar Carrier",
     "common_name": "LAV Mortar", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 26500, "crew_size": 5, "echelon_typical": "CO"},
    {"tamcn": "B0166", "nsn": "2350-01-143-0348", "nomenclature": "LAV-C2, Command & Control",
     "common_name": "LAV Command", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 27000, "crew_size": 6, "echelon_typical": "BN"},
    {"tamcn": "B0167", "nsn": "2350-01-143-0349", "nomenclature": "LAV-L, Logistics",
     "common_name": "LAV Logistics", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 25000, "crew_size": 3, "echelon_typical": "BN"},
    {"tamcn": "B0168", "nsn": "2350-01-143-0350", "nomenclature": "LAV-R, Recovery",
     "common_name": "LAV Recovery", "category": "Combat Vehicle",
     "subcategory": "Light Armored", "manufacturer": "GDLS Canada",
     "weight_lbs": 28000, "crew_size": 3, "echelon_typical": "BN"},

    # ── Recovery / Engineer ────────────────────────────────────────
    {"tamcn": "B2200", "nsn": "2350-01-547-1989", "nomenclature": "M88A2 HERCULES, Armored Recovery Vehicle",
     "common_name": "M88 Recovery Vehicle", "category": "Combat Vehicle",
     "subcategory": "Recovery", "manufacturer": "BAE Systems",
     "weight_lbs": 140000, "crew_size": 4, "echelon_typical": "BN"},
    {"tamcn": "B3100", "nsn": "2350-01-309-8912", "nomenclature": "M1 ABV, Assault Breacher Vehicle",
     "common_name": "Assault Breacher", "category": "Combat Vehicle",
     "subcategory": "Engineer", "manufacturer": "BAE Systems",
     "weight_lbs": 150000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "B3101", "nsn": "2350-01-456-7890", "nomenclature": "M9 ACE, Armored Combat Earthmover",
     "common_name": "Combat Bulldozer", "category": "Combat Vehicle",
     "subcategory": "Engineer", "manufacturer": "BAE Systems",
     "weight_lbs": 37000, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "B3110", "nsn": "5420-01-100-1234", "nomenclature": "M60 AVLB, Armored Vehicle Launched Bridge",
     "common_name": "Bridge Layer", "category": "Combat Vehicle",
     "subcategory": "Engineer", "manufacturer": "GDLS",
     "weight_lbs": 123000, "crew_size": 2, "echelon_typical": "BN"},

    # ── NMESIS ─────────────────────────────────────────────────────
    {"tamcn": "F0001", "nsn": "1440-01-700-0001", "nomenclature": "NMESIS, Navy-Marine Expeditionary Ship Interdiction System",
     "common_name": "NMESIS Anti-Ship Launcher", "category": "Weapons System",
     "subcategory": "Anti-Ship", "manufacturer": "Raytheon / Kongsberg",
     "weight_lbs": 5000, "crew_size": 2, "echelon_typical": "BN",
     "notes": "Unmanned JLTV-based NSM launcher for Marine Littoral Regiments"},
]
```

### Artillery & Fire Support

```python
ARTILLERY_SYSTEMS = [
    {"tamcn": "D6005", "nsn": "1025-01-533-8312", "nomenclature": "M777A2, Howitzer, 155mm Lightweight Towed",
     "common_name": "M777 155mm Howitzer", "category": "Artillery",
     "subcategory": "Towed", "manufacturer": "BAE Systems",
     "weight_lbs": 9300, "crew_size": 8, "echelon_typical": "BN"},
    {"tamcn": "B4444", "nsn": "1025-01-552-4567", "nomenclature": "M142 HIMARS, High Mobility Artillery Rocket System",
     "common_name": "HIMARS", "category": "Artillery",
     "subcategory": "Rocket/Missile", "manufacturer": "Lockheed Martin",
     "weight_lbs": 35000, "crew_size": 3, "echelon_typical": "BN"},
    {"tamcn": "D6100", "nsn": "1010-01-421-1234", "nomenclature": "M327, 120mm Expeditionary Fire Support System (EFSS)",
     "common_name": "120mm Mortar (EFSS)", "category": "Artillery",
     "subcategory": "Mortar", "manufacturer": "General Dynamics",
     "weight_lbs": 690, "crew_size": 5, "echelon_typical": "BN"},
]
```

### Weapons Systems (Infantry)

```python
INFANTRY_WEAPONS = [
    # ── Rifles & Carbines ──────────────────────────────────────────
    {"tamcn": "A2240", "nsn": "1005-01-591-5825", "nomenclature": "M27 IAR, Rifle 5.56mm",
     "common_name": "M27 Infantry Automatic Rifle", "category": "Small Arms",
     "subcategory": "Rifle", "manufacturer": "Heckler & Koch",
     "weight_lbs": 9, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A1910", "nsn": "1005-01-128-9936", "nomenclature": "M4A1 Carbine, 5.56mm",
     "common_name": "M4 Carbine", "category": "Small Arms",
     "subcategory": "Carbine", "manufacturer": "Colt / FN",
     "weight_lbs": 7, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A1900", "nsn": "1005-01-128-9935", "nomenclature": "M16A4, Rifle 5.56mm",
     "common_name": "M16A4 Service Rifle", "category": "Small Arms",
     "subcategory": "Rifle", "manufacturer": "Colt / FN",
     "weight_lbs": 8, "crew_size": 1, "echelon_typical": "CO"},

    # ── Pistols ────────────────────────────────────────────────────
    {"tamcn": "A0700", "nsn": "1005-01-118-2640", "nomenclature": "M18, Modular Handgun System (MHS)",
     "common_name": "M18 Pistol (SIG P320)", "category": "Small Arms",
     "subcategory": "Pistol", "manufacturer": "SIG Sauer",
     "weight_lbs": 2, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A0600", "nsn": "1005-01-118-2639", "nomenclature": "M9A1, Pistol 9mm",
     "common_name": "M9 Beretta", "category": "Small Arms",
     "subcategory": "Pistol", "manufacturer": "Beretta",
     "weight_lbs": 2, "crew_size": 1, "echelon_typical": "CO"},

    # ── Machine Guns ───────────────────────────────────────────────
    {"tamcn": "A2060", "nsn": "1005-01-412-3379", "nomenclature": "M240B/G, Machine Gun 7.62mm",
     "common_name": "M240 Machine Gun", "category": "Small Arms",
     "subcategory": "Machine Gun", "manufacturer": "FN Herstal",
     "weight_lbs": 27, "crew_size": 2, "echelon_typical": "CO"},
    {"tamcn": "A2050", "nsn": "1005-01-127-7510", "nomenclature": "M249 SAW, 5.56mm Light Machine Gun",
     "common_name": "M249 SAW", "category": "Small Arms",
     "subcategory": "Machine Gun", "manufacturer": "FN Herstal",
     "weight_lbs": 17, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A1800", "nsn": "1005-00-322-9715", "nomenclature": "M2A1, Machine Gun .50 Cal",
     "common_name": "Ma Deuce / M2 .50 Cal", "category": "Crew-Served Weapon",
     "subcategory": "Heavy Machine Gun", "manufacturer": "General Dynamics",
     "weight_lbs": 84, "crew_size": 2, "echelon_typical": "CO"},
    {"tamcn": "A2300", "nsn": "1005-01-126-9063", "nomenclature": "Mk 19 Mod 3, Grenade Machine Gun 40mm",
     "common_name": "Mk 19 Grenade Launcher", "category": "Crew-Served Weapon",
     "subcategory": "Grenade Launcher", "manufacturer": "General Dynamics",
     "weight_lbs": 77, "crew_size": 2, "echelon_typical": "CO"},

    # ── Mortars ────────────────────────────────────────────────────
    {"tamcn": "A2500", "nsn": "1015-01-438-5552", "nomenclature": "M224A1, Mortar 60mm Lightweight",
     "common_name": "60mm Mortar", "category": "Mortar",
     "subcategory": "Light", "manufacturer": "General Dynamics",
     "weight_lbs": 47, "crew_size": 3, "echelon_typical": "CO"},
    {"tamcn": "A2520", "nsn": "1015-01-501-3445", "nomenclature": "M252A2, Mortar 81mm Medium",
     "common_name": "81mm Mortar", "category": "Mortar",
     "subcategory": "Medium", "manufacturer": "Elbit Systems",
     "weight_lbs": 90, "crew_size": 5, "echelon_typical": "BN"},

    # ── Anti-Armor ─────────────────────────────────────────────────
    {"tamcn": "A2700", "nsn": "1425-01-453-3833", "nomenclature": "FGM-148F, Javelin Anti-Tank Missile System",
     "common_name": "Javelin", "category": "Anti-Armor",
     "subcategory": "Guided Missile", "manufacturer": "Raytheon / Lockheed Martin",
     "weight_lbs": 49, "crew_size": 2, "echelon_typical": "CO"},
    {"tamcn": "A2710", "nsn": "1425-01-067-3568", "nomenclature": "BGM-71F TOW-2B, Anti-Tank Guided Missile",
     "common_name": "TOW Missile System", "category": "Anti-Armor",
     "subcategory": "Guided Missile", "manufacturer": "Raytheon",
     "weight_lbs": 96, "crew_size": 4, "echelon_typical": "CO"},
    {"tamcn": "A2650", "nsn": "1010-01-563-1234", "nomenclature": "M3E1, Multi-Role Anti-Armor Anti-Personnel Weapon System (MAAWS)",
     "common_name": "Carl Gustaf M3E1", "category": "Anti-Armor",
     "subcategory": "Recoilless Rifle", "manufacturer": "Saab Bofors",
     "weight_lbs": 15, "crew_size": 2, "echelon_typical": "CO"},
    {"tamcn": "A2660", "nsn": "1340-01-234-5678", "nomenclature": "M136 AT4, Anti-Armor Weapon",
     "common_name": "AT-4", "category": "Anti-Armor",
     "subcategory": "Disposable Launcher", "manufacturer": "Saab Bofors",
     "weight_lbs": 15, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},

    # ── Air Defense ────────────────────────────────────────────────
    {"tamcn": "A2800", "nsn": "1425-01-408-2345", "nomenclature": "FIM-92J Stinger, Man-Portable Air Defense System",
     "common_name": "Stinger MANPADS", "category": "Air Defense",
     "subcategory": "MANPADS", "manufacturer": "Raytheon",
     "weight_lbs": 34, "crew_size": 2, "echelon_typical": "CO"},

    # ── Sniper / DMR ───────────────────────────────────────────────
    {"tamcn": "A2100", "nsn": "1005-01-526-3898", "nomenclature": "M110 SASS, Semi-Automatic Sniper System 7.62mm",
     "common_name": "M110 Sniper Rifle", "category": "Small Arms",
     "subcategory": "Sniper", "manufacturer": "Knight's Armament",
     "weight_lbs": 15, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A2105", "nsn": "1005-00-979-0394", "nomenclature": "M40A6, Sniper Rifle 7.62mm",
     "common_name": "M40 Sniper Rifle", "category": "Small Arms",
     "subcategory": "Sniper", "manufacturer": "Remington / MCPO Quantico",
     "weight_lbs": 16, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "A2110", "nsn": "1005-01-517-4134", "nomenclature": "M107 SASR, .50 Cal Semi-Auto Sniper Rifle",
     "common_name": "Barrett .50 Cal", "category": "Small Arms",
     "subcategory": "Anti-Materiel Rifle", "manufacturer": "Barrett Firearms",
     "weight_lbs": 31, "crew_size": 1, "echelon_typical": "BN"},

    # ── Other ──────────────────────────────────────────────────────
    {"tamcn": "A2350", "nsn": "1010-01-594-3724", "nomenclature": "M320 GLM, Grenade Launcher Module 40mm",
     "common_name": "M320 Grenade Launcher", "category": "Small Arms",
     "subcategory": "Grenade Launcher", "manufacturer": "Heckler & Koch",
     "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "A0850", "nsn": "1005-01-463-6700", "nomenclature": "M1014 JSCS, 12 Gauge Semi-Auto Shotgun",
     "common_name": "Benelli M4 Shotgun", "category": "Small Arms",
     "subcategory": "Shotgun", "manufacturer": "Benelli",
     "weight_lbs": 8, "crew_size": 1, "echelon_typical": "CO"},
]
```

### Communications Equipment

```python
COMMUNICATIONS_EQUIPMENT = [
    {"tamcn": "C2000", "nsn": "5820-01-451-8250", "nomenclature": "AN/PRC-152A, Multiband Handheld Radio",
     "common_name": "PRC-152 Radio", "category": "Communications",
     "subcategory": "Handheld Radio", "manufacturer": "L3Harris",
     "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C2010", "nsn": "5820-01-567-5429", "nomenclature": "AN/PRC-117G, Multiband Manpack Radio",
     "common_name": "PRC-117G SATCOM Radio", "category": "Communications",
     "subcategory": "Manpack Radio", "manufacturer": "L3Harris",
     "weight_lbs": 12, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C2020", "nsn": "5820-01-432-1567", "nomenclature": "AN/PRC-150(C), HF Manpack Radio",
     "common_name": "PRC-150 HF Radio", "category": "Communications",
     "subcategory": "HF Radio", "manufacturer": "L3Harris",
     "weight_lbs": 14, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "C2100", "nsn": "5820-01-543-2189", "nomenclature": "AN/VRC-110, Vehicular Radio Set",
     "common_name": "Vehicle Radio (SINCGARS)", "category": "Communications",
     "subcategory": "Vehicular Radio", "manufacturer": "L3Harris",
     "weight_lbs": 35, "crew_size": 0, "echelon_typical": "CO"},
    {"tamcn": "C2200", "nsn": "5820-01-589-3456", "nomenclature": "AN/TRC-170, Digital Troposcatter System",
     "common_name": "Tropo Radio", "category": "Communications",
     "subcategory": "Troposcatter", "manufacturer": "Raytheon",
     "weight_lbs": 1200, "crew_size": 3, "echelon_typical": "REGT"},
    {"tamcn": "C3000", "nsn": "7010-01-598-4567", "nomenclature": "NOTM, Networking On-The-Move",
     "common_name": "Vehicle SATCOM Terminal", "category": "Communications",
     "subcategory": "SATCOM", "manufacturer": "General Dynamics",
     "weight_lbs": 75, "crew_size": 0, "echelon_typical": "BN"},
    {"tamcn": "C3010", "nsn": "5895-01-612-7890", "nomenclature": "AN/TPS-80 G/ATOR, Ground/Air Task Oriented Radar",
     "common_name": "G/ATOR Radar", "category": "Electronics",
     "subcategory": "Radar", "manufacturer": "Northrop Grumman",
     "weight_lbs": 14000, "crew_size": 6, "echelon_typical": "BN"},
]
```

### Night Vision / Optics

```python
OPTICS_NVG = [
    {"tamcn": "C1000", "nsn": "5855-01-648-2135", "nomenclature": "AN/PVS-31A, Binocular Night Vision Device",
     "common_name": "PVS-31 NVGs (Binos)", "category": "Optics",
     "subcategory": "Night Vision", "manufacturer": "L3Harris",
     "weight_lbs": 1, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C1010", "nsn": "5855-01-432-0524", "nomenclature": "AN/PVS-14, Monocular Night Vision Device",
     "common_name": "PVS-14 NVG (Mono)", "category": "Optics",
     "subcategory": "Night Vision", "manufacturer": "L3Harris",
     "weight_lbs": 1, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C1100", "nsn": "5855-01-634-5678", "nomenclature": "AN/PAS-28 LBTIS, Lightweight Boresighted Thermal Imaging System",
     "common_name": "Thermal Weapon Sight", "category": "Optics",
     "subcategory": "Thermal", "manufacturer": "DRS Technologies",
     "weight_lbs": 4, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C1200", "nsn": "1240-01-576-4321", "nomenclature": "SU-260A/PVS, ACOG 4x32, Rifle Combat Optic",
     "common_name": "ACOG", "category": "Optics",
     "subcategory": "Rifle Optic", "manufacturer": "Trijicon",
     "weight_lbs": 1, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "C1210", "nsn": "1240-01-634-8901", "nomenclature": "Squad Common Optic (SCO), 1-8x Variable Rifle Scope",
     "common_name": "SCO Variable Optic", "category": "Optics",
     "subcategory": "Rifle Optic", "manufacturer": "Trijicon",
     "weight_lbs": 2, "crew_size": 1, "echelon_typical": "CO"},
]
```

### Aviation — Rotary Wing

```python
AVIATION_ROTARY = [
    {"tamcn": "F1000", "nsn": "1520-01-458-2901", "nomenclature": "AH-1Z Viper, Attack Helicopter",
     "common_name": "Viper", "category": "Aviation", "subcategory": "Attack Helicopter",
     "manufacturer": "Bell Helicopter", "weight_lbs": 18500, "crew_size": 2, "pax_capacity": 0,
     "echelon_typical": "SQDN", "notes": "HMLA squadrons. 2x GE T700-GE-401C engines"},
    {"tamcn": "F1010", "nsn": "1520-01-458-2902", "nomenclature": "UH-1Y Venom, Utility Helicopter",
     "common_name": "Venom", "category": "Aviation", "subcategory": "Utility Helicopter",
     "manufacturer": "Bell Helicopter", "weight_lbs": 18000, "crew_size": 4, "pax_capacity": 8,
     "echelon_typical": "SQDN", "notes": "HMLA squadrons. 6 litters for CASEVAC"},
    {"tamcn": "F1020", "nsn": "1520-01-261-3456", "nomenclature": "CH-53E Super Stallion, Heavy Lift Helicopter",
     "common_name": "Super Stallion", "category": "Aviation", "subcategory": "Heavy Lift Helicopter",
     "manufacturer": "Sikorsky Aircraft", "weight_lbs": 69750, "crew_size": 4, "pax_capacity": 30,
     "echelon_typical": "SQDN", "notes": "HMH squadrons. External lift: 36,000 lbs"},
    {"tamcn": "F1025", "nsn": "1520-01-700-1001", "nomenclature": "CH-53K King Stallion, Heavy Lift Helicopter",
     "common_name": "King Stallion", "category": "Aviation", "subcategory": "Heavy Lift Helicopter",
     "manufacturer": "Sikorsky Aircraft", "weight_lbs": 88000, "crew_size": 5, "pax_capacity": 30,
     "echelon_typical": "SQDN", "notes": "HMH squadrons. CH-53E replacement. External lift: 36,000 lbs"},
]
```

### Aviation — Tilt-Rotor & Fixed Wing

```python
AVIATION_FIXED = [
    {"tamcn": "F1100", "nsn": "1520-01-520-7890", "nomenclature": "MV-22B Osprey, Tilt-Rotor Transport",
     "common_name": "Osprey", "category": "Aviation", "subcategory": "Tilt-Rotor",
     "manufacturer": "Bell Boeing", "weight_lbs": 52600, "crew_size": 4, "pax_capacity": 24,
     "echelon_typical": "SQDN", "notes": "VMM squadrons. Speed: 277 mph. Range: 500 nm"},
    {"tamcn": "F1200", "nsn": "1510-01-700-2001", "nomenclature": "F-35B Lightning II, STOVL Strike Fighter",
     "common_name": "Lightning II", "category": "Aviation", "subcategory": "Strike Fighter",
     "manufacturer": "Lockheed Martin", "weight_lbs": 49540, "crew_size": 1, "pax_capacity": 0,
     "echelon_typical": "SQDN", "notes": "VMFA squadrons. STOVL. 5th gen stealth"},
    {"tamcn": "F1210", "nsn": "1510-01-290-3456", "nomenclature": "F/A-18C Hornet, Strike Fighter",
     "common_name": "Hornet (Single-Seat)", "category": "Aviation", "subcategory": "Strike Fighter",
     "manufacturer": "Boeing", "weight_lbs": 36970, "crew_size": 1, "pax_capacity": 0,
     "echelon_typical": "SQDN", "notes": "VMFA squadrons. Legacy fighter, planned retirement ~2030"},
    {"tamcn": "F1215", "nsn": "1510-01-290-3457", "nomenclature": "F/A-18D Hornet, Two-Seat Strike Fighter",
     "common_name": "Hornet (Two-Seat)", "category": "Aviation", "subcategory": "Strike Fighter",
     "manufacturer": "Boeing", "weight_lbs": 37150, "crew_size": 2, "pax_capacity": 0,
     "echelon_typical": "SQDN", "notes": "VMFA(AW) squadrons. Two-seat all-weather variant"},
    {"tamcn": "F1300", "nsn": "1510-01-435-7890", "nomenclature": "KC-130J Super Hercules, Aerial Refueling/Transport",
     "common_name": "Super Hercules", "category": "Aviation", "subcategory": "Transport/Tanker",
     "manufacturer": "Lockheed Martin", "weight_lbs": 165000, "crew_size": 5, "pax_capacity": 92,
     "echelon_typical": "SQDN", "notes": "VMGR squadrons. Payload: 42,000 lbs"},
]
```

### Aviation — UAS / Drones

```python
AVIATION_UAS = [
    {"tamcn": "F1400", "nsn": "1550-01-612-3456", "nomenclature": "RQ-21A Blackjack, Small Tactical UAS",
     "common_name": "Blackjack", "category": "Aviation", "subcategory": "Small Tactical UAS",
     "manufacturer": "Boeing Insitu", "weight_lbs": 135, "crew_size": 0,
     "echelon_typical": "SQDN", "notes": "VMU squadrons. Endurance: 13 hrs. Day/night FMV + IR"},
    {"tamcn": "F1410", "nsn": "1550-01-598-7890", "nomenclature": "RQ-20B Puma AE, Small UAS",
     "common_name": "Puma", "category": "Aviation", "subcategory": "Small UAS",
     "manufacturer": "AeroVironment", "weight_lbs": 13, "crew_size": 0,
     "echelon_typical": "CO", "notes": "Hand-launched. Endurance: 3.5 hrs. EO/IR"},
    {"tamcn": "F1420", "nsn": "1550-01-700-3001", "nomenclature": "MQ-9A Reaper, Medium-Altitude Long-Endurance UAS",
     "common_name": "Reaper", "category": "Aviation", "subcategory": "MALE UAS",
     "manufacturer": "General Atomics", "weight_lbs": 10500, "crew_size": 0,
     "echelon_typical": "SQDN", "notes": "VMU-3. Endurance: 27 hrs. Max alt: 50,000 ft"},
    {"tamcn": "F1430", "nsn": "1550-01-680-4567", "nomenclature": "Switchblade 300, Loitering Munition",
     "common_name": "Switchblade", "category": "Aviation", "subcategory": "Loitering Munition",
     "manufacturer": "AeroVironment", "weight_lbs": 6, "crew_size": 0,
     "echelon_typical": "CO", "is_serialized": False,
     "notes": "Tube-launched kamikaze drone. Backpackable. 10+ min endurance"},
]
```

### Watercraft / Amphibious Connectors

```python
WATERCRAFT = [
    {"tamcn": "G1000", "nsn": "1940-01-345-6789", "nomenclature": "LCAC, Landing Craft Air Cushion",
     "common_name": "LCAC Hovercraft", "category": "Watercraft", "subcategory": "Landing Craft",
     "manufacturer": "Textron Systems", "weight_lbs": 182000, "crew_size": 5, "pax_capacity": 180,
     "echelon_typical": "GRP", "notes": "Payload: 60 tons. Speed: 40+ knots"},
    {"tamcn": "G1010", "nsn": "1940-01-234-5678", "nomenclature": "LCU-1700, Landing Craft Utility",
     "common_name": "Landing Craft Utility", "category": "Watercraft", "subcategory": "Landing Craft",
     "manufacturer": "Various", "weight_lbs": 381000, "crew_size": 14, "pax_capacity": 350,
     "echelon_typical": "GRP", "notes": "Payload: 170 tons"},
    {"tamcn": "G1020", "nsn": "1940-01-567-8901", "nomenclature": "SSC, Ship-to-Shore Connector (LCAC 100)",
     "common_name": "SSC / LCAC 100", "category": "Watercraft", "subcategory": "Landing Craft",
     "manufacturer": "Textron Systems", "weight_lbs": 210000, "crew_size": 5, "pax_capacity": 145,
     "echelon_typical": "GRP", "notes": "LCAC replacement. Payload: 74 tons"},
    {"tamcn": "G1100", "nsn": "1940-01-123-4567", "nomenclature": "CRRC F470, Combat Rubber Raiding Craft",
     "common_name": "Zodiac / CRRC", "category": "Watercraft", "subcategory": "Small Boat",
     "manufacturer": "Zodiac", "weight_lbs": 161, "crew_size": 2, "pax_capacity": 8,
     "echelon_typical": "CO", "notes": "Recon/MARSOC. Range: 60 mi. Speed: 18 kts"},
    {"tamcn": "G1110", "nsn": "1940-01-456-7890", "nomenclature": "CRI, Combat Raiding Inflatable (11-Meter RHIB)",
     "common_name": "11-Meter RHIB", "category": "Watercraft", "subcategory": "Small Boat",
     "manufacturer": "Various", "weight_lbs": 15000, "crew_size": 4, "pax_capacity": 18,
     "echelon_typical": "BN"},
]
```

### Power Generation

```python
GENERATORS = [
    {"tamcn": "H1000", "nsn": "6115-01-274-7390", "nomenclature": "MEP-831A, Generator Set, 3kW TQG",
     "common_name": "3kW Tactical Quiet Generator", "category": "Power Generation",
     "subcategory": "Small Generator", "manufacturer": "Various",
     "weight_lbs": 334, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H1010", "nsn": "6115-01-275-5061", "nomenclature": "MEP-803A, Generator Set, 10kW TQG",
     "common_name": "10kW Tactical Quiet Generator", "category": "Power Generation",
     "subcategory": "Medium Generator", "manufacturer": "Various",
     "weight_lbs": 1242, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H1020", "nsn": "6115-01-275-5062", "nomenclature": "MEP-804B, Generator Set, 15kW TQG",
     "common_name": "15kW Tactical Quiet Generator", "category": "Power Generation",
     "subcategory": "Medium Generator", "manufacturer": "Various",
     "weight_lbs": 1800, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "H1030", "nsn": "6115-01-275-5063", "nomenclature": "MEP-805B, Generator Set, 30kW TQG",
     "common_name": "30kW Tactical Quiet Generator", "category": "Power Generation",
     "subcategory": "Large Generator", "manufacturer": "Various",
     "weight_lbs": 3500, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "H1040", "nsn": "6115-01-275-5064", "nomenclature": "MEP-806B, Generator Set, 60kW TQG",
     "common_name": "60kW Tactical Quiet Generator", "category": "Power Generation",
     "subcategory": "Large Generator", "manufacturer": "Various",
     "weight_lbs": 5800, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "H1100", "nsn": "6130-01-598-4567", "nomenclature": "GREENS, Ground Renewable Expeditionary Energy Network System",
     "common_name": "GREENS Solar Power System", "category": "Power Generation",
     "subcategory": "Solar", "manufacturer": "Various",
     "weight_lbs": 200, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "H1110", "nsn": "6130-01-612-3456", "nomenclature": "SPACES, Solar Portable Alternative Communications Energy System",
     "common_name": "SPACES Portable Solar", "category": "Power Generation",
     "subcategory": "Solar", "manufacturer": "Various",
     "weight_lbs": 35, "crew_size": 1, "echelon_typical": "CO"},
]
```

### CBRN Equipment

```python
CBRN_EQUIPMENT = [
    {"tamcn": "H2000", "nsn": "4240-01-512-4434", "nomenclature": "M50 JSGPM, Joint Service General Purpose Mask",
     "common_name": "M50 Gas Mask", "category": "CBRN", "subcategory": "Respiratory Protection",
     "manufacturer": "Avon Protection", "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H2010", "nsn": "8415-01-444-2310", "nomenclature": "JSLIST Coat, Joint Service Lightweight Integrated Suit Technology",
     "common_name": "MOPP Suit - Coat", "category": "CBRN", "subcategory": "Chemical Protective Suit",
     "manufacturer": "Various", "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2011", "nsn": "8415-01-444-1238", "nomenclature": "JSLIST Trousers",
     "common_name": "MOPP Suit - Trousers", "category": "CBRN", "subcategory": "Chemical Protective Suit",
     "manufacturer": "Various", "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2020", "nsn": "6665-01-133-4964", "nomenclature": "M256A1, Chemical Agent Detection Kit",
     "common_name": "M256 Detection Kit", "category": "CBRN", "subcategory": "Chemical Detection",
     "manufacturer": "Various", "weight_lbs": 3, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2030", "nsn": "6665-00-050-8529", "nomenclature": "M8, Chemical Agent Detection Paper",
     "common_name": "M8 Detection Paper", "category": "CBRN", "subcategory": "Chemical Detection",
     "manufacturer": "Luxfer Magtech", "weight_lbs": 0, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2031", "nsn": "6665-01-226-5589", "nomenclature": "M9, Chemical Agent Detection Tape",
     "common_name": "M9 Detection Tape", "category": "CBRN", "subcategory": "Chemical Detection",
     "manufacturer": "Luxfer Magtech", "weight_lbs": 0, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2040", "nsn": "6665-01-598-4567", "nomenclature": "JCAD M4A1, Joint Chemical Agent Detector",
     "common_name": "JCAD", "category": "CBRN", "subcategory": "Chemical Detection",
     "manufacturer": "BAE Systems", "weight_lbs": 2, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H2050", "nsn": "6665-01-456-7890", "nomenclature": "M22 ACADA, Automatic Chemical Agent Detection Alarm",
     "common_name": "ACADA", "category": "CBRN", "subcategory": "Chemical Detection",
     "manufacturer": "Smiths Detection", "weight_lbs": 15, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "H2060", "nsn": "6850-01-357-8456", "nomenclature": "M295, Individual Equipment Decontamination Kit",
     "common_name": "M295 Decon Kit", "category": "CBRN", "subcategory": "Decontamination",
     "manufacturer": "Various", "weight_lbs": 1, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H2070", "nsn": "6665-01-543-2190", "nomenclature": "AN/PDR-77, Radiac Set (Radiation Detector)",
     "common_name": "AN/PDR-77 Radiation Detector", "category": "CBRN", "subcategory": "Radiation Detection",
     "manufacturer": "Various", "weight_lbs": 5, "crew_size": 1, "echelon_typical": "BN"},
]
```

### Electronic Warfare / Counter-IED

```python
EW_EQUIPMENT = [
    {"tamcn": "H3000", "nsn": "5865-01-567-8901", "nomenclature": "AN/VLQ-12 CREW Duke, Counter RCIED System",
     "common_name": "CREW Duke", "category": "Electronic Warfare", "subcategory": "Counter-IED",
     "manufacturer": "SRC Inc.", "weight_lbs": 200, "crew_size": 0, "echelon_typical": "CO",
     "notes": "Vehicle-mounted. Jams radio-controlled IED detonation signals"},
    {"tamcn": "H3010", "nsn": "5865-01-612-3456", "nomenclature": "JCREW 3.3, Joint Counter RCIED Electronic Warfare",
     "common_name": "JCREW", "category": "Electronic Warfare", "subcategory": "Counter-IED",
     "manufacturer": "Various", "weight_lbs": 50, "crew_size": 0, "echelon_typical": "CO"},
    {"tamcn": "H3020", "nsn": "5865-01-680-4567", "nomenclature": "AN/ALQ-231, Intrepid Tiger II EW Payload",
     "common_name": "Intrepid Tiger II", "category": "Electronic Warfare", "subcategory": "Airborne EW",
     "manufacturer": "Various", "weight_lbs": 500, "crew_size": 0, "echelon_typical": "SQDN"},
]
```

### Shelters / Tents

```python
SHELTERS = [
    {"tamcn": "H4000", "nsn": "8340-01-452-5919", "nomenclature": "MCCT, Marine Corps Combat Tent, Two-Man",
     "common_name": "Combat Tent (2-Man)", "category": "Shelter", "subcategory": "Individual Tent",
     "manufacturer": "Diamond Brand / Eureka", "weight_lbs": 11, "crew_size": 2,
     "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H4010", "nsn": "8340-01-395-3975", "nomenclature": "DRASH 2S, Deployable Rapid Assembly Shelter",
     "common_name": "DRASH 2S Shelter", "category": "Shelter", "subcategory": "Deployable Shelter",
     "manufacturer": "HDT Global", "weight_lbs": 313, "crew_size": 4, "echelon_typical": "CO"},
    {"tamcn": "H4020", "nsn": "8340-01-475-2973", "nomenclature": "DRASH 3XB, Deployable Rapid Assembly Shelter",
     "common_name": "DRASH 3XB Shelter", "category": "Shelter", "subcategory": "Deployable Shelter",
     "manufacturer": "HDT Global", "weight_lbs": 450, "crew_size": 6, "echelon_typical": "BN"},
    {"tamcn": "H4030", "nsn": "8340-01-475-3075", "nomenclature": "DRASH 6XB, Deployable Rapid Assembly Shelter (Large)",
     "common_name": "DRASH 6XB Shelter", "category": "Shelter", "subcategory": "Deployable Shelter",
     "manufacturer": "HDT Global", "weight_lbs": 600, "crew_size": 8, "echelon_typical": "BN",
     "notes": "COC/TOC configuration. Connectable to other DRASH units"},
    {"tamcn": "H4040", "nsn": "8340-01-432-5678", "nomenclature": "TEMPER, Tent Extendable Modular Personnel (20x32 ft)",
     "common_name": "TEMPER Tent", "category": "Shelter", "subcategory": "GP Tent",
     "manufacturer": "Various", "weight_lbs": 1328, "crew_size": 6, "echelon_typical": "BN"},
    {"tamcn": "H4050", "nsn": "8340-01-530-3456", "nomenclature": "Base-X 305, Rapidly Deployable Tent (25x33 ft)",
     "common_name": "Base-X 305 Tent", "category": "Shelter", "subcategory": "GP Tent",
     "manufacturer": "HDT Global", "weight_lbs": 700, "crew_size": 4, "echelon_typical": "BN"},
]
```

### Water Purification & Fuel Handling

```python
WATER_FUEL_SYSTEMS = [
    {"tamcn": "H5000", "nsn": "4610-01-488-6961", "nomenclature": "TWPS, Tactical Water Purification System (1500 GPH)",
     "common_name": "TWPS 1500", "category": "Water Purification", "subcategory": "Mobile Purification",
     "manufacturer": "Various", "weight_lbs": 3500, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "H5010", "nsn": "4610-01-530-3255", "nomenclature": "ROWPU, Reverse Osmosis Water Purification Unit (1500 GPH)",
     "common_name": "ROWPU 1500", "category": "Water Purification", "subcategory": "Mobile Purification",
     "manufacturer": "Various", "weight_lbs": 8400, "crew_size": 3, "echelon_typical": "BN"},
    {"tamcn": "H5020", "nsn": "4610-01-495-0046", "nomenclature": "LWP, Lightweight Water Purifier (75-200 GPH)",
     "common_name": "Lightweight Water Purifier", "category": "Water Purification", "subcategory": "Portable Purification",
     "manufacturer": "Various", "weight_lbs": 500, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H5030", "nsn": "4510-01-234-5678", "nomenclature": "Hippo Tank M105, Water Storage (2000 Gallon)",
     "common_name": "Water Buffalo / Hippo", "category": "Water Purification", "subcategory": "Water Storage",
     "manufacturer": "Various", "weight_lbs": 16800, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H5100", "nsn": "8110-00-965-2313", "nomenclature": "Fuel Bladder, Collapsible, 500 Gallon",
     "common_name": "500-Gal Fuel Blivet", "category": "Fuel Handling", "subcategory": "Fuel Storage",
     "manufacturer": "Various", "weight_lbs": 75, "crew_size": 2, "echelon_typical": "BN", "is_serialized": False},
    {"tamcn": "H5110", "nsn": "4930-01-456-7890", "nomenclature": "TFDS, Tactical Fuel Distribution System",
     "common_name": "Tactical Fuel Distribution System", "category": "Fuel Handling", "subcategory": "Fuel Distribution",
     "manufacturer": "Various", "weight_lbs": 5000, "crew_size": 3, "echelon_typical": "BN"},
    {"tamcn": "H5120", "nsn": "4930-01-234-5679", "nomenclature": "AMCS, Amphibious Assault Fuel System",
     "common_name": "AMCS Ship-to-Shore Fuel", "category": "Fuel Handling", "subcategory": "Fuel Distribution",
     "manufacturer": "Various", "weight_lbs": 12000, "crew_size": 6, "echelon_typical": "GRP"},
]
```

### Engineer / EOD Equipment

```python
ENGINEER_EQUIPMENT = [
    {"tamcn": "H6000", "nsn": "5180-01-587-8019", "nomenclature": "Kit, Pioneer Platoon Tool (FECTK)",
     "common_name": "Pioneer Tool Kit", "category": "Engineer", "subcategory": "Hand Tools",
     "manufacturer": "Kipper Tool Company", "weight_lbs": 200, "crew_size": 4, "echelon_typical": "CO",
     "notes": "Axes, shovels, picks, saws, pry bars, sledgehammers"},
    {"tamcn": "H6010", "nsn": "6665-01-504-7769", "nomenclature": "AN/PSS-14 HSTAMIDS, Handheld Mine Detector",
     "common_name": "Mine Detector (PSS-14)", "category": "Engineer", "subcategory": "Detection Equipment",
     "manufacturer": "L-3 CyTerra", "weight_lbs": 10, "crew_size": 1, "echelon_typical": "CO"},
    {"tamcn": "H6020", "nsn": "1375-01-543-2191", "nomenclature": "M58 MICLIC, Mine Clearing Line Charge",
     "common_name": "MICLIC", "category": "Engineer", "subcategory": "Mine Clearing",
     "manufacturer": "Various", "weight_lbs": 3500, "crew_size": 4, "echelon_typical": "BN",
     "notes": "Rocket-launched C4 line charge. Clears 100m x 16m lane"},
    {"tamcn": "H6030", "nsn": "1385-01-567-8901", "nomenclature": "PackBot 510, EOD Robot",
     "common_name": "PackBot", "category": "Engineer", "subcategory": "EOD Robotics",
     "manufacturer": "Endeavor Robotics", "weight_lbs": 60, "crew_size": 1, "echelon_typical": "BN"},
    {"tamcn": "H6040", "nsn": "1385-01-567-8902", "nomenclature": "TALON, EOD Robot",
     "common_name": "TALON Robot", "category": "Engineer", "subcategory": "EOD Robotics",
     "manufacturer": "QinetiQ", "weight_lbs": 115, "crew_size": 1, "echelon_typical": "BN"},
]
```

### Kitchen / Field Services

```python
FIELD_SERVICES = [
    {"tamcn": "H7000", "nsn": "7360-01-469-5482", "nomenclature": "MKT-I, Mobile Kitchen Trailer (Improved)",
     "common_name": "Mobile Kitchen Trailer", "category": "Field Services", "subcategory": "Food Service",
     "manufacturer": "Various", "weight_lbs": 5760, "crew_size": 4, "echelon_typical": "BN",
     "notes": "Feeds 200-250 Marines per meal. Towed by MTVR"},
    {"tamcn": "H7010", "nsn": "7310-01-234-5678", "nomenclature": "Burner Unit, Multi-Fuel, Field Range",
     "common_name": "Field Range Burner", "category": "Field Services", "subcategory": "Food Service",
     "manufacturer": "Various", "weight_lbs": 45, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False},
    {"tamcn": "H7020", "nsn": "7360-01-345-6789", "nomenclature": "Container, Insulated, Food (Mermite Can)",
     "common_name": "Mermite Can", "category": "Field Services", "subcategory": "Food Service",
     "manufacturer": "Various", "weight_lbs": 40, "crew_size": 1, "echelon_typical": "CO", "is_serialized": False,
     "notes": "Insulated food transport. Keeps food hot 4+ hrs. Feeds ~20 Marines"},
    {"tamcn": "H7100", "nsn": "4510-01-456-7891", "nomenclature": "Shower Unit, Field, Containerized",
     "common_name": "Field Shower Unit", "category": "Field Services", "subcategory": "Hygiene",
     "manufacturer": "Various", "weight_lbs": 4000, "crew_size": 2, "echelon_typical": "BN"},
    {"tamcn": "H7110", "nsn": "3510-01-234-5680", "nomenclature": "Laundry Unit, Field, Containerized (LADS)",
     "common_name": "Field Laundry Unit", "category": "Field Services", "subcategory": "Hygiene",
     "manufacturer": "Various", "weight_lbs": 6000, "crew_size": 3, "echelon_typical": "BN"},
]
```

---

## Master Equipment Seed Array

```python
ALL_EQUIPMENT = (
    TACTICAL_VEHICLES + COMBAT_VEHICLES + ARTILLERY_SYSTEMS + INFANTRY_WEAPONS +
    COMMUNICATIONS_EQUIPMENT + OPTICS_NVG + AVIATION_ROTARY + AVIATION_FIXED +
    AVIATION_UAS + WATERCRAFT + GENERATORS + CBRN_EQUIPMENT + EW_EQUIPMENT +
    SHELTERS + WATER_FUEL_SYSTEMS + ENGINEER_EQUIPMENT + FIELD_SERVICES
)
# Total: ~110 equipment items
```

Each seed function should be idempotent — check by TAMCN before inserting.

---

## Seed Process

Add seeding to the app lifespan:

```python
# In main.py lifespan
await seed_equipment_catalog(db)
# Supply + Ammo seeding is in Part 2
```

---

## Important Notes

- **NSN format**: 13 digits formatted as `XXXX-XX-XXX-XXXX`. First 4 digits = Federal Supply Class.
- **TAMCN format**: Letter + 4 digits (e.g., `E0846`). Letter = commodity: A=Ordnance, B=Armored/Tracked, C=Comms/Electronics, D=Motor Transport, E=Engineer/New Gen, F=Aviation/Weapons Systems, G=Watercraft, H=Support Equipment.
- **Some NSNs are representative** — verify against WebFLIS for production. Structure and format are correct.
- **Aviation items** tracked at SQDN echelon, not company.
- **Catalog is expandable** — users can add items via admin interface. Seed data is the starting point.
- **Keep backward compatibility** — existing `EquipmentStatus` and `SupplyStatusRecord` tables work without catalog FK (nullable).
