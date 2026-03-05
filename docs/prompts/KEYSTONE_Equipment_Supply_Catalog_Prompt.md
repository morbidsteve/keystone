# KEYSTONE — Pre-Populated Equipment & Supply Catalog

## Mission

Add comprehensive, pre-populated catalog tables for military equipment, weapons systems, vehicles, supply items, and ammunition to KEYSTONE's database. This enables **dropdown selection, type-ahead search, and automatic field population** instead of forcing users to manually type TAMCNs, NSNs, nomenclatures, and supply class codes. When a user selects "JLTV M1280" from a dropdown, the system auto-fills the TAMCN, NSN, supply class, nomenclature, and unit of issue.

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

## Seed Data: Equipment Catalog

Create `backend/seed/seed_equipment_catalog.py`:

### Tactical Vehicles

```python
TACTICAL_VEHICLES = [
    # ── Joint Light Tactical Vehicle (JLTV) Family ───────────────────
    {
        "tamcn": "E0846",
        "nsn": "2320-01-669-2322",
        "nomenclature": "JLTV M1280A1, Utility",
        "common_name": "Joint Light Tactical Vehicle (JLTV) - Utility",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 14000,
        "crew_size": 2,
        "pax_capacity": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0847",
        "nsn": "2320-01-669-2323",
        "nomenclature": "JLTV M1280A1, General Purpose",
        "common_name": "JLTV - GP",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 15000,
        "crew_size": 2,
        "pax_capacity": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0848",
        "nsn": "2320-01-669-2324",
        "nomenclature": "JLTV M1280A1, Close Combat Weapons Carrier",
        "common_name": "JLTV - CCWC",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 16500,
        "crew_size": 2,
        "pax_capacity": 3,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0849",
        "nsn": "2320-01-669-2325",
        "nomenclature": "JLTV M1280A1, Heavy Guns Carrier",
        "common_name": "JLTV - HGC",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 18000,
        "crew_size": 3,
        "pax_capacity": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0850",
        "nsn": "2320-01-669-2326",
        "nomenclature": "JLTV M1281A1, 2-Seat Companion Trailer",
        "common_name": "JLTV Trailer",
        "category": "Trailer",
        "subcategory": "Light Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 5000,
        "crew_size": 0,
        "echelon_typical": "CO",
    },

    # ── HMMWV Family ────────────────────────────────────────────────
    {
        "tamcn": "D1195",
        "nsn": "2320-01-346-9317",
        "nomenclature": "HMMWV M1151A1, Up-Armored",
        "common_name": "Humvee - Up-Armored",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "AM General",
        "weight_lbs": 12100,
        "crew_size": 2,
        "pax_capacity": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "D1191",
        "nsn": "2320-01-097-2145",
        "nomenclature": "HMMWV M998A2, Cargo/Troop Carrier",
        "common_name": "Humvee - Cargo",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "AM General",
        "weight_lbs": 8600,
        "crew_size": 1,
        "pax_capacity": 3,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "D1193",
        "nsn": "2320-01-412-0143",
        "nomenclature": "HMMWV M1114, Up-Armored Armament Carrier",
        "common_name": "Humvee - UAH",
        "category": "Tactical Vehicle",
        "subcategory": "Light Tactical",
        "manufacturer": "AM General",
        "weight_lbs": 12900,
        "crew_size": 2,
        "pax_capacity": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "D1196",
        "nsn": "2310-01-350-3191",
        "nomenclature": "HMMWV M997A2, Ambulance",
        "common_name": "Humvee - Ambulance",
        "category": "Tactical Vehicle",
        "subcategory": "Ambulance",
        "manufacturer": "AM General",
        "weight_lbs": 9800,
        "crew_size": 2,
        "pax_capacity": 4,
        "echelon_typical": "BN",
    },

    # ── MTVR Family (7-ton) ─────────────────────────────────────────
    {
        "tamcn": "D1234",
        "nsn": "2320-01-454-3385",
        "nomenclature": "MTVR MK23, Standard Cargo",
        "common_name": "7-ton Truck",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 30000,
        "crew_size": 2,
        "pax_capacity": 16,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1235",
        "nsn": "2320-01-454-3386",
        "nomenclature": "MTVR MK25, Standard Cargo w/Winch",
        "common_name": "7-ton Truck w/Winch",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 30800,
        "crew_size": 2,
        "pax_capacity": 16,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1236",
        "nsn": "2320-01-454-3387",
        "nomenclature": "MTVR MK27, Extended Cargo",
        "common_name": "7-ton Extended Bed",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 31000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1238",
        "nsn": "2320-01-454-3389",
        "nomenclature": "MTVR MK29, Dump Truck",
        "common_name": "7-ton Dump",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 33000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1240",
        "nsn": "2320-01-454-3391",
        "nomenclature": "MTVR MK31, Tractor",
        "common_name": "7-ton Tractor",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 28000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1244",
        "nsn": "2320-01-454-3395",
        "nomenclature": "MTVR MK36, Wrecker",
        "common_name": "7-ton Wrecker",
        "category": "Tactical Vehicle",
        "subcategory": "Recovery",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 48000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1246",
        "nsn": "2320-01-521-4312",
        "nomenclature": "MTVR MK37, HIMARS Resupply Vehicle",
        "common_name": "HIMARS Resupply",
        "category": "Tactical Vehicle",
        "subcategory": "Medium Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 31500,
        "crew_size": 2,
        "echelon_typical": "BN",
    },

    # ── LVS Family (Logistics Vehicle System) ───────────────────────
    {
        "tamcn": "D1266",
        "nsn": "2320-01-153-1584",
        "nomenclature": "LVS MK48/18, Tractor",
        "common_name": "LVS Power Unit",
        "category": "Tactical Vehicle",
        "subcategory": "Heavy Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 52000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D1267",
        "nsn": "2320-01-153-1585",
        "nomenclature": "LVS MK48/15, Cargo Module",
        "common_name": "LVS Cargo",
        "category": "Tactical Vehicle",
        "subcategory": "Heavy Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 54000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },

    # ── LVSR (Logistics Vehicle System Replacement) ──────────────────
    {
        "tamcn": "E0880",
        "nsn": "2320-01-575-0890",
        "nomenclature": "LVSR MKR18, Cargo",
        "common_name": "LVSR Cargo",
        "category": "Tactical Vehicle",
        "subcategory": "Heavy Tactical",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 63500,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "E0881",
        "nsn": "2320-01-575-0891",
        "nomenclature": "LVSR MKR16, Wrecker",
        "common_name": "LVSR Wrecker",
        "category": "Tactical Vehicle",
        "subcategory": "Recovery",
        "manufacturer": "Oshkosh Defense",
        "weight_lbs": 67000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },

    # ── Utility Vehicles ─────────────────────────────────────────────
    {
        "tamcn": "E0900",
        "nsn": "2320-01-598-4512",
        "nomenclature": "M1161 Growler ITV",
        "common_name": "Growler Internal Transport Vehicle",
        "category": "Tactical Vehicle",
        "subcategory": "Utility",
        "manufacturer": "General Dynamics",
        "weight_lbs": 4000,
        "crew_size": 2,
        "pax_capacity": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0902",
        "nsn": "2320-01-612-3345",
        "nomenclature": "MRZR-4 LT-ATV",
        "common_name": "Polaris MRZR Ultra-Light Tactical Vehicle",
        "category": "Tactical Vehicle",
        "subcategory": "Ultra-Light",
        "manufacturer": "Polaris Defense",
        "weight_lbs": 2200,
        "crew_size": 2,
        "pax_capacity": 2,
        "echelon_typical": "CO",
    },

    # ── Forklifts / Material Handling ────────────────────────────────
    {
        "tamcn": "E0870",
        "nsn": "3930-01-523-4561",
        "nomenclature": "TRAM MK4, Forklift 6000lb",
        "common_name": "TRAM Rough Terrain Forklift",
        "category": "Material Handling",
        "subcategory": "Forklift",
        "manufacturer": "CAT",
        "weight_lbs": 16000,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "E0871",
        "nsn": "3930-01-523-4562",
        "nomenclature": "Forklift, 10K lb, Rough Terrain",
        "common_name": "10K Forklift",
        "category": "Material Handling",
        "subcategory": "Forklift",
        "manufacturer": "CAT",
        "weight_lbs": 28000,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
]
```

