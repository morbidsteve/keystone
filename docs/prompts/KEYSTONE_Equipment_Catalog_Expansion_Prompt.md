# KEYSTONE — Equipment & Supply Catalog Expansion

## Mission

Expand the existing equipment and supply catalog seed data with **~200+ additional items** covering categories that were missing from the initial catalog. This prompt assumes the base catalog (from `KEYSTONE_Equipment_Supply_Catalog_Prompt.md`) has already been implemented — the models, API endpoints, and frontend selectors already exist. This prompt **only adds new seed data entries** to the existing seed files.

**Do NOT recreate or modify the database models or API endpoints.** Just add new entries to the existing seed arrays/lists.

---

## New Equipment Seed Data

Add the following to `backend/seed/seed_equipment_catalog.py`. Append to existing arrays or create new category arrays and merge them into the master seed list.

### Aviation — Rotary Wing

```python
AVIATION_ROTARY = [
    {
        "tamcn": "F1000",
        "nsn": "1520-01-458-2901",
        "nomenclature": "AH-1Z Viper, Attack Helicopter",
        "common_name": "Viper",
        "category": "Aviation",
        "subcategory": "Attack Helicopter",
        "manufacturer": "Bell Helicopter",
        "weight_lbs": 18500,
        "crew_size": 2,
        "pax_capacity": 0,
        "echelon_typical": "SQDN",
        "notes": "HMLA squadrons. Weapon stations: 6. Engines: 2x GE T700-GE-401C",
    },
    {
        "tamcn": "F1010",
        "nsn": "1520-01-458-2902",
        "nomenclature": "UH-1Y Venom, Utility Helicopter",
        "common_name": "Venom",
        "category": "Aviation",
        "subcategory": "Utility Helicopter",
        "manufacturer": "Bell Helicopter",
        "weight_lbs": 18000,
        "crew_size": 4,
        "pax_capacity": 8,
        "echelon_typical": "SQDN",
        "notes": "HMLA squadrons. Can carry 6 litters for CASEVAC",
    },
    {
        "tamcn": "F1020",
        "nsn": "1520-01-261-3456",
        "nomenclature": "CH-53E Super Stallion, Heavy Lift Helicopter",
        "common_name": "Super Stallion",
        "category": "Aviation",
        "subcategory": "Heavy Lift Helicopter",
        "manufacturer": "Sikorsky Aircraft",
        "weight_lbs": 69750,
        "crew_size": 4,
        "pax_capacity": 30,
        "echelon_typical": "SQDN",
        "notes": "HMH squadrons. 3x T64-GE-419 engines. External lift: 36,000 lbs",
    },
    {
        "tamcn": "F1025",
        "nsn": "1520-01-700-1001",
        "nomenclature": "CH-53K King Stallion, Heavy Lift Helicopter",
        "common_name": "King Stallion",
        "category": "Aviation",
        "subcategory": "Heavy Lift Helicopter",
        "manufacturer": "Sikorsky Aircraft",
        "weight_lbs": 88000,
        "crew_size": 5,
        "pax_capacity": 30,
        "echelon_typical": "SQDN",
        "notes": "HMH squadrons. 3x GE T408-GE-400 engines. External lift: 36,000 lbs. Replacement for CH-53E",
    },
]
```

### Aviation — Tilt-Rotor

```python
AVIATION_TILTROTOR = [
    {
        "tamcn": "F1100",
        "nsn": "1520-01-520-7890",
        "nomenclature": "MV-22B Osprey, Tilt-Rotor Transport",
        "common_name": "Osprey",
        "category": "Aviation",
        "subcategory": "Tilt-Rotor",
        "manufacturer": "Bell Boeing",
        "weight_lbs": 52600,
        "crew_size": 4,
        "pax_capacity": 24,
        "echelon_typical": "SQDN",
        "notes": "VMM squadrons. Speed: 277 mph. Range: 500 nm. Payload: 24,000 lbs",
    },
]
```

### Aviation — Fixed Wing

```python
AVIATION_FIXED = [
    {
        "tamcn": "F1200",
        "nsn": "1510-01-700-2001",
        "nomenclature": "F-35B Lightning II, STOVL Strike Fighter",
        "common_name": "Lightning II",
        "category": "Aviation",
        "subcategory": "Strike Fighter",
        "manufacturer": "Lockheed Martin",
        "weight_lbs": 49540,
        "crew_size": 1,
        "pax_capacity": 0,
        "echelon_typical": "SQDN",
        "notes": "VMFA squadrons. STOVL capable. 5th generation stealth. F135-PW-600 engine",
    },
    {
        "tamcn": "F1210",
        "nsn": "1510-01-290-3456",
        "nomenclature": "F/A-18C Hornet, Strike Fighter",
        "common_name": "Hornet (Single-Seat)",
        "category": "Aviation",
        "subcategory": "Strike Fighter",
        "manufacturer": "Boeing",
        "weight_lbs": 36970,
        "crew_size": 1,
        "pax_capacity": 0,
        "echelon_typical": "SQDN",
        "notes": "VMFA squadrons. Legacy fighter, planned retirement ~2030. APG-79(V)4 AESA radar upgrade",
    },
    {
        "tamcn": "F1215",
        "nsn": "1510-01-290-3457",
        "nomenclature": "F/A-18D Hornet, Two-Seat Strike Fighter",
        "common_name": "Hornet (Two-Seat)",
        "category": "Aviation",
        "subcategory": "Strike Fighter",
        "manufacturer": "Boeing",
        "weight_lbs": 37150,
        "crew_size": 2,
        "pax_capacity": 0,
        "echelon_typical": "SQDN",
        "notes": "VMFA(AW) squadrons. Two-seat all-weather variant",
    },
    {
        "tamcn": "F1300",
        "nsn": "1510-01-435-7890",
        "nomenclature": "KC-130J Super Hercules, Aerial Refueling/Transport",
        "common_name": "Super Hercules",
        "category": "Aviation",
        "subcategory": "Transport/Tanker",
        "manufacturer": "Lockheed Martin",
        "weight_lbs": 165000,
        "crew_size": 5,
        "pax_capacity": 92,
        "echelon_typical": "SQDN",
        "notes": "VMGR squadrons. 4x Rolls-Royce AE 2100D3 turboprops. Payload: 42,000 lbs. 64 paratroopers",
    },
]
```

### Aviation — UAS / Drones

```python
AVIATION_UAS = [
    {
        "tamcn": "F1400",
        "nsn": "1550-01-612-3456",
        "nomenclature": "RQ-21A Blackjack, Small Tactical UAS",
        "common_name": "Blackjack",
        "category": "Aviation",
        "subcategory": "Small Tactical UAS",
        "manufacturer": "Boeing Insitu",
        "weight_lbs": 135,
        "crew_size": 0,
        "echelon_typical": "SQDN",
        "notes": "VMU squadrons. System: 5 air vehicles + 2 GCS. Endurance: 13 hrs. Day/night FMV + IR + LRF",
    },
    {
        "tamcn": "F1410",
        "nsn": "1550-01-598-7890",
        "nomenclature": "RQ-20B Puma AE, Small UAS",
        "common_name": "Puma",
        "category": "Aviation",
        "subcategory": "Small UAS",
        "manufacturer": "AeroVironment",
        "weight_lbs": 13,
        "crew_size": 0,
        "echelon_typical": "CO",
        "notes": "Hand-launched. System: 3 air vehicles + 1 GCS. Endurance: 3.5 hrs. EO/IR 50x zoom. Battery powered",
    },
    {
        "tamcn": "F1420",
        "nsn": "1550-01-700-3001",
        "nomenclature": "MQ-9A Reaper, Medium-Altitude Long-Endurance UAS",
        "common_name": "Reaper",
        "category": "Aviation",
        "subcategory": "MALE UAS",
        "manufacturer": "General Atomics",
        "weight_lbs": 10500,
        "crew_size": 0,
        "echelon_typical": "SQDN",
        "notes": "VMU-3. IOC Aug 2023. Endurance: 27 hrs. Max alt: 50,000 ft. Indo-Pacific ISR focus",
    },
    {
        "tamcn": "F1430",
        "nsn": "1550-01-680-4567",
        "nomenclature": "Switchblade 300, Loitering Munition",
        "common_name": "Switchblade",
        "category": "Aviation",
        "subcategory": "Loitering Munition",
        "manufacturer": "AeroVironment",
        "weight_lbs": 6,
        "crew_size": 0,
        "echelon_typical": "CO",
        "is_serialized": False,
        "notes": "Tube-launched kamikaze drone. Backpackable. Anti-personnel warhead. 10+ min endurance",
    },
]
```

