# KEYSTONE — Full Equipment & Supply Catalog (Part 2 of 2): Supply + Ammunition

## Mission

This is **Part 2 of 2**. Part 1 created the database models, API endpoints, frontend selectors, and seeded all equipment. This part seeds ALL supply items (~170 items) and ALL ammunition (~50 items) into the catalog tables created in Part 1.

**The models, APIs, and frontend selectors already exist from Part 1.** Just create the seed files and add entries.

---

## Seed Data: Supply Catalog

Create `backend/seed/seed_supply_catalog.py` with ALL supply items below:

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

### Class II — Clothing & Individual Equipment

```python
CLASS_II_ITEMS = [
    # ── Body Armor ─────────────────────────────────────────────────
    {"nsn": "8415-01-598-9870", "nomenclature": "PLATE CARRIER, MODULAR SCALABLE VEST (MSV)",
     "common_name": "Plate Carrier", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "PPE", "subcategory": "Body Armor"},
    {"nsn": "8470-01-520-7373", "nomenclature": "SAPI PLATE, ENHANCED (ESAPI), MEDIUM",
     "common_name": "ESAPI Plate (Medium)", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "PPE", "subcategory": "Body Armor"},
    {"nsn": "8470-01-506-6369", "nomenclature": "HELMET, ENHANCED COMBAT (ECH), MEDIUM",
     "common_name": "Combat Helmet", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "PPE", "subcategory": "Helmet"},

    # ── Packs ──────────────────────────────────────────────────────
    {"nsn": "8465-01-598-4569", "nomenclature": "PACK, MAIN, FILBE (USMC)",
     "common_name": "FILBE Main Pack", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Individual Equipment", "subcategory": "Pack"},
    {"nsn": "8465-01-598-4570", "nomenclature": "PACK, ASSAULT, FILBE (USMC)",
     "common_name": "FILBE Assault Pack", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Individual Equipment", "subcategory": "Pack"},
    {"nsn": "8465-01-519-8563", "nomenclature": "HYDRATION CARRIER, CAMELBAK 100OZ",
     "common_name": "CamelBak", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Individual Equipment", "subcategory": "Hydration"},

    # ── Uniforms & Boots ───────────────────────────────────────────
    {"nsn": "8415-01-588-4321", "nomenclature": "UNIFORM, UTILITY, MCCUU, WOODLAND, SET",
     "common_name": "Woodland Cammies (Set)", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Clothing", "subcategory": "Uniform"},
    {"nsn": "8415-01-588-4322", "nomenclature": "UNIFORM, UTILITY, MCCUU, DESERT, SET",
     "common_name": "Desert Cammies (Set)", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Clothing", "subcategory": "Uniform"},
    {"nsn": "8430-01-598-4571", "nomenclature": "BOOTS, COMBAT, RAT, HOT WEATHER",
     "common_name": "Combat Boots (Hot)", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Clothing", "subcategory": "Footwear"},
    {"nsn": "8430-01-598-4572", "nomenclature": "BOOTS, COMBAT, RAT, TEMPERATE",
     "common_name": "Combat Boots (Temperate)", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Clothing", "subcategory": "Footwear"},

    # ── Sleeping Systems ───────────────────────────────────────────
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

    # ── MOLLE / Load Carriage ──────────────────────────────────────
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

    # ── Gloves ─────────────────────────────────────────────────────
    {"nsn": "8415-01-551-3760", "nomenclature": "GLOVES, TACTICAL, M-PACT 2, COVERT",
     "common_name": "Mechanix M-Pact Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Combat Gloves"},
    {"nsn": "8415-01-497-5989", "nomenclature": "GLOVES, HEAT-RESISTANT, MECHANIC",
     "common_name": "Heat-Resistant Work Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Work Gloves"},
    {"nsn": "8415-01-538-6742", "nomenclature": "GLOVES, COLD WEATHER, INSULATED, GORE-TEX",
     "common_name": "Cold Weather Gloves", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hand Protection", "subcategory": "Cold Weather Gloves"},

    # ── Eye Protection ─────────────────────────────────────────────
    {"nsn": "4240-01-525-3095", "nomenclature": "EYEWEAR, BALLISTIC, OAKLEY SI M-FRAME 2.0",
     "common_name": "Oakley SI Ballistic Glasses", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Glasses"},
    {"nsn": "4240-01-630-6343", "nomenclature": "EYEWEAR, BALLISTIC, ESS INFLUX",
     "common_name": "ESS Ballistic Goggles", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Goggles"},
    {"nsn": "4240-01-630-7259", "nomenclature": "EYEWEAR, BALLISTIC, ESS PROFILE NVG",
     "common_name": "ESS Profile NVG-Compatible Goggles", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Eye Protection", "subcategory": "Ballistic Goggles"},

    # ── Hearing Protection ─────────────────────────────────────────
    {"nsn": "4240-01-598-4573", "nomenclature": "SYSTEM, TCAPS, TACTICAL COMMUNICATIONS & PROTECTIVE",
     "common_name": "TCAPS Hearing System", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Hearing Protection", "subcategory": "Active Hearing"},
    {"nsn": "4240-01-365-4321", "nomenclature": "EARPLUG, COMBAT, DUAL-ENDED (3M)",
     "common_name": "Combat Earplugs", "supply_class": "II", "unit_of_issue": "PR", "unit_of_issue_desc": "Pair",
     "category": "Hearing Protection", "subcategory": "Passive Hearing"},

    # ── Knee / Elbow Pads ──────────────────────────────────────────
    {"nsn": "8465-01-599-7051", "nomenclature": "PAD SET, KNEE AND ELBOW, COMBAT",
     "common_name": "Knee/Elbow Pad Set", "supply_class": "II", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Body Protection", "subcategory": "Pads"},

    # ── Cold Weather (ECWCS) ───────────────────────────────────────
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

    # ── Ponchos ────────────────────────────────────────────────────
    {"nsn": "8405-01-100-0976", "nomenclature": "PONCHO, WET WEATHER, RIPSTOP NYLON",
     "common_name": "Military Poncho", "supply_class": "II", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Field Shelter", "subcategory": "Poncho"},
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

### Class IV — Construction / Fortification

```python
CLASS_IV_ITEMS = [
    {"nsn": "5680-01-234-5682", "nomenclature": "HESCO BARRIER, MIL-1 (4x4x4 ft)",
     "common_name": "HESCO Barrier", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5680-01-234-5692", "nomenclature": "HESCO BARRIER, MIL-7 (7x7x100 ft)",
     "common_name": "HESCO MIL-7 (Large)", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5680-01-234-5693", "nomenclature": "HESCO BARRIER, MIL-10 (10x10x100 ft)",
     "common_name": "HESCO MIL-10 (XL)", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5660-00-262-1234", "nomenclature": "WIRE, CONCERTINA, TRIPLE STRAND",
     "common_name": "Concertina Wire", "supply_class": "IV", "unit_of_issue": "CL", "unit_of_issue_desc": "Coil",
     "category": "Fortification", "subcategory": "Wire"},
    {"nsn": "5680-01-345-6789", "nomenclature": "SANDBAG, POLYPROPYLENE",
     "common_name": "Sandbag", "supply_class": "IV", "unit_of_issue": "BL", "unit_of_issue_desc": "Bale",
     "category": "Fortification", "subcategory": "Barrier"},
    {"nsn": "5640-01-234-5683", "nomenclature": "LUMBER, DIMENSION, 2x4x8FT",
     "common_name": "2x4 Lumber", "supply_class": "IV", "unit_of_issue": "BD", "unit_of_issue_desc": "Board",
     "category": "Construction", "subcategory": "Lumber"},
    {"nsn": "5670-01-456-7891", "nomenclature": "PICKET, STEEL, T-POST, 6FT",
     "common_name": "T-Post", "supply_class": "IV", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Fortification", "subcategory": "Wire/Stakes"},
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
]
```

### Class VIII — Medical

```python
CLASS_VIII_ITEMS = [
    # ── Kits ───────────────────────────────────────────────────────
    {"nsn": "6515-01-532-8056", "nomenclature": "KIT, COMBAT LIFESAVER (CLS)",
     "common_name": "CLS Bag", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Medical", "subcategory": "Kit"},
    {"nsn": "6510-01-461-2345", "nomenclature": "IFAK, IMPROVED FIRST AID KIT",
     "common_name": "IFAK", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Medical", "subcategory": "Kit"},

    # ── Hemorrhage Control ─────────────────────────────────────────
    {"nsn": "6515-01-569-7324", "nomenclature": "BANDAGE, COMBAT GAUZE (QUIKCLOT)",
     "common_name": "Combat Gauze", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Hemorrhage Control"},
    {"nsn": "6515-01-587-9762", "nomenclature": "TOURNIQUET, COMBAT APPLICATION (CAT)",
     "common_name": "CAT Tourniquet", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Hemorrhage Control"},

    # ── Airway ─────────────────────────────────────────────────────
    {"nsn": "6515-01-521-7976", "nomenclature": "CHEST SEAL, HYFIN, VENTED",
     "common_name": "Chest Seal", "supply_class": "VIII", "unit_of_issue": "PG", "unit_of_issue_desc": "Package",
     "category": "Medical", "subcategory": "Airway"},
    {"nsn": "6505-01-530-3675", "nomenclature": "NEEDLE, DECOMPRESSION, 14GA",
     "common_name": "Decompression Needle", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Airway"},
    {"nsn": "6515-01-518-8367", "nomenclature": "NASOPHARYNGEAL AIRWAY (NPA), 28FR",
     "common_name": "NPA", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Airway"},

    # ── IV & Fluids ────────────────────────────────────────────────
    {"nsn": "6505-01-468-2543", "nomenclature": "IV SET, SALINE LOCK",
     "common_name": "Saline Lock IV", "supply_class": "VIII", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Medical", "subcategory": "IV"},
    {"nsn": "6505-00-139-3497", "nomenclature": "SOLUTION, SODIUM CHLORIDE, 0.9%, 1000ML",
     "common_name": "Normal Saline 1L", "supply_class": "VIII", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Medical", "subcategory": "IV Fluid"},
    {"nsn": "6505-01-234-5681", "nomenclature": "SOLUTION, LACTATED RINGERS, 1000ML",
     "common_name": "LR 1L", "supply_class": "VIII", "unit_of_issue": "BG", "unit_of_issue_desc": "Bag",
     "category": "Medical", "subcategory": "IV Fluid"},

    # ── Blood Products ─────────────────────────────────────────────
    {"nsn": "6505-01-098-7654", "nomenclature": "TRANEXAMIC ACID (TXA), 1G/10ML, INJ",
     "common_name": "TXA", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Medical", "subcategory": "Blood Product"},
    {"nsn": "6505-01-543-2190", "nomenclature": "WHOLE BLOOD, FREEZE-DRIED PLASMA (FDP)",
     "common_name": "Freeze-Dried Plasma", "supply_class": "VIII", "unit_of_issue": "UN", "unit_of_issue_desc": "Unit",
     "category": "Medical", "subcategory": "Blood Product"},
    {"nsn": "6505-01-598-4588", "nomenclature": "KIT, BLOOD TYPING, FIELD",
     "common_name": "Field Blood Typing Kit", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Diagnostic", "subcategory": "Blood Products"},

    # ── Evacuation ─────────────────────────────────────────────────
    {"nsn": "6515-01-598-1234", "nomenclature": "LITTER, POLELESS (SKED)",
     "common_name": "SKED Litter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Evacuation"},
    {"nsn": "6515-00-935-6602", "nomenclature": "LITTER, FOLDING (TALON II)",
     "common_name": "Collapsible Litter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Evacuation"},

    # ── Analgesics / Controlled ────────────────────────────────────
    {"nsn": "6505-01-367-8901", "nomenclature": "MORPHINE SULFATE, AUTO-INJECTOR, 10MG",
     "common_name": "Morphine Auto-Injector", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Medical", "subcategory": "Analgesic", "is_controlled": True},
    {"nsn": "6505-01-598-4568", "nomenclature": "KETAMINE HCL, 500MG/10ML, INJ",
     "common_name": "Ketamine", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Medical", "subcategory": "Analgesic", "is_controlled": True},

    # ── Antibiotics ────────────────────────────────────────────────
    {"nsn": "6505-01-598-4580", "nomenclature": "TABLET, MOXIFLOXACIN, 400MG (COMBAT PILL PACK)",
     "common_name": "Moxifloxacin (Combat Antibiotic)", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics", "shelf_life_days": 1825},
    {"nsn": "6505-01-598-4581", "nomenclature": "TABLET, CIPROFLOXACIN, 750MG",
     "common_name": "Ciprofloxacin", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics", "shelf_life_days": 1825},
    {"nsn": "6505-01-598-4582", "nomenclature": "INJECTION, ERTAPENEM, 1G, IV/IM",
     "common_name": "Ertapenem Injectable", "supply_class": "VIII", "unit_of_issue": "VL", "unit_of_issue_desc": "Vial",
     "category": "Pharmaceuticals", "subcategory": "Antibiotics (Injectable)", "shelf_life_days": 1095},

    # ── Emergency Meds ─────────────────────────────────────────────
    {"nsn": "6505-01-598-4583", "nomenclature": "AUTO-INJECTOR, NALOXONE, 2MG (NARCAN)",
     "common_name": "Naloxone Auto-Injector", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Emergency Meds", "is_controlled": True, "shelf_life_days": 730},
    {"nsn": "6505-01-598-4584", "nomenclature": "AUTO-INJECTOR, EPINEPHRINE, 0.3MG",
     "common_name": "EpiPen", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Pharmaceuticals", "subcategory": "Emergency Meds", "shelf_life_days": 730},

    # ── Splints / Immobilization ───────────────────────────────────
    {"nsn": "6515-01-494-1951", "nomenclature": "SPLINT, UNIVERSAL, MALLEABLE (SAM), 36 IN",
     "common_name": "SAM Splint", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Splints"},
    {"nsn": "6515-01-598-4585", "nomenclature": "SPLINT, TRACTION, FEMUR (SAGER/CT-6)",
     "common_name": "Traction Splint", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Splints"},

    # ── Burns / Eyes / Specialty ───────────────────────────────────
    {"nsn": "6510-01-598-4586", "nomenclature": "DRESSING, BURN, BURNTEC, HYDROGEL, 5x10",
     "common_name": "Burn Dressing", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Burn Care", "shelf_life_days": 1825},
    {"nsn": "6515-01-598-4587", "nomenclature": "SHIELD, EYE, COMBAT, FOX (RIGID)",
     "common_name": "Combat Eye Shield", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Eye Care"},

    # ── Monitoring ─────────────────────────────────────────────────
    {"nsn": "6515-01-557-1136", "nomenclature": "OXIMETER, PULSE, NONIN ONYX II 9550",
     "common_name": "Pulse Oximeter", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Diagnostic", "subcategory": "Monitoring"},

    # ── Hypothermia Prevention ─────────────────────────────────────
    {"nsn": "6515-01-598-4589", "nomenclature": "BLANKET, HYPOTHERMIA PREVENTION, READY-HEAT",
     "common_name": "Ready-Heat Blanket", "supply_class": "VIII", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Trauma", "subcategory": "Hypothermia Prevention"},
    {"nsn": "6515-01-598-4590", "nomenclature": "KIT, HYPOTHERMIA PREVENTION AND MANAGEMENT (HPMK)",
     "common_name": "HPMK Kit", "supply_class": "VIII", "unit_of_issue": "KT", "unit_of_issue_desc": "Kit",
     "category": "Trauma", "subcategory": "Hypothermia Prevention"},
]
```

### Class IX — Repair Parts

```python
CLASS_IX_ITEMS = [
    # ── Starters / Alternators ─────────────────────────────────────
    {"nsn": "2920-01-345-6790", "nomenclature": "STARTER, ENGINE, HMMWV",
     "common_name": "Humvee Starter", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Automotive"},
    {"nsn": "2920-01-432-5679", "nomenclature": "ALTERNATOR, HMMWV",
     "common_name": "Humvee Alternator", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Automotive"},

    # ── Tires ──────────────────────────────────────────────────────
    {"nsn": "2530-01-543-2191", "nomenclature": "TIRE, PNEUMATIC, MTVR, 16.00R20",
     "common_name": "MTVR Tire", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Tires"},
    {"nsn": "2530-01-678-9012", "nomenclature": "TIRE, PNEUMATIC, JLTV, 37X12.50R16.5",
     "common_name": "JLTV Tire", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Tires"},

    # ── Filters ────────────────────────────────────────────────────
    {"nsn": "2910-01-345-6791", "nomenclature": "FILTER, OIL, ENGINE, HMMWV/JLTV",
     "common_name": "Oil Filter", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Filters"},
    {"nsn": "2910-01-345-6792", "nomenclature": "FILTER, FUEL, MTVR",
     "common_name": "Fuel Filter (MTVR)", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Filters"},
    {"nsn": "2940-01-234-5684", "nomenclature": "FILTER, AIR, ENGINE, JLTV",
     "common_name": "Air Filter (JLTV)", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Filters"},

    # ── Batteries ──────────────────────────────────────────────────
    {"nsn": "6135-01-456-7892", "nomenclature": "BATTERY, STORAGE, 12V, 6TN",
     "common_name": "Vehicle Battery 6TN", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Electrical"},
    {"nsn": "6135-01-490-4316", "nomenclature": "BATTERY, LITHIUM, BA-5590/U",
     "common_name": "Radio Battery BA-5590", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Batteries"},
    {"nsn": "6135-01-524-7382", "nomenclature": "BATTERY, LITHIUM, CONFORMAL, BB-2590/U",
     "common_name": "Conformal Battery BB-2590", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Batteries"},

    # ── Track ──────────────────────────────────────────────────────
    {"nsn": "5340-01-234-5685", "nomenclature": "TRACKPAD, ACV/AAV",
     "common_name": "ACV Track Pad", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Track"},

    # ── Brakes ─────────────────────────────────────────────────────
    {"nsn": "2530-01-420-8025", "nomenclature": "PAD KIT, BRAKE, HMMWV, FRONT/REAR",
     "common_name": "HMMWV Brake Pads", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},
    {"nsn": "2530-01-700-1001", "nomenclature": "PAD KIT, BRAKE, JLTV, FRONT",
     "common_name": "JLTV Brake Pads (Front)", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},
    {"nsn": "2530-01-700-1002", "nomenclature": "SHOE KIT, BRAKE, MTVR, REAR",
     "common_name": "MTVR Brake Shoes", "supply_class": "IX", "unit_of_issue": "SE", "unit_of_issue_desc": "Set",
     "category": "Repair Parts", "subcategory": "Brakes"},

    # ── Drivetrain ─────────────────────────────────────────────────
    {"nsn": "2520-01-234-5710", "nomenclature": "JOINT, UNIVERSAL, CV, HMMWV HALF-SHAFT",
     "common_name": "HMMWV CV Joint", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Drivetrain"},
    {"nsn": "2520-01-234-5711", "nomenclature": "SHAFT, DRIVE, FRONT, JLTV",
     "common_name": "JLTV Drive Shaft", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Drivetrain"},

    # ── Cooling / Engine ───────────────────────────────────────────
    {"nsn": "2930-01-234-5712", "nomenclature": "RADIATOR, ENGINE COOLING, HMMWV",
     "common_name": "HMMWV Radiator", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},
    {"nsn": "2930-01-234-5713", "nomenclature": "PUMP, WATER, ENGINE COOLING, HMMWV",
     "common_name": "HMMWV Water Pump", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},
    {"nsn": "2930-01-234-5714", "nomenclature": "RADIATOR, ENGINE COOLING, MTVR",
     "common_name": "MTVR Radiator", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Cooling"},

    # ── Hydraulic / Electrical / Glass ─────────────────────────────
    {"nsn": "4730-01-234-5715", "nomenclature": "HOSE ASSY, HYDRAULIC, HIGH PRESSURE, 3/8 IN",
     "common_name": "Hydraulic Hose Assembly", "supply_class": "IX", "unit_of_issue": "EA", "unit_of_issue_desc": "Each",
     "category": "Repair Parts", "subcategory": "Hydraulic"},
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
    # ── Weapons Maintenance ────────────────────────────────────────
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

    # ── Field Admin ────────────────────────────────────────────────
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

    # ── Signaling / Lighting ───────────────────────────────────────
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

## Seed Data: Ammunition Catalog

Create `backend/seed/seed_ammunition_catalog.py` with ALL ammunition items:

```python
ALL_AMMUNITION = [
    # ── Small Arms ─────────────────────────────────────────────────
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
    {"dodic": "A080", "nsn": "1305-01-234-5702", "nomenclature": "CART, 5.56MM, MK 262 MOD 1, MATCH (OTM)",
     "common_name": "5.56mm Mk 262 Match (MARSOC/SDM)", "caliber": "5.56x45mm",
     "weapon_system": "M27 IAR, M4, M110A1",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.026},
    {"dodic": "A111", "nsn": "1305-00-262-0687", "nomenclature": "CART, 7.62MM, BALL, M80A1",
     "common_name": "7.62mm Ball", "caliber": "7.62x51mm",
     "weapon_system": "M240, M110, M40",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.055},
    {"dodic": "A131", "nsn": "1305-01-234-5671", "nomenclature": "CART, 7.62MM, LINKED, 4B1T, M80/M62",
     "common_name": "7.62mm Linked (4:1 Ball/Tracer)", "caliber": "7.62x51mm",
     "weapon_system": "M240",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.060},
    {"dodic": "A115", "nsn": "1305-01-234-5703", "nomenclature": "CART, 7.62MM, MK 316 MOD 0, MATCH (SNIPER)",
     "common_name": "7.62mm Mk 316 Sniper Match", "caliber": "7.62x51mm",
     "weapon_system": "M110, M40A6",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.056},
    {"dodic": "A557", "nsn": "1305-00-063-0000", "nomenclature": "CART, .50 CAL, LINKED, 4B1T, M33/M17",
     "common_name": ".50 Cal Linked", "caliber": "12.7x99mm",
     "weapon_system": "M2A1",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.250},
    {"dodic": "A606", "nsn": "1305-01-234-5704", "nomenclature": "CART, .50 CAL, MK 211 MOD 0, RAUFOSS (API)",
     "common_name": ".50 Cal Raufoss (Armor-Piercing Incendiary)", "caliber": "12.7x99mm",
     "weapon_system": "M2A1, M107",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.265},
    {"dodic": "A598", "nsn": "1305-00-322-9716", "nomenclature": "CART, 9MM, BALL, M882",
     "common_name": "9mm Ball", "caliber": "9x19mm",
     "weapon_system": "M18, M9",
     "unit_of_issue": "RD", "rounds_per_unit": 1, "weight_per_round_lbs": 0.026},

    # ── Grenades & Pyrotechnics ────────────────────────────────────
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

    # ── Pyrotechnics / Signals ─────────────────────────────────────
    {"dodic": "G850", "nsn": "1370-01-234-5694", "nomenclature": "SIGNAL, ILLUM, GROUND, WHITE STAR PARACHUTE, M127A1",
     "common_name": "Parachute Illumination Flare", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 1.5, "is_controlled": True, "hazard_class": "1.3"},
    {"dodic": "G815", "nsn": "1370-01-234-5695", "nomenclature": "CART, 40MM, STAR CLUSTER, WHITE, M585",
     "common_name": "White Star Cluster", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G816", "nsn": "1370-01-234-5696", "nomenclature": "CART, 40MM, STAR CLUSTER, GREEN, M661",
     "common_name": "Green Star Cluster", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "G817", "nsn": "1370-01-234-5697", "nomenclature": "CART, 40MM, STAR CLUSTER, RED, M662",
     "common_name": "Red Star Cluster", "caliber": "40x46mm", "weapon_system": "M320, M203",
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

    # ── 40mm Grenades ──────────────────────────────────────────────
    {"dodic": "B542", "nsn": "1310-01-456-7890", "nomenclature": "CART, 40MM, HE, M433 HEDP",
     "common_name": "40mm HEDP", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51},
    {"dodic": "B546", "nsn": "1310-01-456-7891", "nomenclature": "CART, 40MM, LINKED, HE, MK19",
     "common_name": "40mm HE Linked (Mk 19)", "caliber": "40x53mm", "weapon_system": "Mk 19",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.75},
    {"dodic": "B544", "nsn": "1310-01-456-7892", "nomenclature": "CART, 40MM, ILLUM, M583, WHITE STAR",
     "common_name": "40mm Illumination (White Star)", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B560", "nsn": "1310-01-456-7893", "nomenclature": "CART, 40MM, SMOKE, RED, M713",
     "common_name": "40mm Red Smoke", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B561", "nsn": "1310-01-456-7894", "nomenclature": "CART, 40MM, SMOKE, GREEN, M715",
     "common_name": "40mm Green Smoke", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},
    {"dodic": "B562", "nsn": "1310-01-456-7895", "nomenclature": "CART, 40MM, SMOKE, YELLOW, M716",
     "common_name": "40mm Yellow Smoke", "caliber": "40x46mm", "weapon_system": "M320, M203",
     "unit_of_issue": "RD", "weight_per_round_lbs": 0.51, "is_controlled": True, "hazard_class": "1.4"},

    # ── Mortars ────────────────────────────────────────────────────
    {"dodic": "B613", "nsn": "1315-01-234-5674", "nomenclature": "CART, 60MM, HE, M720A1",
     "common_name": "60mm HE Mortar", "caliber": "60mm", "weapon_system": "M224A1",
     "unit_of_issue": "RD", "weight_per_round_lbs": 3.75},
    {"dodic": "B625", "nsn": "1315-01-234-5675", "nomenclature": "CART, 81MM, HE, M821A2",
     "common_name": "81mm HE Mortar", "caliber": "81mm", "weapon_system": "M252A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 9.7},
    {"dodic": "B650", "nsn": "1315-01-432-5678", "nomenclature": "CART, 120MM, HE, M933A1",
     "common_name": "120mm HE Mortar", "caliber": "120mm", "weapon_system": "M327 EFSS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 33.0},

    # ── 84mm Carl Gustaf ───────────────────────────────────────────
    {"dodic": "C988", "nsn": "1310-01-234-5705", "nomenclature": "CART, 84MM, HEDP 502, CARL GUSTAF",
     "common_name": "84mm HEDP (Carl Gustaf)", "caliber": "84mm", "weapon_system": "M3E1 MAAWS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 8.8, "is_controlled": True, "hazard_class": "1.1"},
    {"dodic": "C990", "nsn": "1310-01-234-5706", "nomenclature": "CART, 84MM, SMOKE 469C, CARL GUSTAF",
     "common_name": "84mm Smoke (Carl Gustaf)", "caliber": "84mm", "weapon_system": "M3E1 MAAWS",
     "unit_of_issue": "RD", "weight_per_round_lbs": 7.7, "is_controlled": True, "hazard_class": "1.3"},

    # ── Artillery ──────────────────────────────────────────────────
    {"dodic": "D544", "nsn": "1320-01-234-5676", "nomenclature": "PROJ, 155MM, HE, M795",
     "common_name": "155mm HE", "caliber": "155mm", "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 103.0},
    {"dodic": "D541", "nsn": "1320-01-234-5677", "nomenclature": "PROJ, 155MM, SMOKE, WP, M825A1",
     "common_name": "155mm White Phosphorus", "caliber": "155mm", "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 96.0},
    {"dodic": "D563", "nsn": "1320-01-234-5678", "nomenclature": "PROJ, 155MM, ILLUM, M485A2",
     "common_name": "155mm Illumination", "caliber": "155mm", "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 90.0},
    {"dodic": "D579", "nsn": "1320-01-567-8902", "nomenclature": "PROJ, 155MM, DPICM, M864",
     "common_name": "155mm DPICM", "caliber": "155mm", "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 102.0},
    {"dodic": "D545", "nsn": "1320-01-234-5707", "nomenclature": "PROJ, 155MM, EXCALIBUR, M982A1 (GPS-GUIDED)",
     "common_name": "155mm Excalibur GPS-Guided", "caliber": "155mm", "weapon_system": "M777A2",
     "unit_of_issue": "RD", "weight_per_round_lbs": 106.0, "is_controlled": True, "hazard_class": "1.1"},

    # ── Rockets / Missiles ─────────────────────────────────────────
    {"dodic": "D864", "nsn": "1340-01-567-8903", "nomenclature": "ROCKET, 227MM, GMLRS, M31A1",
     "common_name": "GMLRS Guided Rocket", "caliber": "227mm", "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 672.0},
    {"dodic": "D866", "nsn": "1340-01-234-5708", "nomenclature": "ROCKET, 227MM, GMLRS-ER, M403 (EXTENDED RANGE)",
     "common_name": "GMLRS-ER Extended Range", "caliber": "227mm", "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 700.0, "is_controlled": True, "hazard_class": "1.1"},
    {"dodic": "D865", "nsn": "1410-01-567-8904", "nomenclature": "MISSILE, ATACMS, M57",
     "common_name": "ATACMS Tactical Missile", "caliber": "610mm", "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 3690.0},
    {"dodic": "D867", "nsn": "1410-01-234-5709", "nomenclature": "MISSILE, PrSM, PRECISION STRIKE MISSILE",
     "common_name": "PrSM (ATACMS Replacement)", "caliber": "N/A", "weapon_system": "M142 HIMARS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 2500.0, "is_controlled": True, "hazard_class": "1.1",
     "notes": "2x per HIMARS pod. 499+ km range. ATACMS replacement"},

    # ── Anti-Armor Missiles ────────────────────────────────────────
    {"dodic": "J887", "nsn": "1410-01-453-3834", "nomenclature": "MISSILE, JAVELIN, FGM-148F",
     "common_name": "Javelin Missile", "caliber": "127mm", "weapon_system": "FGM-148 Javelin CLU",
     "unit_of_issue": "EA", "weight_per_round_lbs": 26.1},
    {"dodic": "J890", "nsn": "1410-01-067-3569", "nomenclature": "MISSILE, TOW-2B, BGM-71F",
     "common_name": "TOW-2B Missile", "caliber": "152mm", "weapon_system": "BGM-71 TOW",
     "unit_of_issue": "EA", "weight_per_round_lbs": 49.9},

    # ── Anti-Ship ──────────────────────────────────────────────────
    {"dodic": "N001", "nsn": "1410-01-700-0002", "nomenclature": "MISSILE, NSM, Naval Strike Missile",
     "common_name": "NSM Anti-Ship Missile", "caliber": "N/A", "weapon_system": "NMESIS",
     "unit_of_issue": "EA", "weight_per_round_lbs": 900.0, "is_controlled": True},

    # ── Mines / Explosives ─────────────────────────────────────────
    {"dodic": "M023", "nsn": "1375-01-234-5679", "nomenclature": "MINE, ANTITANK, M15",
     "common_name": "AT Mine M15", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 29.0, "is_controlled": True},
    {"dodic": "M030", "nsn": "1375-01-234-5680", "nomenclature": "MINE, ANTIPERSONNEL, M18A1 (CLAYMORE)",
     "common_name": "Claymore Mine", "caliber": "N/A",
     "unit_of_issue": "EA", "weight_per_round_lbs": 3.5, "is_controlled": True},
]
```

---

## Master Supply Seed Arrays

```python
ALL_SUPPLY = (
    CLASS_I_ITEMS + CLASS_II_ITEMS + CLASS_III_ITEMS + CLASS_IV_ITEMS +
    CLASS_VIII_ITEMS + CLASS_IX_ITEMS + CLASS_X_ITEMS
)
# Total: ~170 supply items

ALL_AMMO = ALL_AMMUNITION
# Total: ~50 ammunition items
```

---

## Seed Process Integration

Add seeding to the app lifespan (alongside the equipment seed from Part 1):

```python
# In main.py lifespan
await seed_equipment_catalog(db)   # From Part 1
await seed_supply_catalog(db)      # This part
await seed_ammunition_catalog(db)  # This part
```

Each seed function should be idempotent — check by NSN/TAMCN/DODIC before inserting.

---

## Complete Catalog Summary (Parts 1 + 2 Combined)

| Category | Count | Key Items |
|----------|-------|-----------|
| **Tactical Vehicles** | 24 | JLTV (4+trailer), HMMWV (4), MTVR (7), LVS (2), LVSR (2), Growler, MRZR, forklifts (2) |
| **Combat Vehicles** | 18 | ACV (4), AAV (3), LAV (6), M88, ABV, ACE, AVLB, NMESIS |
| **Artillery** | 3 | M777A2, HIMARS, EFSS |
| **Infantry Weapons** | 21 | M27, M4, M16, M18, M9, M240, M249, M2, Mk19, mortars, Javelin, TOW, MAAWS, AT4, Stinger, snipers, M320, M1014 |
| **Communications** | 7 | PRC-152, PRC-117G, PRC-150, VRC-110, TRC-170, NOTM, G/ATOR |
| **Optics/NVG** | 5 | PVS-31, PVS-14, PAS-28, ACOG, SCO |
| **Aviation — Rotary** | 4 | AH-1Z Viper, UH-1Y Venom, CH-53E, CH-53K |
| **Aviation — Tilt-Rotor/Fixed** | 5 | MV-22B, F-35B, F/A-18C, F/A-18D, KC-130J |
| **Aviation — UAS** | 4 | RQ-21A, RQ-20B Puma, MQ-9A Reaper, Switchblade 300 |
| **Watercraft** | 5 | LCAC, LCU, SSC, CRRC, RHIB |
| **Power Generation** | 7 | MEP-831A/803A/804B/805B/806B, GREENS, SPACES |
| **CBRN** | 10 | M50 mask, JSLIST, M256, M8/M9, JCAD, ACADA, M295, AN/PDR-77 |
| **Electronic Warfare** | 3 | CREW Duke, JCREW, Intrepid Tiger II |
| **Shelters** | 6 | MCCT, DRASH 2S/3XB/6XB, TEMPER, Base-X 305 |
| **Water/Fuel** | 7 | TWPS, ROWPU, LWP, Hippo, fuel bladder, TFDS, AMCS |
| **Engineer/EOD** | 5 | Pioneer tools, PSS-14, MICLIC, PackBot, TALON |
| **Field Services** | 5 | MKT, field burner, Mermite can, shower, laundry |
| **Class I (Rations)** | 7 | MRE (case+individual), FSR, UGR-H&S, UGR-A, water, purification tabs |
| **Class II (Clothing/Equip)** | 35 | Body armor, packs, uniforms, boots, sleep system, MOLLE pouches, gloves, eye/ear pro, knee/elbow pads, ECWCS, poncho |
| **Class III (POL)** | 8 | JP-8, JP-5, diesel, MOGAS, motor oil, GAA, hydraulic fluid, coolant |
| **Class IV (Construction)** | 14 | HESCO (3 sizes), concertina, sandbags, lumber, T-posts, plywood, rebar, cement, concrete, camo netting, stakes, culvert |
| **Class V (Ammo)** | 50 | Small arms (ball/tracer/blank/match for 5.56/7.62/.50/9mm), grenades, pyro (star clusters, trip flares, smoke pots, chemlights), 40mm (HEDP/illum/smoke), mortars (60/81/120mm), Carl Gustaf, 155mm (HE/WP/illum/DPICM/Excalibur), GMLRS/GMLRS-ER, ATACMS, PrSM, Javelin, TOW, NSM, mines |
| **Class VIII (Medical)** | 30 | Kits (CLS/IFAK), hemorrhage control, airway, IV/fluids, blood products, litters, analgesics, antibiotics, emergency meds, splints, burns, eye care, monitoring, hypothermia |
| **Class IX (Parts)** | 24 | Starters, alternators, tires, filters, batteries, track pads, brake pads, CV joints, drive shafts, radiators, water pumps, hydraulic hoses, wiring, windshields |
| **Class X (New)** | 12 | CLP, Otis cleaning kit, bore brushes, patches, map markers, paper, laminate, pens, signal mirrors, flashlight, headlamp |

**Grand Total: ~400+ catalog items across all categories**

---

## Important Notes

- **NSN format**: 13 digits as `XXXX-XX-XXX-XXXX`. First 4 = Federal Supply Class.
- **TAMCN format**: Letter + 4 digits. Letter = commodity area.
- **DODIC format**: Letter + 3 digits. Used exclusively for Class V ammunition.
- **Some NSNs are representative** — verify against WebFLIS for production use.
- **Seed data is expandable** — users can add items via admin interface.
- **Keep backward compatibility** — existing models work without catalog FK (nullable).
- **Class X is new** — wasn't in typical military supply class lists but covers non-military programs (weapon maintenance, office supplies, lighting).