### Combat Vehicles

```python
COMBAT_VEHICLES = [
    # ── Amphibious Combat Vehicle (ACV) ──────────────────────────────
    {
        "tamcn": "E0950",
        "nsn": "2350-01-687-1234",
        "nomenclature": "ACV-P, Amphibious Combat Vehicle - Personnel",
        "common_name": "ACV Personnel Variant",
        "category": "Combat Vehicle",
        "subcategory": "Amphibious",
        "manufacturer": "BAE Systems / IVECO",
        "weight_lbs": 70000,
        "crew_size": 3,
        "pax_capacity": 13,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0951",
        "nsn": "2350-01-687-1235",
        "nomenclature": "ACV-30, Amphibious Combat Vehicle - 30mm",
        "common_name": "ACV Gun Variant",
        "category": "Combat Vehicle",
        "subcategory": "Amphibious",
        "manufacturer": "BAE Systems / IVECO",
        "weight_lbs": 72000,
        "crew_size": 3,
        "pax_capacity": 6,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "E0952",
        "nsn": "2350-01-687-1236",
        "nomenclature": "ACV-C, Amphibious Combat Vehicle - Command",
        "common_name": "ACV Command Variant",
        "category": "Combat Vehicle",
        "subcategory": "Amphibious",
        "manufacturer": "BAE Systems / IVECO",
        "weight_lbs": 71000,
        "crew_size": 3,
        "pax_capacity": 8,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "E0953",
        "nsn": "2350-01-687-1237",
        "nomenclature": "ACV-R, Amphibious Combat Vehicle - Recovery",
        "common_name": "ACV Recovery Variant",
        "category": "Combat Vehicle",
        "subcategory": "Recovery",
        "manufacturer": "BAE Systems / IVECO",
        "weight_lbs": 74000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },

    # ── AAV-7 (legacy) ───────────────────────────────────────────────
    {
        "tamcn": "B0155",
        "nsn": "2350-01-126-8215",
        "nomenclature": "AAV-P7A1, Assault Amphibian Vehicle - Personnel",
        "common_name": "Amtrac",
        "category": "Combat Vehicle",
        "subcategory": "Amphibious",
        "manufacturer": "BAE Systems / FMC",
        "weight_lbs": 60000,
        "crew_size": 3,
        "pax_capacity": 21,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "B0157",
        "nsn": "2350-01-126-8217",
        "nomenclature": "AAV-C7A1, Assault Amphibian Vehicle - Command",
        "common_name": "Amtrac Command",
        "category": "Combat Vehicle",
        "subcategory": "Amphibious",
        "manufacturer": "BAE Systems / FMC",
        "weight_lbs": 58000,
        "crew_size": 3,
        "pax_capacity": 5,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B0158",
        "nsn": "2350-01-126-8218",
        "nomenclature": "AAV-R7A1, Assault Amphibian Vehicle - Recovery",
        "common_name": "Amtrac Recovery",
        "category": "Combat Vehicle",
        "subcategory": "Recovery",
        "manufacturer": "BAE Systems / FMC",
        "weight_lbs": 64000,
        "crew_size": 5,
        "echelon_typical": "BN",
    },

    # ── LAV Family ───────────────────────────────────────────────────
    {
        "tamcn": "B0163",
        "nsn": "2350-01-143-0345",
        "nomenclature": "LAV-25A2, Light Armored Vehicle",
        "common_name": "LAV-25",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 28400,
        "crew_size": 3,
        "pax_capacity": 6,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "B0164",
        "nsn": "2350-01-143-0346",
        "nomenclature": "LAV-AT, Anti-Tank",
        "common_name": "LAV Anti-Tank (TOW)",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 27000,
        "crew_size": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "B0165",
        "nsn": "2350-01-143-0347",
        "nomenclature": "LAV-M, Mortar Carrier",
        "common_name": "LAV Mortar",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 26500,
        "crew_size": 5,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "B0166",
        "nsn": "2350-01-143-0348",
        "nomenclature": "LAV-C2, Command & Control",
        "common_name": "LAV Command",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 27000,
        "crew_size": 6,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B0167",
        "nsn": "2350-01-143-0349",
        "nomenclature": "LAV-L, Logistics",
        "common_name": "LAV Logistics",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 25000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B0168",
        "nsn": "2350-01-143-0350",
        "nomenclature": "LAV-R, Recovery",
        "common_name": "LAV Recovery",
        "category": "Combat Vehicle",
        "subcategory": "Light Armored",
        "manufacturer": "GDLS Canada",
        "weight_lbs": 28000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },

    # ── Recovery Vehicles ────────────────────────────────────────────
    {
        "tamcn": "B2200",
        "nsn": "2350-01-547-1989",
        "nomenclature": "M88A2 HERCULES, Armored Recovery Vehicle",
        "common_name": "M88 Recovery Vehicle",
        "category": "Combat Vehicle",
        "subcategory": "Recovery",
        "manufacturer": "BAE Systems",
        "weight_lbs": 140000,
        "crew_size": 4,
        "echelon_typical": "BN",
    },

    # ── Engineer Vehicles ────────────────────────────────────────────
    {
        "tamcn": "B3100",
        "nsn": "2350-01-309-8912",
        "nomenclature": "M1 ABV, Assault Breacher Vehicle",
        "common_name": "Assault Breacher",
        "category": "Combat Vehicle",
        "subcategory": "Engineer",
        "manufacturer": "BAE Systems",
        "weight_lbs": 150000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B3101",
        "nsn": "2350-01-456-7890",
        "nomenclature": "M9 ACE, Armored Combat Earthmover",
        "common_name": "Combat Bulldozer",
        "category": "Combat Vehicle",
        "subcategory": "Engineer",
        "manufacturer": "BAE Systems",
        "weight_lbs": 37000,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B3110",
        "nsn": "5420-01-100-1234",
        "nomenclature": "M60 AVLB, Armored Vehicle Launched Bridge",
        "common_name": "Bridge Layer",
        "category": "Combat Vehicle",
        "subcategory": "Engineer",
        "manufacturer": "GDLS",
        "weight_lbs": 123000,
        "crew_size": 2,
        "echelon_typical": "BN",
    },

    # ── NMESIS (New MLR Weapon) ──────────────────────────────────────
    {
        "tamcn": "F0001",
        "nsn": "1440-01-700-0001",
        "nomenclature": "NMESIS, Navy-Marine Expeditionary Ship Interdiction System",
        "common_name": "NMESIS Anti-Ship Launcher",
        "category": "Weapons System",
        "subcategory": "Anti-Ship",
        "manufacturer": "Raytheon / Kongsberg",
        "weight_lbs": 5000,
        "crew_size": 2,
        "echelon_typical": "BN",
        "notes": "Unmanned JLTV-based NSM launcher for Marine Littoral Regiments",
    },
]
```