### Watercraft / Amphibious Connectors

```python
WATERCRAFT = [
    {
        "tamcn": "G1000",
        "nsn": "1940-01-345-6789",
        "nomenclature": "LCAC, Landing Craft Air Cushion",
        "common_name": "LCAC Hovercraft",
        "category": "Watercraft",
        "subcategory": "Landing Craft",
        "manufacturer": "Textron Systems",
        "weight_lbs": 182000,
        "crew_size": 5,
        "pax_capacity": 180,
        "echelon_typical": "GRP",
        "notes": "Payload: 60 tons (75 overload). Speed: 40+ knots. Navy-operated, USMC-embarked",
    },
    {
        "tamcn": "G1010",
        "nsn": "1940-01-234-5678",
        "nomenclature": "LCU-1700, Landing Craft Utility",
        "common_name": "Landing Craft Utility",
        "category": "Watercraft",
        "subcategory": "Landing Craft",
        "manufacturer": "Various",
        "weight_lbs": 381000,
        "crew_size": 14,
        "pax_capacity": 350,
        "echelon_typical": "GRP",
        "notes": "Payload: 170 tons. Can carry 2x M1A1 tanks. 2x CAT C18 diesel. 7-day sustained ops",
    },
    {
        "tamcn": "G1020",
        "nsn": "1940-01-567-8901",
        "nomenclature": "SSC, Ship-to-Shore Connector (LCAC 100)",
        "common_name": "SSC / LCAC 100",
        "category": "Watercraft",
        "subcategory": "Landing Craft",
        "manufacturer": "Textron Systems",
        "weight_lbs": 210000,
        "crew_size": 5,
        "pax_capacity": 145,
        "echelon_typical": "GRP",
        "notes": "LCAC replacement. Payload: 74 tons. Speed: 35+ knots. More fuel efficient",
    },
    {
        "tamcn": "G1100",
        "nsn": "1940-01-123-4567",
        "nomenclature": "CRRC F470, Combat Rubber Raiding Craft",
        "common_name": "Zodiac / CRRC",
        "category": "Watercraft",
        "subcategory": "Small Boat",
        "manufacturer": "Zodiac",
        "weight_lbs": 161,
        "crew_size": 2,
        "pax_capacity": 8,
        "echelon_typical": "CO",
        "notes": "Recon/MARSOC. 55 HP pump-jet. Range: 60 mi. Speed: 18 kts. 8 airtight chambers",
    },
    {
        "tamcn": "G1110",
        "nsn": "1940-01-456-7890",
        "nomenclature": "CRI, Combat Raiding Inflatable (11-Meter RHIB)",
        "common_name": "11-Meter RHIB",
        "category": "Watercraft",
        "subcategory": "Small Boat",
        "manufacturer": "Various",
        "weight_lbs": 15000,
        "crew_size": 4,
        "pax_capacity": 18,
        "echelon_typical": "BN",
        "notes": "Rigid-hull inflatable. Recon/MARSOC insertion and extraction",
    },
]
```

### Power Generation

```python
GENERATORS = [
    {
        "tamcn": "H1000",
        "nsn": "6115-01-274-7390",
        "nomenclature": "MEP-831A, Generator Set, 3kW TQG",
        "common_name": "3kW Tactical Quiet Generator",
        "category": "Power Generation",
        "subcategory": "Small Generator",
        "manufacturer": "Various",
        "weight_lbs": 334,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "Yanmar single-cyl diesel. JP-8/DF-2. 8 hrs runtime on 4-gal tank. 6-man lift",
    },
    {
        "tamcn": "H1010",
        "nsn": "6115-01-275-5061",
        "nomenclature": "MEP-803A, Generator Set, 10kW TQG",
        "common_name": "10kW Tactical Quiet Generator",
        "category": "Power Generation",
        "subcategory": "Medium Generator",
        "manufacturer": "Various",
        "weight_lbs": 1242,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "JP-8/DF-2. 120/240V single-phase or 120/208V three-phase. 24VDC start",
    },
    {
        "tamcn": "H1020",
        "nsn": "6115-01-275-5062",
        "nomenclature": "MEP-804B, Generator Set, 15kW TQG",
        "common_name": "15kW Tactical Quiet Generator",
        "category": "Power Generation",
        "subcategory": "Medium Generator",
        "manufacturer": "Various",
        "weight_lbs": 1800,
        "crew_size": 1,
        "echelon_typical": "BN",
        "notes": "15kW three-phase / 10kW single-phase. 10-wire configuration",
    },
    {
        "tamcn": "H1030",
        "nsn": "6115-01-275-5063",
        "nomenclature": "MEP-805B, Generator Set, 30kW TQG",
        "common_name": "30kW Tactical Quiet Generator",
        "category": "Power Generation",
        "subcategory": "Large Generator",
        "manufacturer": "Various",
        "weight_lbs": 3500,
        "crew_size": 1,
        "echelon_typical": "BN",
        "notes": "30kW three-phase / 20kW single-phase. COC/TOC power",
    },
    {
        "tamcn": "H1040",
        "nsn": "6115-01-275-5064",
        "nomenclature": "MEP-806B, Generator Set, 60kW TQG",
        "common_name": "60kW Tactical Quiet Generator",
        "category": "Power Generation",
        "subcategory": "Large Generator",
        "manufacturer": "Various",
        "weight_lbs": 5800,
        "crew_size": 2,
        "echelon_typical": "BN",
        "notes": "Battalion-level power. Major base camp operations",
    },
    {
        "tamcn": "H1100",
        "nsn": "6130-01-598-4567",
        "nomenclature": "GREENS, Ground Renewable Expeditionary Energy Network System",
        "common_name": "GREENS Solar Power System",
        "category": "Power Generation",
        "subcategory": "Solar",
        "manufacturer": "Various",
        "weight_lbs": 200,
        "crew_size": 1,
        "echelon_typical": "BN",
        "notes": "300W solar. Reduces generator fuel dependency. BN COC power supplement",
    },
    {
        "tamcn": "H1110",
        "nsn": "6130-01-612-3456",
        "nomenclature": "SPACES, Solar Portable Alternative Communications Energy System",
        "common_name": "SPACES Portable Solar",
        "category": "Power Generation",
        "subcategory": "Solar",
        "manufacturer": "Various",
        "weight_lbs": 35,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "Battery recharging for radios/small electronics. Reduces battery resupply",
    },
]
```

### CBRN Equipment