### Artillery & Fire Support

```python
ARTILLERY_SYSTEMS = [
    {
        "tamcn": "D6005",
        "nsn": "1025-01-533-8312",
        "nomenclature": "M777A2, Howitzer, 155mm Lightweight Towed",
        "common_name": "M777 155mm Howitzer",
        "category": "Artillery",
        "subcategory": "Towed",
        "manufacturer": "BAE Systems",
        "weight_lbs": 9300,
        "crew_size": 8,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "B4444",
        "nsn": "1025-01-552-4567",
        "nomenclature": "M142 HIMARS, High Mobility Artillery Rocket System",
        "common_name": "HIMARS",
        "category": "Artillery",
        "subcategory": "Rocket/Missile",
        "manufacturer": "Lockheed Martin",
        "weight_lbs": 35000,
        "crew_size": 3,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "D6100",
        "nsn": "1010-01-421-1234",
        "nomenclature": "M327, 120mm Expeditionary Fire Support System (EFSS)",
        "common_name": "120mm Mortar (EFSS)",
        "category": "Artillery",
        "subcategory": "Mortar",
        "manufacturer": "General Dynamics",
        "weight_lbs": 690,
        "crew_size": 5,
        "echelon_typical": "BN",
    },
]
```

### Weapons Systems (Infantry)

```python
INFANTRY_WEAPONS = [
    # ── Rifles & Carbines ────────────────────────────────────────────
    {
        "tamcn": "A2240",
        "nsn": "1005-01-591-5825",
        "nomenclature": "M27 IAR, Rifle 5.56mm",
        "common_name": "M27 Infantry Automatic Rifle",
        "category": "Small Arms",
        "subcategory": "Rifle",
        "manufacturer": "Heckler & Koch",
        "weight_lbs": 9,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A1910",
        "nsn": "1005-01-128-9936",
        "nomenclature": "M4A1 Carbine, 5.56mm",
        "common_name": "M4 Carbine",
        "category": "Small Arms",
        "subcategory": "Carbine",
        "manufacturer": "Colt / FN",
        "weight_lbs": 7,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A1900",
        "nsn": "1005-01-128-9935",
        "nomenclature": "M16A4, Rifle 5.56mm",
        "common_name": "M16A4 Service Rifle",
        "category": "Small Arms",
        "subcategory": "Rifle",
        "manufacturer": "Colt / FN",
        "weight_lbs": 8,
        "crew_size": 1,
        "echelon_typical": "CO",
    },

    # ── Pistols ──────────────────────────────────────────────────────
    {
        "tamcn": "A0700",
        "nsn": "1005-01-118-2640",
        "nomenclature": "M18, Modular Handgun System (MHS)",
        "common_name": "M18 Pistol (SIG P320)",
        "category": "Small Arms",
        "subcategory": "Pistol",
        "manufacturer": "SIG Sauer",
        "weight_lbs": 2,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A0600",
        "nsn": "1005-01-118-2639",
        "nomenclature": "M9A1, Pistol 9mm",
        "common_name": "M9 Beretta",
        "category": "Small Arms",
        "subcategory": "Pistol",
        "manufacturer": "Beretta",
        "weight_lbs": 2,
        "crew_size": 1,
        "echelon_typical": "CO",
    },

    # ── Machine Guns ─────────────────────────────────────────────────
    {
        "tamcn": "A2060",
        "nsn": "1005-01-412-3379",
        "nomenclature": "M240B/G, Machine Gun 7.62mm",
        "common_name": "M240 Machine Gun",
        "category": "Small Arms",
        "subcategory": "Machine Gun",
        "manufacturer": "FN Herstal",
        "weight_lbs": 27,
        "crew_size": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2050",
        "nsn": "1005-01-127-7510",
        "nomenclature": "M249 SAW, 5.56mm Light Machine Gun",
        "common_name": "M249 SAW",
        "category": "Small Arms",
        "subcategory": "Machine Gun",
        "manufacturer": "FN Herstal",
        "weight_lbs": 17,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A1800",
        "nsn": "1005-00-322-9715",
        "nomenclature": "M2A1, Machine Gun .50 Cal",
        "common_name": "Ma Deuce / M2 .50 Cal",
        "category": "Crew-Served Weapon",
        "subcategory": "Heavy Machine Gun",
        "manufacturer": "General Dynamics",
        "weight_lbs": 84,
        "crew_size": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2300",
        "nsn": "1005-01-126-9063",
        "nomenclature": "Mk 19 Mod 3, Grenade Machine Gun 40mm",
        "common_name": "Mk 19 Grenade Launcher",
        "category": "Crew-Served Weapon",
        "subcategory": "Grenade Launcher",
        "manufacturer": "General Dynamics",
        "weight_lbs": 77,
        "crew_size": 2,
        "echelon_typical": "CO",
    },

    # ── Mortars ──────────────────────────────────────────────────────
    {
        "tamcn": "A2500",
        "nsn": "1015-01-438-5552",
        "nomenclature": "M224A1, Mortar 60mm Lightweight",
        "common_name": "60mm Mortar",
        "category": "Mortar",
        "subcategory": "Light",
        "manufacturer": "General Dynamics",
        "weight_lbs": 47,
        "crew_size": 3,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2520",
        "nsn": "1015-01-501-3445",
        "nomenclature": "M252A2, Mortar 81mm Medium",
        "common_name": "81mm Mortar",
        "category": "Mortar",
        "subcategory": "Medium",
        "manufacturer": "Elbit Systems",
        "weight_lbs": 90,
        "crew_size": 5,
        "echelon_typical": "BN",
    },

    # ── Anti-Armor ───────────────────────────────────────────────────
    {
        "tamcn": "A2700",
        "nsn": "1425-01-453-3833",
        "nomenclature": "FGM-148F, Javelin Anti-Tank Missile System",
        "common_name": "Javelin",
        "category": "Anti-Armor",
        "subcategory": "Guided Missile",
        "manufacturer": "Raytheon / Lockheed Martin",
        "weight_lbs": 49,
        "crew_size": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2710",
        "nsn": "1425-01-067-3568",
        "nomenclature": "BGM-71F TOW-2B, Anti-Tank Guided Missile",
        "common_name": "TOW Missile System",
        "category": "Anti-Armor",
        "subcategory": "Guided Missile",
        "manufacturer": "Raytheon",
        "weight_lbs": 96,
        "crew_size": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2650",
        "nsn": "1010-01-563-1234",
        "nomenclature": "M3E1, Multi-Role Anti-Armor Anti-Personnel Weapon System (MAAWS)",
        "common_name": "Carl Gustaf M3E1",
        "category": "Anti-Armor",
        "subcategory": "Recoilless Rifle",
        "manufacturer": "Saab Bofors",
        "weight_lbs": 15,
        "crew_size": 2,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2660",
        "nsn": "1340-01-234-5678",
        "nomenclature": "M136 AT4, Anti-Armor Weapon",
        "common_name": "AT-4",
        "category": "Anti-Armor",
        "subcategory": "Disposable Launcher",
        "manufacturer": "Saab Bofors",
        "weight_lbs": 15,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },

    # ── Air Defense ──────────────────────────────────────────────────
    {
        "tamcn": "A2800",
        "nsn": "1425-01-408-2345",
        "nomenclature": "FIM-92J Stinger, Man-Portable Air Defense System",
        "common_name": "Stinger MANPADS",
        "category": "Air Defense",
        "subcategory": "MANPADS",
        "manufacturer": "Raytheon",
        "weight_lbs": 34,
        "crew_size": 2,
        "echelon_typical": "CO",
    },

    # ── Sniper / Designated Marksman ─────────────────────────────────
    {
        "tamcn": "A2100",
        "nsn": "1005-01-526-3898",
        "nomenclature": "M110 SASS, Semi-Automatic Sniper System 7.62mm",
        "common_name": "M110 Sniper Rifle",
        "category": "Small Arms",
        "subcategory": "Sniper",
        "manufacturer": "Knight's Armament",
        "weight_lbs": 15,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "A2105",
        "nsn": "1005-00-979-0394",
        "nomenclature": "M40A6, Sniper Rifle 7.62mm",
        "common_name": "M40 Sniper Rifle",
        "category": "Small Arms",
        "subcategory": "Sniper",
        "manufacturer": "Remington / MCPO Quantico",
        "weight_lbs": 16,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "A2110",
        "nsn": "1005-01-517-4134",
        "nomenclature": "M107 SASR, .50 Cal Semi-Auto Sniper Rifle",
        "common_name": "Barrett .50 Cal",
        "category": "Small Arms",
        "subcategory": "Anti-Materiel Rifle",
        "manufacturer": "Barrett Firearms",
        "weight_lbs": 31,
        "crew_size": 1,
        "echelon_typical": "BN",
    },

    # ── Grenade Launchers ────────────────────────────────────────────
    {
        "tamcn": "A2350",
        "nsn": "1010-01-594-3724",
        "nomenclature": "M320 GLM, Grenade Launcher Module 40mm",
        "common_name": "M320 Grenade Launcher",
        "category": "Small Arms",
        "subcategory": "Grenade Launcher",
        "manufacturer": "Heckler & Koch",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
    },

    # ── Shotguns ─────────────────────────────────────────────────────
    {
        "tamcn": "A0850",
        "nsn": "1005-01-463-6700",
        "nomenclature": "M1014 JSCS, 12 Gauge Semi-Auto Shotgun",
        "common_name": "Benelli M4 Shotgun",
        "category": "Small Arms",
        "subcategory": "Shotgun",
        "manufacturer": "Benelli",
        "weight_lbs": 8,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
]
```

### Communications Equipment

```python
COMMUNICATIONS_EQUIPMENT = [
    {
        "tamcn": "C2000",
        "nsn": "5820-01-451-8250",
        "nomenclature": "AN/PRC-152A, Multiband Handheld Radio",
        "common_name": "PRC-152 Radio",
        "category": "Communications",
        "subcategory": "Handheld Radio",
        "manufacturer": "L3Harris",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C2010",
        "nsn": "5820-01-567-5429",
        "nomenclature": "AN/PRC-117G, Multiband Manpack Radio",
        "common_name": "PRC-117G SATCOM Radio",
        "category": "Communications",
        "subcategory": "Manpack Radio",
        "manufacturer": "L3Harris",
        "weight_lbs": 12,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C2020",
        "nsn": "5820-01-432-1567",
        "nomenclature": "AN/PRC-150(C), HF Manpack Radio",
        "common_name": "PRC-150 HF Radio",
        "category": "Communications",
        "subcategory": "HF Radio",
        "manufacturer": "L3Harris",
        "weight_lbs": 14,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "C2100",
        "nsn": "5820-01-543-2189",
        "nomenclature": "AN/VRC-110, Vehicular Radio Set",
        "common_name": "Vehicle Radio (SINCGARS)",
        "category": "Communications",
        "subcategory": "Vehicular Radio",
        "manufacturer": "L3Harris",
        "weight_lbs": 35,
        "crew_size": 0,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C2200",
        "nsn": "5820-01-589-3456",
        "nomenclature": "AN/TRC-170, Digital Troposcatter System",
        "common_name": "Tropo Radio",
        "category": "Communications",
        "subcategory": "Troposcatter",
        "manufacturer": "Raytheon",
        "weight_lbs": 1200,
        "crew_size": 3,
        "echelon_typical": "REGT",
    },
    {
        "tamcn": "C3000",
        "nsn": "7010-01-598-4567",
        "nomenclature": "NOTM, Networking On-The-Move",
        "common_name": "Vehicle SATCOM Terminal",
        "category": "Communications",
        "subcategory": "SATCOM",
        "manufacturer": "General Dynamics",
        "weight_lbs": 75,
        "crew_size": 0,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "C3010",
        "nsn": "5895-01-612-7890",
        "nomenclature": "AN/TPS-80 G/ATOR, Ground/Air Task Oriented Radar",
        "common_name": "G/ATOR Radar",
        "category": "Electronics",
        "subcategory": "Radar",
        "manufacturer": "Northrop Grumman",
        "weight_lbs": 14000,
        "crew_size": 6,
        "echelon_typical": "BN",
    },
]
```

### Night Vision / Optics