```python
CBRN_EQUIPMENT = [
    {
        "tamcn": "H2000",
        "nsn": "4240-01-512-4434",
        "nomenclature": "M50 JSGPM, Joint Service General Purpose Mask",
        "common_name": "M50 Gas Mask",
        "category": "CBRN",
        "subcategory": "Respiratory Protection",
        "manufacturer": "Avon Protection",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "H2010",
        "nsn": "8415-01-444-2310",
        "nomenclature": "JSLIST, Joint Service Lightweight Integrated Suit Technology (Coat)",
        "common_name": "MOPP Suit - Coat",
        "category": "CBRN",
        "subcategory": "Chemical Protective Suit",
        "manufacturer": "Various",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2011",
        "nsn": "8415-01-444-1238",
        "nomenclature": "JSLIST, Joint Service Lightweight Integrated Suit Technology (Trousers)",
        "common_name": "MOPP Suit - Trousers",
        "category": "CBRN",
        "subcategory": "Chemical Protective Suit",
        "manufacturer": "Various",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2020",
        "nsn": "6665-01-133-4964",
        "nomenclature": "M256A1, Chemical Agent Detection Kit",
        "common_name": "M256 Detection Kit",
        "category": "CBRN",
        "subcategory": "Chemical Detection",
        "manufacturer": "Various",
        "weight_lbs": 3,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2030",
        "nsn": "6665-00-050-8529",
        "nomenclature": "M8, Chemical Agent Detection Paper",
        "common_name": "M8 Detection Paper",
        "category": "CBRN",
        "subcategory": "Chemical Detection",
        "manufacturer": "Luxfer Magtech",
        "weight_lbs": 0,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2031",
        "nsn": "6665-01-226-5589",
        "nomenclature": "M9, Chemical Agent Detection Tape",
        "common_name": "M9 Detection Tape",
        "category": "CBRN",
        "subcategory": "Chemical Detection",
        "manufacturer": "Luxfer Magtech",
        "weight_lbs": 0,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2040",
        "nsn": "6665-01-598-4567",
        "nomenclature": "JCAD M4A1, Joint Chemical Agent Detector",
        "common_name": "JCAD",
        "category": "CBRN",
        "subcategory": "Chemical Detection",
        "manufacturer": "BAE Systems",
        "weight_lbs": 2,
        "crew_size": 1,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "H2050",
        "nsn": "6665-01-456-7890",
        "nomenclature": "M22 ACADA, Automatic Chemical Agent Detection Alarm",
        "common_name": "ACADA",
        "category": "CBRN",
        "subcategory": "Chemical Detection",
        "manufacturer": "Smiths Detection",
        "weight_lbs": 15,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "H2060",
        "nsn": "6850-01-357-8456",
        "nomenclature": "M295, Individual Equipment Decontamination Kit",
        "common_name": "M295 Decon Kit",
        "category": "CBRN",
        "subcategory": "Decontamination",
        "manufacturer": "Various",
        "weight_lbs": 1,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H2070",
        "nsn": "6665-01-543-2190",
        "nomenclature": "AN/PDR-77, Radiac Set (Radiation Detector)",
        "common_name": "AN/PDR-77 Radiation Detector",
        "category": "CBRN",
        "subcategory": "Radiation Detection",
        "manufacturer": "Various",
        "weight_lbs": 5,
        "crew_size": 1,
        "echelon_typical": "BN",
    },
]
```

### Electronic Warfare / Counter-IED

```python
EW_EQUIPMENT = [
    {
        "tamcn": "H3000",
        "nsn": "5865-01-567-8901",
        "nomenclature": "AN/VLQ-12 CREW Duke, Counter RCIED System",
        "common_name": "CREW Duke",
        "category": "Electronic Warfare",
        "subcategory": "Counter-IED",
        "manufacturer": "SRC Inc.",
        "weight_lbs": 200,
        "crew_size": 0,
        "echelon_typical": "CO",
        "notes": "Vehicle-mounted. Jams radio-controlled IED detonation signals",
    },
    {
        "tamcn": "H3010",
        "nsn": "5865-01-612-3456",
        "nomenclature": "JCREW 3.3, Joint Counter RCIED Electronic Warfare",
        "common_name": "JCREW",
        "category": "Electronic Warfare",
        "subcategory": "Counter-IED",
        "manufacturer": "Various",
        "weight_lbs": 50,
        "crew_size": 0,
        "echelon_typical": "CO",
        "notes": "Dismounted/mounted/fixed configurations. Next-gen counter-IED EW",
    },
    {
        "tamcn": "H3020",
        "nsn": "5865-01-680-4567",
        "nomenclature": "AN/ALQ-231, Intrepid Tiger II EW Payload",
        "common_name": "Intrepid Tiger II",
        "category": "Electronic Warfare",
        "subcategory": "Airborne EW",
        "manufacturer": "Various",
        "weight_lbs": 500,
        "crew_size": 0,
        "echelon_typical": "SQDN",
        "notes": "External EW pod for MV-22, rotary wing. Disrupts enemy comms/radar",
    },
]
```

### Shelters / Tents

```python
SHELTERS = [
    {
        "tamcn": "H4000",
        "nsn": "8340-01-452-5919",
        "nomenclature": "MCCT, Marine Corps Combat Tent, Two-Man",
        "common_name": "Combat Tent (2-Man)",
        "category": "Shelter",
        "subcategory": "Individual Tent",
        "manufacturer": "Diamond Brand / Eureka",
        "weight_lbs": 11,
        "crew_size": 2,
        "echelon_typical": "CO",
        "is_serialized": False,
    },
    {
        "tamcn": "H4010",
        "nsn": "8340-01-395-3975",
        "nomenclature": "DRASH 2S, Deployable Rapid Assembly Shelter",
        "common_name": "DRASH 2S Shelter",
        "category": "Shelter",
        "subcategory": "Deployable Shelter",
        "manufacturer": "HDT Global",
        "weight_lbs": 313,
        "crew_size": 4,
        "echelon_typical": "CO",
    },
    {
        "tamcn": "H4020",
        "nsn": "8340-01-475-2973",
        "nomenclature": "DRASH 3XB, Deployable Rapid Assembly Shelter",
        "common_name": "DRASH 3XB Shelter",
        "category": "Shelter",
        "subcategory": "Deployable Shelter",
        "manufacturer": "HDT Global",
        "weight_lbs": 450,
        "crew_size": 6,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "H4030",
        "nsn": "8340-01-475-3075",
        "nomenclature": "DRASH 6XB, Deployable Rapid Assembly Shelter (Large)",
        "common_name": "DRASH 6XB Shelter",
        "category": "Shelter",
        "subcategory": "Deployable Shelter",
        "manufacturer": "HDT Global",
        "weight_lbs": 600,
        "crew_size": 8,
        "echelon_typical": "BN",
        "notes": "COC/TOC configuration. Connectable to other DRASH units",
    },
    {
        "tamcn": "H4040",
        "nsn": "8340-01-432-5678",
        "nomenclature": "TEMPER, Tent Extendable Modular Personnel (20x32 ft)",
        "common_name": "TEMPER Tent",
        "category": "Shelter",
        "subcategory": "GP Tent",
        "manufacturer": "Various",
        "weight_lbs": 1328,
        "crew_size": 6,
        "echelon_typical": "BN",
        "notes": "20x32 ft configuration. Heated/cooled via ECU. Billeting or workspace",
    },
    {
        "tamcn": "H4050",
        "nsn": "8340-01-530-3456",
        "nomenclature": "Base-X 305, Rapidly Deployable Tent (25x33 ft)",
        "common_name": "Base-X 305 Tent",
        "category": "Shelter",
        "subcategory": "GP Tent",
        "manufacturer": "HDT Global",
        "weight_lbs": 700,
        "crew_size": 4,
        "echelon_typical": "BN",
        "notes": "Expanding frame. 4-person setup in <20 min",
    },
]
```

### Water Purification & Fuel Handling