```python
OPTICS_NVG = [
    {
        "tamcn": "C1000",
        "nsn": "5855-01-648-2135",
        "nomenclature": "AN/PVS-31A, Binocular Night Vision Device",
        "common_name": "PVS-31 NVGs (Binos)",
        "category": "Optics",
        "subcategory": "Night Vision",
        "manufacturer": "L3Harris",
        "weight_lbs": 1,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C1010",
        "nsn": "5855-01-432-0524",
        "nomenclature": "AN/PVS-14, Monocular Night Vision Device",
        "common_name": "PVS-14 NVG (Mono)",
        "category": "Optics",
        "subcategory": "Night Vision",
        "manufacturer": "L3Harris",
        "weight_lbs": 1,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C1100",
        "nsn": "5855-01-634-5678",
        "nomenclature": "AN/PAS-28 LBTIS, Lightweight Boresighted Thermal Imaging System",
        "common_name": "Thermal Weapon Sight",
        "category": "Optics",
        "subcategory": "Thermal",
        "manufacturer": "DRS Technologies",
        "weight_lbs": 4,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C1200",
        "nsn": "1240-01-576-4321",
        "nomenclature": "SU-260A/PVS, ACOG 4x32, Rifle Combat Optic",
        "common_name": "ACOG",
        "category": "Optics",
        "subcategory": "Rifle Optic",
        "manufacturer": "Trijicon",
        "weight_lbs": 1,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "C1210",
        "nsn": "1240-01-634-8901",
        "nomenclature": "Squad Common Optic (SCO), 1-8x Variable Rifle Scope",
        "common_name": "SCO Variable Optic",
        "category": "Optics",
        "subcategory": "Rifle Optic",
        "manufacturer": "Trijicon",
        "weight_lbs": 2,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
]
```

---

## Seed Data: Supply Catalog

Create `backend/seed/seed_supply_catalog.py`:

### Class I — Subsistence (Rations & Water)

```python
CLASS_I_ITEMS = [
    {"nsn": "8970-00-149-1094", "nomenclature": "MEAL, READY TO EAT (MRE), Case of 12",
     "common_name": "MRE Case", "supply_class": "I", "unit_of_issue": "CS", "unit_of_issue_desc": "Case",
     "category": "Rations", "subcategory": "Combat"},
    {"nsn": "8970-01-448-2270", "nomenclature": "MEAL, READY TO EAT (MRE), Individual",
     "common_name": "MRE", "supply_class": "I", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Rations", "subcategory": "Combat"},
    {"nsn": "8970-01-321-9876", "nomenclature": "FIRST STRIKE RATION (FSR)",
     "common_name": "First Strike Ration", "supply_class": "I", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Rations", "subcategory": "Combat"},
    {"nsn": "8970-01-E63-1234", "nomenclature": "UNITIZED GROUP RATION - HEAT & SERVE (UGR-H&S)",
     "common_name": "UGR Heat & Serve", "supply_class": "I", "unit_of_issue": "MD", "unit_of_issue_desc": "Module",
     "category": "Rations", "subcategory": "Group"},
    {"nsn": "8970-01-E63-1235", "nomenclature": "UNITIZED GROUP RATION - A (UGR-A)",
     "common_name": "UGR-A (Fresh)", "supply_class": "I", "unit_of_issue": "MD", "unit_of_issue_desc": "Module",
     "category": "Rations", "subcategory": "Group"},
    {"nsn": "8960-00-149-2345", "nomenclature": "WATER, POTABLE, BULK",
     "common_name": "Potable Water", "supply_class": "I", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "Water", "subcategory": "Potable"},
    {"nsn": "8960-01-123-4567", "nomenclature": "WATER, PURIFICATION TABLETS",
     "common_name": "Water Purification Tabs", "supply_class": "I", "unit_of_issue": "BT", "unit_of_issue_desc": "Bottle",
     "category": "Water", "subcategory": "Purification"},
]
```

### Class III — POL (Petroleum, Oils, Lubricants)

```python
CLASS_III_ITEMS = [
    {"nsn": "9130-00-286-5294", "nomenclature": "FUEL, AVIATION, TURBINE, JP-8",
     "common_name": "JP-8 Jet Fuel", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Fuel", "is_hazmat": True},
    {"nsn": "9130-01-412-5678", "nomenclature": "FUEL, AVIATION, TURBINE, JP-5",
     "common_name": "JP-5 Naval Jet Fuel", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Fuel", "is_hazmat": True},
    {"nsn": "9140-00-286-5295", "nomenclature": "FUEL, DIESEL, DF-2",
     "common_name": "Diesel Fuel", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Fuel", "is_hazmat": True},
    {"nsn": "9130-00-160-1818", "nomenclature": "GASOLINE, AUTOMOTIVE, UNLEADED",
     "common_name": "MOGAS", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Fuel", "is_hazmat": True},
    {"nsn": "9150-01-197-7688", "nomenclature": "OIL, LUBRICATING, ENGINE, 15W-40",
     "common_name": "Motor Oil 15W-40", "supply_class": "III", "unit_of_issue": "QT", "unit_of_issue_desc": "Quart",
     "category": "POL", "subcategory": "Lubricant"},
    {"nsn": "9150-01-352-3456", "nomenclature": "GREASE, AUTOMOTIVE AND ARTILLERY (GAA)",
     "common_name": "GAA Grease", "supply_class": "III", "unit_of_issue": "TU", "unit_of_issue_desc": "Tube",
     "category": "POL", "subcategory": "Lubricant"},
    {"nsn": "9150-00-189-6727", "nomenclature": "HYDRAULIC FLUID, MIL-PRF-83282",
     "common_name": "Hydraulic Fluid", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Fluid"},
    {"nsn": "6850-01-328-4567", "nomenclature": "COOLANT, ENGINE, EXTENDED LIFE",
     "common_name": "Antifreeze/Coolant", "supply_class": "III", "unit_of_issue": "GL", "unit_of_issue_desc": "Gallon",
     "category": "POL", "subcategory": "Coolant"},
]
```

### Class V — Ammunition

```python
CLASS_V_ITEMS = [
    # ── Small Arms ───────────────────────────────────────────────────
    {"dodic": "A059", "nsn": "1305-01-440-8567", "nomenclature": "CART, 5.56MM, BALL, M855A1 EPR",
     "common_name": "5.56mm Ball (Green Tip)", "caliber": "5.56x45mm",
     "weapon_system": "M27 IAR, M4, M16, M249",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.025},
    {"dodic": "A064", "nsn": "1305-01-572-3456", "nomenclature": "CART, 5.56MM, TRACER, M856A1",
     "common_name": "5.56mm Tracer", "caliber": "5.56x45mm",
     "weapon_system": "M27 IAR, M4, M16, M249",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.025},
    {"dodic": "A063", "nsn": "1305-01-234-5670", "nomenclature": "CART, 5.56MM, BLANK, M200",
     "common_name": "5.56mm Blank", "caliber": "5.56x45mm",
     "weapon_system": "M27 IAR, M4, M16, M249",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.015},
    {"dodic": "A111", "nsn": "1305-00-262-0687", "nomenclature": "CART, 7.62MM, BALL, M80A1",
     "common_name": "7.62mm Ball", "caliber": "7.62x51mm",
     "weapon_system": "M240, M110, M40",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.055},
    {"dodic": "A131", "nsn": "1305-01-234-5671", "nomenclature": "CART, 7.62MM, LINKED, 4B1T, M80/M62",
     "common_name": "7.62mm Linked (4:1 Ball/Tracer)", "caliber": "7.62x51mm",
     "weapon_system": "M240",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.060},
    {"dodic": "A557", "nsn": "1305-00-063-0000", "nomenclature": "CART, .50 CAL, LINKED, 4B1T, M33/M17",
     "common_name": ".50 Cal Linked", "caliber": "12.7x99mm",
     "weapon_system": "M2A1",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.250},
    {"dodic": "A598", "nsn": "1305-00-322-9716", "nomenclature": "CART, 9MM, BALL, M882",
     "common_name": "9mm Ball", "caliber": "9x19mm",
     "weapon_system": "M18, M9",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.026},

    # ── Grenades & Pyrotechnics ──────────────────────────────────────
    {"dodic": "G878", "nsn": "1330-01-111-1111", "nomenclature": "GRENADE, HAND, FRAG, M67",
     "common_name": "Frag Grenade", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 0.875},
    {"dodic": "G930", "nsn": "1330-00-234-5672", "nomenclature": "GRENADE, HAND, SMOKE, M18 (Various Colors)",
     "common_name": "Smoke Grenade", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 1.19},
    {"dodic": "G940", "nsn": "1330-01-567-8901", "nomenclature": "GRENADE, HAND, FLASHBANG, M84",
     "common_name": "Flashbang", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 0.47},
    {"dodic": "G963", "nsn": "1370-01-234-5673", "nomenclature": "CHARGE, DEMOLITION, C4, M112",
     "common_name": "C4 Demolition Block", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 1.25, "is_controlled": True},

    # ── 40mm Grenades ────────────────────────────────────────────────
    {"dodic": "B542", "nsn": "1310-01-456-7890", "nomenclature": "CART, 40MM, HE, M433 HEDP",
     "common_name": "40mm HEDP", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51},
    {"dodic": "B546", "nsn": "1310-01-456-7891", "nomenclature": "CART, 40MM, LINKED, HE, MK19",
     "common_name": "40mm HE Linked (Mk 19)", "caliber": "40x53mm",
     "weapon_system": "Mk 19",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.75},

    # ── Mortars ──────────────────────────────────────────────────────
    {"dodic": "B613", "nsn": "1315-01-234-5674", "nomenclature": "CART, 60MM, HE, M720A1",
     "common_name": "60mm HE Mortar", "caliber": "60mm",
     "weapon_system": "M224A1",
     "unit_of_issue": "RD", "weight_per_round_lbs": 3.75},
    {"dodic": "B625", "nsn": "1315-01-234-5675", "nomenclature": "CART, 81MM, HE, M821A2",
     "common_name": "81mm HE Mortar", "caliber": "81mm",
     "weapon_system": "M252A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 9.7},
    {"dodic": "B650", "nsn": "1315-01-432-5678", "nomenclature": "CART, 120MM, HE, M933A1",
     "common_name": "120mm HE Mortar", "caliber": "120mm",
     "weapon_system": "M327 EFSS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 33.0},

    # ── Artillery ────────────────────────────────────────────────────
    {"dodic": "D544", "nsn": "1320-01-234-5676", "nomenclature": "PROJ, 155MM, HE, M795",
     "common_name": "155mm HE", "caliber": "155mm",
     "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 103.0},
    {"dodic": "D541", "nsn": "1320-01-234-5677", "nomenclature": "PROJ, 155MM, SMOKE, WP, M825A1",
     "common_name": "155mm White Phosphorus", "caliber": "155mm",
     "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 96.0},
    {"dodic": "D563", "nsn": "1320-01-234-5678", "nomenclature": "PROJ, 155MM, ILLUM, M485A2",
     "common_name": "155mm Illumination", "caliber": "155mm",
     "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 90.0},
    {"dodic": "D579", "nsn": "1320-01-567-8902", "nomenclature": "PROJ, 155MM, DPICM, M864",
     "common_name": "155mm DPICM", "caliber": "155mm",
     "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 102.0},
    {"dodic": "D864", "nsn": "1340-01-567-8903", "nomenclature": "ROCKET, 227MM, GMLRS, M31A1",
     "common_name": "GMLRS Guided Rocket", "caliber": "227mm",
     "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 672.0},
    {"dodic": "D865", "nsn": "1410-01-567-8904", "nomenclature": "MISSILE, ATACMS, M57",
     "common_name": "ATACMS Tactical Missile", "caliber": "610mm",
     "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 3690.0},

    # ── Anti-Armor Missiles ──────────────────────────────────────────
    {"dodic": "J887", "nsn": "1410-01-453-3834", "nomenclature": "MISSILE, JAVELIN, FGM-148F",
     "common_name": "Javelin Missile", "caliber": "127mm",
     "weapon_system": "FGM-148 Javelin CLU",
     "unit_of_issue": "EA", "weight_per_round_lbs": 26.1},
    {"dodic": "J890", "nsn": "1410-01-067-3569", "nomenclature": "MISSILE, TOW-2B, BGM-71F",
     "common_name": "TOW-2B Missile", "caliber": "152mm",
     "weapon_system": "BGM-71 TOW",
     "unit_of_issue": "EA", "weight_per_round_lbs": 49.9},

    # ── Anti-Ship (MLR) ─────────────────────────────────────────────
    {"dodic": "N001", "nsn": "1410-01-700-0002", "nomenclature": "MISSILE, NSM, Naval Strike Missile",
     "common_name": "NSM Anti-Ship Missile", "caliber": "N/A",
     "weapon_system": "NMESIS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 900.0, "is_controlled": True},

    # ── Mines / Explosives ───────────────────────────────────────────
    {"dodic": "M023", "nsn": "1375-01-234-5679", "nomenclature": "MINE, ANTITANK, M15",
     "common_name": "AT Mine M15", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 29.0, "is_controlled": True},
    {"dodic": "M030", "nsn": "1375-01-234-5680", "nomenclature": "MINE, ANTIPERSONNEL, M18A1 (CLAYMORE)",
     "common_name": "Claymore Mine", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 3.5, "is_controlled": True},
]
```

### Class VIII — Medical