```python
WATER_FUEL_SYSTEMS = [
    {
        "tamcn": "H5000",
        "nsn": "4610-01-488-6961",
        "nomenclature": "TWPS, Tactical Water Purification System (1500 GPH)",
        "common_name": "TWPS 1500",
        "category": "Water Purification",
        "subcategory": "Mobile Purification",
        "manufacturer": "Various",
        "weight_lbs": 3500,
        "crew_size": 2,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "H5010",
        "nsn": "4610-01-530-3255",
        "nomenclature": "ROWPU, Reverse Osmosis Water Purification Unit (1500 GPH)",
        "common_name": "ROWPU 1500",
        "category": "Water Purification",
        "subcategory": "Mobile Purification",
        "manufacturer": "Various",
        "weight_lbs": 8400,
        "crew_size": 3,
        "echelon_typical": "BN",
    },
    {
        "tamcn": "H5020",
        "nsn": "4610-01-495-0046",
        "nomenclature": "LWP, Lightweight Water Purifier (75-200 GPH)",
        "common_name": "Lightweight Water Purifier",
        "category": "Water Purification",
        "subcategory": "Portable Purification",
        "manufacturer": "Various",
        "weight_lbs": 500,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "HMMWV transportable. Company-level water production",
    },
    {
        "tamcn": "H5030",
        "nsn": "4510-01-234-5678",
        "nomenclature": "Hippo Tank M105, Water Storage (2000 Gallon)",
        "common_name": "Water Buffalo / Hippo",
        "category": "Water Purification",
        "subcategory": "Water Storage",
        "manufacturer": "Various",
        "weight_lbs": 16800,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "Towed trailer. 2000-gallon capacity. Full weight: 16,800 lbs",
    },
    {
        "tamcn": "H5100",
        "nsn": "8110-00-965-2313",
        "nomenclature": "Fuel Bladder, Collapsible, 500 Gallon",
        "common_name": "500-Gal Fuel Blivet",
        "category": "Fuel Handling",
        "subcategory": "Fuel Storage",
        "manufacturer": "Various",
        "weight_lbs": 75,
        "crew_size": 2,
        "echelon_typical": "BN",
        "is_serialized": False,
        "notes": "Collapsible fabric. External sling-loadable by helicopter",
    },
    {
        "tamcn": "H5110",
        "nsn": "4930-01-456-7890",
        "nomenclature": "TFDS, Tactical Fuel Distribution System",
        "common_name": "Tactical Fuel Distribution System",
        "category": "Fuel Handling",
        "subcategory": "Fuel Distribution",
        "manufacturer": "Various",
        "weight_lbs": 5000,
        "crew_size": 3,
        "echelon_typical": "BN",
        "notes": "Hose reel, pumps, filtration. Bulk fuel distribution point setup",
    },
    {
        "tamcn": "H5120",
        "nsn": "4930-01-234-5679",
        "nomenclature": "AMCS, Amphibious Assault Fuel System",
        "common_name": "AMCS Ship-to-Shore Fuel",
        "category": "Fuel Handling",
        "subcategory": "Fuel Distribution",
        "manufacturer": "Various",
        "weight_lbs": 12000,
        "crew_size": 6,
        "echelon_typical": "GRP",
        "notes": "Ship-to-shore fuel pipeline. Connects amphib ships to beach fuel points",
    },
]
```

### Engineer / EOD Equipment

```python
ENGINEER_EQUIPMENT = [
    {
        "tamcn": "H6000",
        "nsn": "5180-01-587-8019",
        "nomenclature": "Kit, Pioneer Platoon Tool (FECTK)",
        "common_name": "Pioneer Tool Kit",
        "category": "Engineer",
        "subcategory": "Hand Tools",
        "manufacturer": "Kipper Tool Company",
        "weight_lbs": 200,
        "crew_size": 4,
        "echelon_typical": "CO",
        "notes": "Axes, shovels, picks, saws, pry bars, sledgehammers",
    },
    {
        "tamcn": "H6010",
        "nsn": "6665-01-504-7769",
        "nomenclature": "AN/PSS-14 HSTAMIDS, Handheld Mine Detector",
        "common_name": "Mine Detector (PSS-14)",
        "category": "Engineer",
        "subcategory": "Detection Equipment",
        "manufacturer": "L-3 CyTerra",
        "weight_lbs": 10,
        "crew_size": 1,
        "echelon_typical": "CO",
        "notes": "Ground-penetrating radar + metal detector fusion. Detects metallic and non-metallic mines",
    },
    {
        "tamcn": "H6020",
        "nsn": "1375-01-543-2191",
        "nomenclature": "M58 MICLIC, Mine Clearing Line Charge",
        "common_name": "MICLIC",
        "category": "Engineer",
        "subcategory": "Mine Clearing",
        "manufacturer": "Various",
        "weight_lbs": 3500,
        "crew_size": 4,
        "echelon_typical": "BN",
        "notes": "Rocket-launched C4 line charge. Clears lane 100m x 16m through minefield",
    },
    {
        "tamcn": "H6030",
        "nsn": "1385-01-567-8901",
        "nomenclature": "PackBot 510, EOD Robot",
        "common_name": "PackBot",
        "category": "Engineer",
        "subcategory": "EOD Robotics",
        "manufacturer": "Endeavor Robotics (formerly iRobot)",
        "weight_lbs": 60,
        "crew_size": 1,
        "echelon_typical": "BN",
        "notes": "Remote-controlled EOD robot. Camera, manipulator arm. 39 lbs base weight",
    },
    {
        "tamcn": "H6040",
        "nsn": "1385-01-567-8902",
        "nomenclature": "TALON, EOD Robot",
        "common_name": "TALON Robot",
        "category": "Engineer",
        "subcategory": "EOD Robotics",
        "manufacturer": "QinetiQ",
        "weight_lbs": 115,
        "crew_size": 1,
        "echelon_typical": "BN",
        "notes": "Tracked robot for IED/UXO disposal. Multiple tool attachments",
    },
]
```

### Kitchen / Field Services

```python
FIELD_SERVICES = [
    {
        "tamcn": "H7000",
        "nsn": "7360-01-469-5482",
        "nomenclature": "MKT-I, Mobile Kitchen Trailer (Improved)",
        "common_name": "Mobile Kitchen Trailer",
        "category": "Field Services",
        "subcategory": "Food Service",
        "manufacturer": "Various",
        "weight_lbs": 5760,
        "crew_size": 4,
        "echelon_typical": "BN",
        "notes": "Feeds 200-250 Marines per meal. Towed by MTVR",
    },
    {
        "tamcn": "H7010",
        "nsn": "7310-01-234-5678",
        "nomenclature": "Burner Unit, Multi-Fuel, Field Range",
        "common_name": "Field Range Burner",
        "category": "Field Services",
        "subcategory": "Food Service",
        "manufacturer": "Various",
        "weight_lbs": 45,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
        "notes": "JP-8/diesel multi-fuel burner. Used with insulated food containers",
    },
    {
        "tamcn": "H7020",
        "nsn": "7360-01-345-6789",
        "nomenclature": "Container, Insulated, Food (Mermite Can)",
        "common_name": "Mermite Can",
        "category": "Field Services",
        "subcategory": "Food Service",
        "manufacturer": "Various",
        "weight_lbs": 40,
        "crew_size": 1,
        "echelon_typical": "CO",
        "is_serialized": False,
        "notes": "Insulated food transport. Keeps food hot 4+ hrs. Feeds ~20 Marines",
    },
    {
        "tamcn": "H7100",
        "nsn": "4510-01-456-7891",
        "nomenclature": "Shower Unit, Field, Containerized",
        "common_name": "Field Shower Unit",
        "category": "Field Services",
        "subcategory": "Hygiene",
        "manufacturer": "Various",
        "weight_lbs": 4000,
        "crew_size": 2,
        "echelon_typical": "BN",
        "notes": "Containerized. 6 shower heads. Water heater. Serves ~200 Marines/day",
    },
    {
        "tamcn": "H7110",
        "nsn": "3510-01-234-5680",
        "nomenclature": "Laundry Unit, Field, Containerized (LADS)",
        "common_name": "Field Laundry Unit",
        "category": "Field Services",
        "subcategory": "Hygiene",
        "manufacturer": "Various",
        "weight_lbs": 6000,
        "crew_size": 3,
        "echelon_typical": "BN",
        "notes": "Laundry and Dry Cleaning System. Processes ~500 lbs/day",
    },
]
```