```python
CLASS_VIII_ITEMS = [
    {"nsn": "6515-01-532-8056", "nomenclature": "KIT, COMBAT LIFESAVER (CLS)",
     "common_name": "CLS Bag", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Medical", "subcategory": "Kit"},
    {"nsn": "6515-01-569-7324", "nomenclature": "BANDAGE, COMBAT GAUZE (QUIKCLOT)",
     "common_name": "Combat Gauze", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Hemorrhage Control"},
    {"nsn": "6515-01-587-9762", "nomenclature": "TOURNIQUET, COMBAT APPLICATION (CAT)",
     "common_name": "CAT Tourniquet", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Hemorrhage Control"},
    {"nsn": "6515-01-521-7976", "nomenclature": "CHEST SEAL, HYFIN, VENTED",
     "common_name": "Chest Seal", "supply_class": "VIII", "unit_of_issue": "PG", "unit_of_issue_desc": "Package",
     "category": "Medical", "subcategory": "Airway"},
    {"nsn": "6505-01-530-3675", "nomenclature": "NEEDLE, DECOMPRESSION, 14GA",
     "common_name": "Decompression Needle", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Airway"},
    {"nsn": "6515-01-518-8367", "nomenclature": "NASOPHARYNGEAL AIRWAY (NPA), 28FR",
     "common_name": "NPA", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Airway"},
    {"nsn": "6505-01-468-2543", "nomenclature": "IV SET, SALINE LOCK",
     "common_name": "Saline Lock IV", "supply_class": "VIII", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Medical", "subcategory": "IV"},
    {"nsn": "6505-00-139-3497", "nomenclature": "SOLUTION, SODIUM CHLORIDE, 0.9%, 1000ML",
     "common_name": "Normal Saline 1L", "supply_class": "VIII", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Medical", "subcategory": "IV Fluid"},
    {"nsn": "6505-01-234-5681", "nomenclature": "SOLUTION, LACTATED RINGERS, 1000ML",
     "common_name": "LR 1L", "supply_class": "VIII", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Medical", "subcategory": "IV Fluid"},
    {"nsn": "6510-01-461-2345", "nomenclature": "IFAK, IMPROVED FIRST AID KIT",
     "common_name": "IFAK", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Medical", "subcategory": "Kit"},
    {"nsn": "6515-01-598-1234", "nomenclature": "LITTER, POLELESS (SKED)",
     "common_name": "SKED Litter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Evacuation"},
    {"nsn": "6515-00-935-6602", "nomenclature": "LITTER, FOLDING (TALON II)",
     "common_name": "Collapsible Litter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Evacuation"},
    {"nsn": "6505-01-367-8901", "nomenclature": "MORPHINE SULFATE, AUTO-INJECTOR, 10MG",
     "common_name": "Morphine Auto-Injector", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Analgesic", "is_controlled": True},
    {"nsn": "6505-01-598-4568", "nomenclature": "KETAMINE HCL, 500MG/10ML, INJ",
     "common_name": "Ketamine", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Medical", "subcategory": "Analgesic", "is_controlled": True},
    {"nsn": "6505-01-098-7654", "nomenclature": "TRANEXAMIC ACID (TXA), 1G/10ML, INJ",
     "common_name": "TXA", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Medical", "subcategory": "Blood Product"},
    {"nsn": "6505-01-543-2190", "nomenclature": "WHOLE BLOOD, FREEZE-DRIED PLASMA (FDP)",
     "common_name": "Freeze-Dried Plasma", "supply_class": "VIII", "unit_of_issue": "UN", "unit_of_issue_desc": "Unit",
     "category": "Medical", "subcategory": "Blood Product"},
]
```

### Class II — Clothing & Individual Equipment

```python
CLASS_II_ITEMS = [
    {"nsn": "8415-01-598-9870", "nomenclature": "PLATE CARRIER, MODULAR SCALABLE VEST (MSV)",
     "common_name": "Plate Carrier", "supply_class": "II", "unit_of_issue": "EA",
     "category": "PPE", "subcategory": "Body Armor"},
    {"nsn": "8470-01-520-7373", "nomenclature": "SAPI PLATE, ENHANCED (ESAPI), MEDIUM",
     "common_name": "ESAPI Plate (Medium)", "supply_class": "II", "unit_of_issue": "EA",
     "category": "PPE", "subcategory": "Body Armor"},
    {"nsn": "8470-01-506-6369", "nomenclature": "HELMET, ENHANCED COMBAT (ECH), MEDIUM",
     "common_name": "Combat Helmet", "supply_class": "II", "unit_of_issue": "EA",
     "category": "PPE", "subcategory": "Helmet"},
    {"nsn": "8465-01-598-4569", "nomenclature": "PACK, MAIN, FILBE (USMC)",
     "common_name": "FILBE Main Pack", "supply_class": "II", "unit_of_issue": "EA",
     "category": "Individual Equipment", "subcategory": "Pack"},
    {"nsn": "8465-01-598-4570", "nomenclature": "PACK, ASSAULT, FILBE (USMC)",
     "common_name": "FILBE Assault Pack", "supply_class": "II", "unit_of_issue": "EA",
     "category": "Individual Equipment", "subcategory": "Pack"},
    {"nsn": "8465-01-519-8563", "nomenclature": "HYDRATION CARRIER, CAMELBAK 100OZ",
     "common_name": "CamelBak", "supply_class": "II", "unit_of_issue": "EA",
     "category": "Individual Equipment", "subcategory": "Hydration"},
    {"nsn": "8415-01-588-4321", "nomenclature": "UNIFORM, UTILITY, MCCUU, WOODLAND, SET",
     "common_name": "Woodland Cammies (Set)", "supply_class": "II", "unit_of_issue": "SE",
     "category": "Clothing", "subcategory": "Uniform"},
    {"nsn": "8415-01-588-4322", "nomenclature": "UNIFORM, UTILITY, MCCUU, DESERT, SET",
     "common_name": "Desert Cammies (Set)", "supply_class": "II", "unit_of_issue": "SE",
     "category": "Clothing", "subcategory": "Uniform"},
    {"nsn": "8430-01-598-4571", "nomenclature": "BOOTS, COMBAT, RAT, HOT WEATHER",
     "common_name": "Combat Boots (Hot)", "supply_class": "II", "unit_of_issue": "PR",
     "category": "Clothing", "subcategory": "Footwear"},
    {"nsn": "8430-01-598-4572", "nomenclature": "BOOTS, COMBAT, RAT, TEMPERATE",
     "common_name": "Combat Boots (Temperate)", "supply_class": "II", "unit_of_issue": "PR",
     "category": "Clothing", "subcategory": "Footwear"},
]
```

### Class IV — Construction / Fortification

```python
CLASS_IV_ITEMS = [
    {"nsn": "5680-01-234-5682", "nomenclature": "HESCO BARRIER, MIL-1 (4x4x4 ft)",
     "common_name": "HESCO Barrier", "supply_class": "IV", "unit_of_issue": "EA",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5660-00-262-1234", "nomenclature": "WIRE, CONCERTINA, TRIPLE STRAND",
     "common_name": "Concertina Wire", "supply_class": "IV", "unit_of_issue": "CL",
     "category": "Fortification", "subcategory": "Wire", "unit_of_issue_desc": "Coil"},
    {"nsn": "5680-01-345-6789", "nomenclature": "SANDBAG, POLYPROPYLENE",
     "common_name": "Sandbag", "supply_class": "IV", "unit_of_issue": "BL",
     "category": "Fortification", "subcategory": "Barrier", "unit_of_issue_desc": "Bale"},
    {"nsn": "5640-01-234-5683", "nomenclature": "LUMBER, DIMENSION, 2x4x8FT",
     "common_name": "2x4 Lumber", "supply_class": "IV", "unit_of_issue": "BD",
     "category": "Construction", "subcategory": "Lumber", "unit_of_issue_desc": "Board"},
    {"nsn": "5670-01-456-7891", "nomenclature": "PICKET, STEEL, T-POST, 6FT",
     "common_name": "T-Post", "supply_class": "IV", "unit_of_issue": "EA",
     "category": "Fortification", "subcategory": "Wire"},
]
```