---

## New Supply Seed Data

Add the following to `backend/seed/seed_supply_catalog.py`. Append to existing class arrays.

### Class II — Expanded Clothing & Individual Equipment

```python
CLASS_II_EXPANSION = [
    # ── Sleeping Systems ────────────────────────────────────────────
    {"nsn": "8465-01-574-3998", "nomenclature": "SLEEPING BAG, 3-SEASON, USMC SLEEP SYSTEM",
     "common_name": "3-Season Sleep System", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Sleeping System", "subcategory": "Sleeping Bag"},
    {"nsn": "8465-01-574-4005", "nomenclature": "BIVY COVER, IMPROVED, GORE-TEX",
     "common_name": "Bivy Cover", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Sleeping System", "subcategory": "Bivy"},
    {"nsn": "8405-01-607-1111", "nomenclature": "LINER, PONCHO, QUILTED",
     "common_name": "Poncho Liner (Woobie)", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Sleeping System", "subcategory": "Liner"},
    {"nsn": "8465-01-574-4003", "nomenclature": "SACK, COMPRESSION, WATERPROOF",
     "common_name": "Compression Stuff Sack", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Sleeping System", "subcategory": "Storage"},

    # ── MOLLE / Load Carriage ───────────────────────────────────────
    {"nsn": "8465-01-633-4305", "nomenclature": "POUCH, IFAK, MOLLE COMPATIBLE",
     "common_name": "MOLLE IFAK Pouch", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Load Carriage", "subcategory": "MOLLE Pouch"},
    {"nsn": "8465-01-524-7226", "nomenclature": "POUCH, MAGAZINE, DOUBLE, 5.56MM, MOLLE",
     "common_name": "Double Mag Pouch (5.56)", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Load Carriage", "subcategory": "MOLLE Pouch"},
    {"nsn": "8465-01-524-7227", "nomenclature": "POUCH, UTILITY, GENERAL PURPOSE, MOLLE",
     "common_name": "GP Utility Pouch", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Load Carriage", "subcategory": "MOLLE Pouch"},
    {"nsn": "8465-01-524-7228", "nomenclature": "POUCH, DUMP, ROLL-UP, MOLLE",
     "common_name": "Dump Pouch", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Load Carriage", "subcategory": "MOLLE Pouch"},
    {"nsn": "8415-01-296-8878", "nomenclature": "VEST, LOAD-BEARING, ENHANCED TACTICAL (ETLBV)",
     "common_name": "Tactical Load Bearing Vest", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Load Carriage", "subcategory": "Vest"},

    # ── Gloves ──────────────────────────────────────────────────────
    {"nsn": "8415-01-551-3760", "nomenclature": "GLOVES, TACTICAL, M-PACT 2, COVERT",
     "common_name": "Mechanix M-Pact Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Combat Gloves"},
    {"nsn": "8415-01-497-5989", "nomenclature": "GLOVES, HEAT-RESISTANT, MECHANIC",
     "common_name": "Heat-Resistant Work Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Work Gloves"},
    {"nsn": "8415-01-538-6742", "nomenclature": "GLOVES, COLD WEATHER, INSULATED, GORE-TEX",
     "common_name": "Cold Weather Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Cold Weather Gloves"},

    # ── Eye Protection ──────────────────────────────────────────────
    {"nsn": "4240-01-525-3095", "nomenclature": "EYEWEAR, BALLISTIC, OAKLEY SI M-FRAME 2.0",
     "common_name": "Oakley SI Ballistic Glasses", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Glasses"},
    {"nsn": "4240-01-630-6343", "nomenclature": "EYEWEAR, BALLISTIC, ESS INFLUX",
     "common_name": "ESS Ballistic Goggles", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Goggles"},
    {"nsn": "4240-01-630-7259", "nomenclature": "EYEWEAR, BALLISTIC, ESS PROFILE NVG",
     "common_name": "ESS Profile NVG-Compatible Goggles", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Goggles"},

    # ── Hearing Protection ──────────────────────────────────────────
    {"nsn": "4240-01-598-4573", "nomenclature": "SYSTEM, TCAPS, TACTICAL COMMUNICATIONS & PROTECTIVE",
     "common_name": "TCAPS Hearing System", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Hearing Protection", "subcategory": "Active Hearing"},
    {"nsn": "4240-01-365-4321", "nomenclature": "EARPLUG, COMBAT, DUAL-ENDED (3M)",
     "common_name": "Combat Earplugs", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hearing Protection", "subcategory": "Passive Hearing"},

    # ── Knee / Elbow Pads ───────────────────────────────────────────
    {"nsn": "8465-01-599-7051", "nomenclature": "PAD SET, KNEE AND ELBOW, COMBAT",
     "common_name": "Knee/Elbow Pad Set", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Body Protection", "subcategory": "Pads"},

    # ── Cold Weather (ECWCS) ────────────────────────────────────────
    {"nsn": "8415-01-598-4574", "nomenclature": "UNDERSHIRT, POLYPROPYLENE, ECWCS LEVEL 1",
     "common_name": "Polypro Undershirt", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Cold Weather", "subcategory": "Base Layer"},
    {"nsn": "8415-01-598-4575", "nomenclature": "DRAWERS, POLYPROPYLENE, ECWCS LEVEL 1",
     "common_name": "Polypro Drawers", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Cold Weather", "subcategory": "Base Layer"},
    {"nsn": "8415-01-598-4576", "nomenclature": "JACKET, FLEECE, ECWCS LEVEL 3",
     "common_name": "Fleece Jacket", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Cold Weather", "subcategory": "Mid Layer"},
    {"nsn": "8415-01-598-4577", "nomenclature": "PARKA, GORE-TEX, ECWCS LEVEL 6",
     "common_name": "Gore-Tex Parka", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Cold Weather", "subcategory": "Outer Shell"},
    {"nsn": "8415-01-598-4578", "nomenclature": "TROUSERS, GORE-TEX, ECWCS LEVEL 6",
     "common_name": "Gore-Tex Trousers", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Cold Weather", "subcategory": "Outer Shell"},

    # ── Ponchos / Tarps ─────────────────────────────────────────────
    {"nsn": "8405-01-100-0976", "nomenclature": "PONCHO, WET WEATHER, RIPSTOP NYLON",
     "common_name": "Military Poncho", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Field Shelter", "subcategory": "Poncho"},
]
```

### Class IV — Expanded Construction

```python
CLASS_IV_EXPANSION = [
    {"nsn": "5510-01-234-5686", "nomenclature": "PLYWOOD, CONSTRUCTION, 3/4 IN, 4x8 FT",
     "common_name": "Plywood Sheet", "supply_class": "IV", "unit_of_issue": "SH", "unit_of_issue_desc": "Sheet",
     "category": "Construction", "subcategory": "Lumber & Plywood"},
    {"nsn": "9515-01-234-5687", "nomenclature": "BAR, REINFORCING, STEEL (REBAR), #4, 20 FT",
     "common_name": "Rebar #4", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Construction", "subcategory": "Steel Reinforcement"},
    {"nsn": "5610-01-234-5688", "nomenclature": "CEMENT, PORTLAND, TYPE I/II, 94 LB BAG",
     "common_name": "Portland Cement", "supply_class": "IV", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Construction", "subcategory": "Concrete", "shelf_life_days": 365},
    {"nsn": "5610-01-234-5689", "nomenclature": "CONCRETE MIX, DRY, 80 LB BAG",
     "common_name": "Ready-Mix Concrete", "supply_class": "IV", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Construction", "subcategory": "Concrete", "shelf_life_days": 180},
    {"nsn": "1080-01-266-1824", "nomenclature": "NET, CAMOUFLAGE, LIGHTWEIGHT, SCREENING SYSTEM (LCSS)",
     "common_name": "Camo Netting (LCSS)", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Camouflage"},
    {"nsn": "5660-01-234-5690", "nomenclature": "STAKE, ENGINEER, STEEL, 18 IN",
     "common_name": "Engineer Stakes", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Wire/Stakes"},
    {"nsn": "5640-01-234-5691", "nomenclature": "PIPE, CULVERT, CORRUGATED STEEL, 18 IN DIA, 20 FT",
     "common_name": "Culvert Pipe", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Construction", "subcategory": "Drainage"},
    {"nsn": "5680-01-234-5692", "nomenclature": "HESCO BARRIER, MIL-7 (7x7x100 ft)",
     "common_name": "HESCO MIL-7 (Large)", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5680-01-234-5693", "nomenclature": "HESCO BARRIER, MIL-10 (10x10x100 ft)",
     "common_name": "HESCO MIL-10 (XL)", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Barrier"},
]
```

### Class V — Pyrotechnics & Signals (Ammunition Catalog)

```python
CLASS_V_PYRO_EXPANSION = [
    # Add to ammunition_catalog seed
    {"dodic": "G850", "nsn": "1370-01-234-5694", "nomenclature": "SIGNAL, ILLUM, GROUND, WHITE STAR PARACHUTE, M127A1",
     "common_name": "Parachute Illumination Flare", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 1.5, "is_controlled": True, "hazard_class": "1.3"},
    {"dodic": "G815", "nsn": "1370-01-234-5695", "nomenclature": "CART, 40MM, STAR CLUSTER, WHITE, M585",
     "common_name": "White Star Cluster", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G816", "nsn": "1370-01-234-5696", "nomenclature": "CART, 40MM, STAR CLUSTER, GREEN, M661",
     "common_name": "Green Star Cluster", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G817", "nsn": "1370-01-234-5697", "nomenclature": "CART, 40MM, STAR CLUSTER, RED, M662",
     "common_name": "Red Star Cluster", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G945", "nsn": "1370-01-234-5698", "nomenclature": "FLARE, TRIP, GROUND, M49A1",
     "common_name": "Trip Flare", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 0.75, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G955", "nsn": "1370-01-234-5699", "nomenclature": "POT, SMOKE, HC, M4A2",
     "common_name": "HC Smoke Pot", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 28.0, "is_controlled": True, "hazard_class": "1.3"},
    {"dodic": "G900", "nsn": "1370-01-234-5700", "nomenclature": "CHEMLIGHT, IR, 12-HOUR",
     "common_name": "IR Chemstick", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 0.1, "is_controlled": False},
    {"dodic": "G901", "nsn": "1370-01-234-5701", "nomenclature": "CHEMLIGHT, VISIBLE, GREEN, 12-HOUR",
     "common_name": "Green Chemstick", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 0.1, "is_controlled": False},
    {"dodic": "B544", "nsn": "1310-01-456-7892", "nomenclature": "CART, 40MM, ILLUM, M583, WHITE STAR",
     "common_name": "40mm Illumination (White Star)", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B560", "nsn": "1310-01-456-7893", "nomenclature": "CART, 40MM, SMOKE, RED, M713",
     "common_name": "40mm Red Smoke", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B561", "nsn": "1310-01-456-7894", "nomenclature": "CART, 40MM, SMOKE, GREEN, M715",
     "common_name": "40mm Green Smoke", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B562", "nsn": "1310-01-456-7895", "nomenclature": "CART, 40MM, SMOKE, YELLOW, M716",
     "common_name": "40mm Yellow Smoke", "caliber": "40x46mm",
     "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "A080", "nsn": "1305-01-234-5702", "nomenclature": "CART, 5.56MM, MK 262 MOD 1, MATCH (OTM)",
     "common_name": "5.56mm Mk 262 Match (MARSOC/SDM)", "caliber": "5.56x45mm",
     "weapon_system": "M27 IAR, M4, M110A1",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.026},
    {"dodic": "A115", "nsn": "1305-01-234-5703", "nomenclature": "CART, 7.62MM, MK 316 MOD 0, MATCH (SNIPER)",
     "common_name": "7.62mm Mk 316 Sniper Match", "caliber": "7.62x51mm",
     "weapon_system": "M110, M40A6",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.056},
    {"dodic": "A606", "nsn": "1305-01-234-5704", "nomenclature": "CART, .50 CAL, MK 211 MOD 0, RAUFOSS (API)",
     "common_name": ".50 Cal Raufoss (Armor-Piercing Incendiary)", "caliber": "12.7x99mm",
     "weapon_system": "M2A1, M107",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.265},
    {"dodic": "C988", "nsn": "1310-01-234-5705", "nomenclature": "CART, 84MM, HEDP 502, CARL GUSTAF",
     "common_name": "84mm HEDP (Carl Gustaf)", "caliber": "84mm",
     "weapon_system": "M3E1 MAAWS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 8.8, "is_controlled": True, "hazard_class": "1.1"},
    {"dodic": "C990", "nsn": "1310-01-234-5706", "nomenclature": "CART, 84MM, SMOKE 469C, CARL GUSTAF",
     "common_name": "84mm Smoke (Carl Gustaf)", "caliber": "84mm",
     "weapon_system": "M3E1 MAAWS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 7.7, "is_controlled": True, "hazard_class": "1.3"},
    {"dodic": "D545", "nsn": "1320-01-234-5707", "nomenclature": "PROJ, 155MM, EXCALIBUR, M982A1 (GPS-GUIDED)",
     "common_name": "155mm Excalibur GPS-Guided", "caliber": "155mm",
     "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 106.0, "is_controlled": True, "hazard_class": "1.1"},
    {"dodic": "D866", "nsn": "1340-01-234-5708", "nomenclature": "ROCKET, 227MM, GMLRS-ER, M403 (EXTENDED RANGE)",
     "common_name": "GMLRS-ER Extended Range", "caliber": "227mm",
     "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 700.0, "is_controlled": True, "hazard_class": "1.1"},
    {"dodic": "D867", "nsn": "1410-01-234-5709", "nomenclature": "MISSILE, PrSM, PRECISION STRIKE MISSILE",
     "common_name": "PrSM (ATACMS Replacement)", "caliber": "N/A",
     "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 2500.0, "is_controlled": True, "hazard_class": "1.1",
     "notes": "2x per HIMARS pod. 499+ km range. ATACMS replacement"},
]
```

### Class VIII — Expanded Medical