### Class IX — Repair Parts (Common)

```python
CLASS_IX_ITEMS = [
    {"nsn": "2920-01-345-6790", "nomenclature": "STARTER, ENGINE, HMMWV",
     "common_name": "Humvee Starter", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Automotive"},
    {"nsn": "2920-01-432-5679", "nomenclature": "ALTERNATOR, HMMWV",
     "common_name": "Humvee Alternator", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Automotive"},
    {"nsn": "2530-01-543-2191", "nomenclature": "TIRE, PNEUMATIC, MTVR, 16.00R20",
     "common_name": "MTVR Tire", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Tires"},
    {"nsn": "2530-01-678-9012", "nomenclature": "TIRE, PNEUMATIC, JLTV, 37X12.50R16.5",
     "common_name": "JLTV Tire", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Tires"},
    {"nsn": "2910-01-345-6791", "nomenclature": "FILTER, OIL, ENGINE, HMMWV/JLTV",
     "common_name": "Oil Filter", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Filters"},
    {"nsn": "2910-01-345-6792", "nomenclature": "FILTER, FUEL, MTVR",
     "common_name": "Fuel Filter (MTVR)", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Filters"},
    {"nsn": "2940-01-234-5684", "nomenclature": "FILTER, AIR, ENGINE, JLTV",
     "common_name": "Air Filter (JLTV)", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Filters"},
    {"nsn": "6135-01-456-7892", "nomenclature": "BATTERY, STORAGE, 12V, 6TN",
     "common_name": "Vehicle Battery 6TN", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Electrical"},
    {"nsn": "6135-01-490-4316", "nomenclature": "BATTERY, LITHIUM, BA-5590/U",
     "common_name": "Radio Battery BA-5590", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Batteries"},
    {"nsn": "6135-01-524-7382", "nomenclature": "BATTERY, LITHIUM, CONFORMAL, BB-2590/U",
     "common_name": "Conformal Battery BB-2590", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Batteries"},
    {"nsn": "5340-01-234-5685", "nomenclature": "TRACKPAD, ACV/AAV",
     "common_name": "ACV Track Pad", "supply_class": "IX", "unit_of_issue": "EA",
     "category": "Repair Parts", "subcategory": "Track"},
]
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
- Grouped by category (Tactical Vehicle, Combat Vehicle, Small Arms, etc.)
- Shows TAMCN + nomenclature + common name in results
- On selection, auto-fills TAMCN, nomenclature, NSN into parent form
- Support filtering by category dropdown

### Supply Item Selector Component

Create a reusable `<SupplySelector>` component:

- Type-ahead search that queries `/api/v1/catalog/supply?q=...`
- Grouped by supply class (I, III, V, VIII, IX)
- Shows NSN + nomenclature + unit of issue in results
- Ammo items show DODIC + caliber + weapon system
- On selection, auto-fills NSN, nomenclature, supply class, unit of issue

---

## Seed Process

Add seeding to the app lifespan:

```python
# In main.py lifespan
await seed_equipment_catalog(db)
await seed_supply_catalog(db)
await seed_ammunition_catalog(db)
```

Each seed function should be idempotent — check by NSN/TAMCN/DODIC before inserting.

---

## Summary of Items

| Category | Count | Key Items |
|----------|-------|-----------|
| **Tactical Vehicles** | 20+ | JLTV (4 variants), HMMWV (4 variants), MTVR (6 variants), LVS, LVSR, Growler, MRZR, forklifts |
| **Combat Vehicles** | 15+ | ACV (4 variants), AAV (3 variants), LAV (6 variants), M88, ABV, ACE, AVLB, NMESIS |
| **Artillery** | 3 | M777A2, M142 HIMARS, M327 EFSS |
| **Infantry Weapons** | 20+ | M27, M4, M16, M18, M9, M240, M249, M2, Mk19, M224, M252, Javelin, TOW, MAAWS, AT4, Stinger, M110, M40, M107, M320, M1014 |
| **Communications** | 7+ | PRC-152, PRC-117G, PRC-150, VRC-110, TRC-170, NOTM, G/ATOR |
| **Optics/NVG** | 5+ | PVS-31, PVS-14, PAS-28, ACOG, SCO |
| **Class I (Rations)** | 7 | MRE, FSR, UGR-H&S, UGR-A, Water, Purification |
| **Class III (POL)** | 8 | JP-8, JP-5, Diesel, MOGAS, Motor Oil, GAA, Hydraulic Fluid, Coolant |
| **Class V (Ammo)** | 30+ | 5.56mm, 7.62mm, .50 cal, 9mm, 40mm, 60/81/120mm mortar, 155mm, GMLRS, ATACMS, Javelin, TOW, NSM, grenades, mines |
| **Class VIII (Medical)** | 16 | CLS Kit, IFAK, Combat Gauze, CAT Tourniquet, Chest Seal, NPA, IV, Saline, LR, TXA, FDP, Morphine, Ketamine, Litters |
| **Class II (Clothing)** | 10 | Plate Carrier, ESAPI, ECH, FILBE, CamelBak, Cammies, Boots |
| **Class IV (Construction)** | 5 | HESCO, Concertina, Sandbags, Lumber, T-Posts |
| **Class IX (Parts)** | 11 | Starters, alternators, tires, filters, batteries |

**Total: ~150+ catalog items** covering the most commonly tracked USMC equipment and supply items.

---

## Important Notes

- **NSN format**: 13 digits formatted as `XXXX-XX-XXX-XXXX` (4-2-3-4). The first 4 digits are the Federal Supply Class.
- **TAMCN format**: Alphanumeric, typically letter + 4 digits (e.g., `E0846`, `D1195`, `A2240`). The first letter indicates commodity: A=Ordnance, B=Armored/Tracked, C=Communications/Electronics, D=Motor Transport, E=Engineer/New Generation.
- **DODIC format**: Alphanumeric, typically letter + 3 digits (e.g., `A059`, `D544`). Used exclusively for Class V ammunition.
- **Some NSNs in this catalog are representative** — actual NSNs should be verified against WebFLIS for production use. The structure and format are correct.
- **Seed data is expandable** — the catalog is designed so users can add their own items via an admin interface. The seed data provides the most common starting point.
- **Keep backward compatibility** — existing `EquipmentStatus` and `SupplyStatusRecord` tables should work without the catalog FK (nullable). The catalog is an enhancement, not a requirement.