```python
CLASS_VIII_EXPANSION = [
    # ── Antibiotics / Medications ───────────────────────────────────
    {"nsn": "6505-01-598-4580", "nomenclature": "TABLET, MOXIFLOXACIN, 400MG (COMBAT PILL PACK)",
     "common_name": "Moxifloxacin (Combat Antibiotic)", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics", "shelf_life_days": 1825},
    {"nsn": "6505-01-598-4581", "nomenclature": "TABLET, CIPROFLOXACIN, 750MG",
     "common_name": "Ciprofloxacin", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics", "shelf_life_days": 1825},
    {"nsn": "6505-01-598-4582", "nomenclature": "INJECTION, ERTAPENEM, 1G, IV/IM",
     "common_name": "Ertapenem Injectable", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics (Injectable)", "shelf_life_days": 1095},

    # ── Emergency Medications ───────────────────────────────────────
    {"nsn": "6505-01-598-4583", "nomenclature": "AUTO-INJECTOR, NALOXONE, 2MG (NARCAN)",
     "common_name": "Naloxone Auto-Injector", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Emergency Meds", "is_controlled": True, "shelf_life_days": 730},
    {"nsn": "6505-01-598-4584", "nomenclature": "AUTO-INJECTOR, EPINEPHRINE, 0.3MG",
     "common_name": "EpiPen", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Emergency Meds", "shelf_life_days": 730},

    # ── Splints / Immobilization ────────────────────────────────────
    {"nsn": "6515-01-494-1951", "nomenclature": "SPLINT, UNIVERSAL, MALLEABLE (SAM), 36 IN",
     "common_name": "SAM Splint", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Splints"},
    {"nsn": "6515-01-598-4585", "nomenclature": "SPLINT, TRACTION, FEMUR (SAGER/CT-6)",
     "common_name": "Traction Splint", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Splints"},

    # ── Burns / Specialty Dressings ─────────────────────────────────
    {"nsn": "6510-01-598-4586", "nomenclature": "DRESSING, BURN, BURNTEC, HYDROGEL, 5x10",
     "common_name": "Burn Dressing", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Burn Care", "shelf_life_days": 1825},
    {"nsn": "6515-01-598-4587", "nomenclature": "SHIELD, EYE, COMBAT, FOX (RIGID)",
     "common_name": "Combat Eye Shield", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Eye Care"},

    # ── Monitoring / Diagnostics ────────────────────────────────────
    {"nsn": "6515-01-557-1136", "nomenclature": "OXIMETER, PULSE, NONIN ONYX II 9550",
     "common_name": "Pulse Oximeter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Diagnostic", "subcategory": "Monitoring"},
    {"nsn": "6505-01-598-4588", "nomenclature": "KIT, BLOOD TYPING, FIELD",
     "common_name": "Field Blood Typing Kit", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Diagnostic", "subcategory": "Blood Products"},

    # ── Hypothermia Prevention ──────────────────────────────────────
    {"nsn": "6515-01-598-4589", "nomenclature": "BLANKET, HYPOTHERMIA PREVENTION, READY-HEAT",
     "common_name": "Ready-Heat Blanket", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Hypothermia Prevention"},
    {"nsn": "6515-01-598-4590", "nomenclature": "KIT, HYPOTHERMIA PREVENTION AND MANAGEMENT (HPMK)",
     "common_name": "HPMK Kit", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Trauma", "subcategory": "Hypothermia Prevention"},
]
```

### Class IX — Expanded Repair Parts

```python
CLASS_IX_EXPANSION = [
    # ── Brake Systems ───────────────────────────────────────────────
    {"nsn": "2530-01-420-8025", "nomenclature": "PAD KIT, BRAKE, HMMWV, FRONT/REAR",
     "common_name": "HMMWV Brake Pads", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},
    {"nsn": "2530-01-700-1001", "nomenclature": "PAD KIT, BRAKE, JLTV, FRONT",
     "common_name": "JLTV Brake Pads (Front)", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},
    {"nsn": "2530-01-700-1002", "nomenclature": "SHOE KIT, BRAKE, MTVR, REAR",
     "common_name": "MTVR Brake Shoes", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},

    # ── Drivetrain ──────────────────────────────────────────────────
    {"nsn": "2520-01-234-5710", "nomenclature": "JOINT, UNIVERSAL, CV, HMMWV HALF-SHAFT",
     "common_name": "HMMWV CV Joint", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Drivetrain"},
    {"nsn": "2520-01-234-5711", "nomenclature": "SHAFT, DRIVE, FRONT, JLTV",
     "common_name": "JLTV Drive Shaft", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Drivetrain"},

    # ── Cooling / Engine ────────────────────────────────────────────
    {"nsn": "2930-01-234-5712", "nomenclature": "RADIATOR, ENGINE COOLING, HMMWV",
     "common_name": "HMMWV Radiator", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},
    {"nsn": "2930-01-234-5713", "nomenclature": "PUMP, WATER, ENGINE COOLING, HMMWV",
     "common_name": "HMMWV Water Pump", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},
    {"nsn": "2930-01-234-5714", "nomenclature": "RADIATOR, ENGINE COOLING, MTVR",
     "common_name": "MTVR Radiator", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},

    # ── Hydraulic ───────────────────────────────────────────────────
    {"nsn": "4730-01-234-5715", "nomenclature": "HOSE ASSY, HYDRAULIC, HIGH PRESSURE, 3/8 IN",
     "common_name": "Hydraulic Hose Assembly", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Hydraulic"},

    # ── Electrical / Wiring ─────────────────────────────────────────
    {"nsn": "6150-01-234-5716", "nomenclature": "HARNESS, WIRING, VEHICLE, MAIN, HMMWV",
     "common_name": "HMMWV Main Wiring Harness", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Electrical"},
    {"nsn": "5340-01-234-5717", "nomenclature": "GLASS, WINDSHIELD, LAMINATED, HMMWV",
     "common_name": "HMMWV Windshield", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Body/Glass"},
    {"nsn": "5340-01-700-1003", "nomenclature": "GLASS, WINDSHIELD, BALLISTIC, JLTV",
     "common_name": "JLTV Ballistic Windshield", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Body/Glass"},
]
```

### Class X — Weapons Maintenance & Field Admin

```python
CLASS_X_ITEMS = [
    # ── Weapons Maintenance ─────────────────────────────────────────
    {"nsn": "1005-01-561-6181", "nomenclature": "KIT, CLEANING, SOFT PACK, 5.56MM/9MM (OTIS)",
     "common_name": "Otis Cleaning Kit", "supply_class": "X", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Maintenance", "subcategory": "Weapon Cleaning"},
    {"nsn": "9150-01-102-1473", "nomenclature": "LUBRICANT, CLP (CLEANER/LUBRICANT/PROTECTANT), 4 OZ",
     "common_name": "CLP (Break-Free)", "supply_class": "X", "unit_of_issue": "BT", "unit_of_issue_desc": "Bottle",
     "category": "Maintenance", "subcategory": "Weapon Cleaning"},
    {"nsn": "1005-01-234-5718", "nomenclature": "BRUSH, BORE, BRONZE, 5.56MM, 12-PACK",
     "common_name": "Bore Brush (5.56)", "supply_class": "X", "unit_of_issue": "PG", "unit_of_issue_desc": "Package",
     "category": "Maintenance", "subcategory": "Weapon Cleaning"},
    {"nsn": "1005-01-234-5719", "nomenclature": "PATCH, CLEANING, COTTON, 5.56MM, 100-PACK",
     "common_name": "Cleaning Patches", "supply_class": "X", "unit_of_issue": "PG", "unit_of_issue_desc": "Package",
     "category": "Maintenance", "subcategory": "Weapon Cleaning"},

    # ── Field Admin / Office ────────────────────────────────────────
    {"nsn": "7520-01-507-6962", "nomenclature": "MARKER, MAP, NON-PERMANENT, 6-COLOR SET",
     "common_name": "Map Markers (6-color)", "supply_class": "X", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Office Supply", "subcategory": "Markers"},
    {"nsn": "7530-00-290-1234", "nomenclature": "PAPER, BOND, 20 LB, 8.5x11, 500-SHEET REAM",
     "common_name": "Copy Paper (Ream)", "supply_class": "X", "unit_of_issue": "RM", "unit_of_issue_desc": "Ream",
     "category": "Office Supply", "subcategory": "Paper"},
    {"nsn": "7520-01-234-5720", "nomenclature": "SHEET, LAMINATING, CLEAR, 3 MIL, 100-PACK",
     "common_name": "Laminate Sheets", "supply_class": "X", "unit_of_issue": "BX", "unit_of_issue_desc": "Box",
     "category": "Office Supply", "subcategory": "Lamination"},
    {"nsn": "7520-01-234-5721", "nomenclature": "PEN, BALLPOINT, BLACK, MILITARY FIELD, 12-PACK",
     "common_name": "Field Pens (12-pack)", "supply_class": "X", "unit_of_issue": "BX", "unit_of_issue_desc": "Box",
     "category": "Office Supply", "subcategory": "Writing"},

    # ── Signaling ───────────────────────────────────────────────────
    {"nsn": "6350-01-455-6695", "nomenclature": "MIRROR, SIGNAL, TYPE I, 2x3 IN",
     "common_name": "Signal Mirror (Small)", "supply_class": "X", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Signaling", "subcategory": "Visual Signal"},
    {"nsn": "6350-01-455-6671", "nomenclature": "MIRROR, SIGNAL, TYPE II, 3x5 IN",
     "common_name": "Signal Mirror (Large)", "supply_class": "X", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Signaling", "subcategory": "Visual Signal"},
    {"nsn": "6230-01-234-5722", "nomenclature": "FLASHLIGHT, TACTICAL, SUREFIRE G2X, 600 LUMENS",
     "common_name": "SureFire Tactical Flashlight", "supply_class": "X", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Lighting", "subcategory": "Tactical Light"},
    {"nsn": "6230-01-234-5723", "nomenclature": "HEADLAMP, TACTICAL, RED/WHITE/IR, PETZL",
     "common_name": "Tactical Headlamp", "supply_class": "X", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Lighting", "subcategory": "Headlamp"},
]
```

---

## Seed Process Integration

Update the seed runner to include all new arrays:

```python
# In seed_equipment_catalog.py — merge all new arrays
ALL_EQUIPMENT = (
    TACTICAL_VEHICLES + COMBAT_VEHICLES + ARTILLERY_SYSTEMS + INFANTRY_WEAPONS +
    COMMUNICATIONS_EQUIPMENT + OPTICS_NVG +
    # NEW categories from expansion:
    AVIATION_ROTARY + AVIATION_TILTROTOR + AVIATION_FIXED + AVIATION_UAS +
    WATERCRAFT + GENERATORS + CBRN_EQUIPMENT + EW_EQUIPMENT +
    SHELTERS + WATER_FUEL_SYSTEMS + ENGINEER_EQUIPMENT + FIELD_SERVICES
)

# In seed_supply_catalog.py — merge all new arrays
ALL_SUPPLY = (
    CLASS_I_ITEMS + CLASS_II_ITEMS + CLASS_III_ITEMS + CLASS_IV_ITEMS +
    CLASS_VIII_ITEMS + CLASS_IX_ITEMS +
    # NEW expansions:
    CLASS_II_EXPANSION + CLASS_IV_EXPANSION + CLASS_VIII_EXPANSION +
    CLASS_IX_EXPANSION + CLASS_X_ITEMS
)

# In seed_ammunition_catalog.py — merge pyro expansion
ALL_AMMO = CLASS_V_ITEMS + CLASS_V_PYRO_EXPANSION
```

Each seed function remains idempotent — check by TAMCN/NSN/DODIC before inserting.

---

## Summary of Expansion

| Category | New Items | Key Additions |
|----------|-----------|---------------|
| **Aviation — Rotary** | 4 | AH-1Z Viper, UH-1Y Venom, CH-53E Super Stallion, CH-53K King Stallion |
| **Aviation — Tilt-Rotor** | 1 | MV-22B Osprey |
| **Aviation — Fixed Wing** | 4 | F-35B, F/A-18C, F/A-18D, KC-130J |
| **Aviation — UAS** | 4 | RQ-21A Blackjack, RQ-20B Puma, MQ-9A Reaper, Switchblade 300 |
| **Watercraft** | 5 | LCAC, LCU-1700, SSC (LCAC 100), CRRC Zodiac, 11-Meter RHIB |
| **Power Generation** | 7 | MEP-831A (3kW), MEP-803A (10kW), MEP-804B (15kW), MEP-805B (30kW), MEP-806B (60kW), GREENS Solar, SPACES Solar |
| **CBRN** | 10 | M50 gas mask, JSLIST MOPP suit, M256 detection, M8/M9 paper, JCAD, ACADA, M295 decon, AN/PDR-77 |
| **Electronic Warfare** | 3 | CREW Duke, JCREW 3.3, Intrepid Tiger II |
| **Shelters** | 6 | MCCT, DRASH 2S/3XB/6XB, TEMPER, Base-X 305 |
| **Water/Fuel Systems** | 7 | TWPS, ROWPU, LWP, Hippo tank, fuel bladder, TFDS, AMCS |
| **Engineer/EOD** | 5 | Pioneer tools, PSS-14 mine detector, MICLIC, PackBot, TALON |
| **Field Services** | 5 | MKT, field range burner, Mermite can, field shower, field laundry |
| **Class II Expansion** | 25 | Sleep system, MOLLE pouches, gloves, eye/ear pro, knee/elbow pads, ECWCS cold weather, poncho |
| **Class IV Expansion** | 9 | Plywood, rebar, cement, concrete, camo netting, engineer stakes, culvert, HESCO MIL-7/MIL-10 |
| **Class V Expansion** | 19 | Pyro (star clusters, trip flare, smoke pot, chemlights), 40mm smoke/illum, match ammo (Mk262, Mk316), Raufoss, Carl Gustaf, Excalibur GPS, GMLRS-ER, PrSM |
| **Class VIII Expansion** | 14 | Antibiotics (Moxi, Cipro, Ertapenem), Naloxone, EpiPen, SAM splint, traction splint, burn dressing, eye shield, pulse ox, blood typing, hypothermia kits |
| **Class IX Expansion** | 11 | Brake pads (HMMWV/JLTV/MTVR), CV joints, drive shafts, radiators, water pumps, hydraulic hoses, wiring harness, windshields |
| **Class X (New)** | 12 | CLP, Otis cleaning kit, bore brushes, patches, map markers, paper, laminate, pens, signal mirrors, flashlight, headlamp |

**Total new items: ~150+ equipment + ~90+ supply/ammo = ~250+ new catalog entries**

Combined with the original ~150 items, KEYSTONE will have **~400+ pre-populated catalog items** covering virtually every piece of gear a Marine unit would track.

---

## Important Notes

- **TAMCNs for new categories** (F-series aviation, G-series watercraft, H-series support) use representative codes following the existing lettering convention. Verify against Marine Corps Catalog (MCCAT) for production.
- **Some NSNs are representative** — particularly for newer systems (CH-53K, F-35B, Switchblade, PrSM). Structure and format are correct.
- **Aviation items** are tracked at the squadron (SQDN) echelon, not company. This aligns with MAG/MAW organizational structure.
- **Class X is new** — the original catalog didn't include non-military programs. The model's `supply_class` column already supports this; just seed the data.
- **Pyrotechnics/signals** are added to the ammunition catalog (Class V) since they use DODICs and are tracked as controlled items.
- **PrSM and GMLRS-ER** are new-generation munitions replacing ATACMS. Include both for transition period tracking.
