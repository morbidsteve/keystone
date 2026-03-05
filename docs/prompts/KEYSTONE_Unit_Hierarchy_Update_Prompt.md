# KEYSTONE — Comprehensive USMC Unit Hierarchy & Simulator Update

## Mission

Update KEYSTONE's unit seed data and mock data simulator to use the **complete active-duty USMC organizational structure** — 403 units from HQMC down to company level. The unit hierarchy is already built in `seed/seed_units.py`. This prompt tells you how to integrate it into every part of the system that touches units.

---

## What's Already Done

The file `backend/seed/seed_units.py` has been updated with the full USMC hierarchy covering:

| Component | Units Included |
|-----------|---------------|
| **HQMC** | Headquarters Marine Corps |
| **I MEF** | 1st MarDiv (1st/5th/7th/11th Marines, all infantry BNs with A-D/Wpns/H&S companies, recon, LAR, CEB, AABn, tanks), 3rd MAW (MAG-11/13/16/39 with all squadrons, MACG-38, MWSG-37), 1st MLG (CLR-1/15/17, all CLBs, ESB, dental), I MIG (intel, radio, comm, ANGLICO), 11th/13th/15th MEUs |
| **II MEF** | 2nd MarDiv (2nd/6th/10th Marines, all infantry BNs with companies, recon, LAR, CEB, AABn), 2nd MAW (MAG-14/26/29 with all squadrons, MACG-28, MWSG-27), 2nd MLG (CLR-2/27, 2nd CRR, all CLBs, ESB, dental), II MIG, 22nd/24th/26th MEUs, 2nd MEB |
| **III MEF** | 3rd MarDiv (3rd MLR, 12th MLR with LCT/LAAB/LLB, 4th Marines, 12th Marines, recon, CEB), 1st MAW (MAG-12/24/36 with squadrons, MACG-18, MWSG-17), 3rd MLG (CLR-3/37, all CLBs, maintenance, medical, ESB, dental, TSB), III MIG, 31st MEU, 3rd MEB |
| **MARFORRES** | 4th MarDiv (14th/23rd/24th/25th Marines with all reserve BNs, AABn, CEB, LAR, recon, tanks), 4th MAW (MAG-41/42/49), 4th MLG (CLR-4, CLBs, medical, dental, ESB) |
| **MARSOC** | Marine Raider Regiment (1st/2nd/3rd MRB), Marine Raider Support Group (MRTC, MRSB) |
| **Supporting Establishment** | TECOM (MCRC, MCRD SD/PI, TBS, IOC, SOI-W/E, MCU, MCWAR), MCICOM (all major bases and air stations) |
| **MARFOR Commands** | MARFORPAC, MARFORCOM, MARFORCYBER, MARFOREUR/AF, MARCENT, MARFORSOUTH, MARFOR-K |

The `Echelon` enum in `backend/app/models/unit.py` has been updated with new echelon types:
- `HQMC` — Headquarters Marine Corps
- `WING` — Marine Aircraft Wing
- `GRP` — Group (MLG, MAG, MIG, MEU, etc.)
- `SQDN` — Squadron (aviation)

These join the existing: `MEF`, `DIV`, `REGT`, `BN`, `CO`, `PLT`, `SQD`, `FT`, `INDV`, `CUSTOM`

---

## Task 1: Update the Simulator `units.py` to Use the Full Hierarchy

The simulator's `units.py` module must be aware of the full unit hierarchy from `seed/seed_units.py`. Instead of hard-coding a short list of units, it should:

1. **Import the `UNIT_HIERARCHY` dict** from `seed/seed_units.py` at startup
2. **Build a flat lookup table** from the recursive hierarchy so any unit can be referenced by abbreviation (e.g., `"2/6"`, `"CLB-8"`, `"VMFA-251"`)
3. **Build parent-chain lookups** so the simulator knows that `A Co 1/1` → `1/1` → `1st Marines` → `1st MarDiv` → `I MEF`
4. **Provide a `get_units_for_scenario()` function** that returns the relevant subset of units for a given scenario, including all their children

```python
# Example usage in scenario.py:
units = get_units_for_scenario("steel_guardian")
# Returns: 1/1, A Co 1/1, B Co 1/1, ..., CLB-1, CLR-1, etc.

units = get_units_for_scenario("pacific_fury")
# Returns: 26th MEU, BLT 2/6, all companies in 2/6, CLB-26, VMM-266, HMLA-269, etc.
```

---

## Task 2: Expand Scenarios to Cover All Three MEFs

Update the three scenarios to use units from across the force:

### `steel_guardian` — Battalion FEX at 29 Palms (I MEF)

Already partially defined. Update to use the correct unit abbreviations from the hierarchy:

```python
STEEL_GUARDIAN = Scenario(
    name="Steel Guardian",
    description="1/7 Battalion Field Exercise, MCAGCC 29 Palms",
    participating_units=[
        # GCE
        "1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7",
        "Wpns Co 1/7", "H&S Co 1/7",
        # Supporting artillery
        "1/11",
        # LCE
        "CLB-7", "CLR-1",
        # Recon screen
        "1st Recon Bn",
    ],
    location="MCAGCC 29 Palms",
    ao=AO_29_PALMS,
    ...
)
```

### `pacific_fury` — MEU Deployment (II MEF)

A 26th MEU pre-deployment workup and deployment. Uses II MEF units:

```python
PACIFIC_FURY = Scenario(
    name="Pacific Fury",
    description="26th MEU Pre-Deployment Training and Embark",
    participating_units=[
        # MEU command element
        "26th MEU",
        # BLT (Ground Combat Element)
        "2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6",
        "Wpns Co 2/6", "H&S Co 2/6",
        # Artillery attachment
        "2/10",
        # ACE
        "VMM-266", "HMLA-269", "VMFA-251",
        # LCE
        "CLB-26",
        # Recon
        "2nd Recon Bn",
    ],
    location="Camp Lejeune / At Sea",
    ao=AO_LEJEUNE,
    phases=[
        Phase("Pre-Deployment Training", day_range=(1, 14), tempo="MEDIUM"),
        Phase("Composite Training Unit Exercise", day_range=(15, 28), tempo="HIGH"),
        Phase("Embark", day_range=(29, 32), tempo="MEDIUM"),
        Phase("Transit", day_range=(33, 45), tempo="LOW"),
        Phase("Theater Operations", day_range=(46, 120), tempo="HIGH"),
        Phase("Redeployment", day_range=(121, 135), tempo="LOW"),
    ],
)
```

### `iron_forge` — Garrison Steady-State (III MEF / Okinawa)

Normal garrison operations at Camp Butler/Okinawa. Uses III MEF units including the new Marine Littoral Regiments:

```python
IRON_FORGE = Scenario(
    name="Iron Forge",
    description="III MEF Garrison Steady-State Operations, Okinawa",
    participating_units=[
        # 3rd MarDiv
        "3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB",
        "12th MLR", "12th LCT", "12th LAAB", "12th LLB",
        "3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4",
        "3/12",
        "3rd Recon Bn", "3rd CEB",
        # 1st MAW (selected squadrons)
        "VMM-262", "HMLA-369",
        # 3rd MLG
        "CLB-3", "CLB-4", "CLR-3", "3rd Maint Bn",
        "9th ESB", "3rd TSB",
        # III MIG
        "3rd Intel Bn", "7th Comm Bn",
        # 31st MEU
        "31st MEU",
    ],
    location="MCB Camp Butler, Okinawa",
    ao=AO_OKINAWA,
    phases=[
        Phase("Routine Operations", day_range=(1, 30), tempo="LOW"),
        Phase("Exercise Prep", day_range=(31, 37), tempo="MEDIUM"),
        Phase("Exercise Execution", day_range=(38, 44), tempo="HIGH"),
        Phase("Post-Exercise Recovery", day_range=(45, 51), tempo="LOW"),
        Phase("Routine Operations", day_range=(52, 90), tempo="LOW"),
    ],
)
```

Add a new AO for Okinawa:

```python
AO_OKINAWA = {
    "center": (26.3344, 127.7731),
    "radius_km": 25,
    "key_locations": {
        "CAMP_FOSTER": (26.3344, 127.7731),
        "CAMP_HANSEN": (26.4494, 127.7686),
        "CAMP_SCHWAB": (26.5292, 127.9375),
        "CAMP_KINSER": (26.3014, 127.7222),
        "MCAS_FUTENMA": (26.2742, 127.7564),
        "KADENA_AB": (26.3517, 127.7681),
        "WHITE_BEACH": (26.3306, 127.8817),
        "NAHA_PORT": (26.2167, 127.6700),
        "NORTHERN_TRAINING_AREA": (26.5800, 128.0500),
    }
}
```

---

## Task 3: Expand Callsigns for All Participating Units

Build out the `CALLSIGNS` dictionary to cover every unit that participates in any scenario. Use realistic Marine Corps callsign conventions:

- **Infantry BNs**: Named callsigns (RAIDER, WARLORD, DARK HORSE, PALE HORSE, etc.)
- **Companies**: A=phonetic-themed (ASSASSIN, APACHE, etc.), B=phonetic-themed (BARBARIAN, BLACKJACK, etc.)
- **Artillery**: STEEL RAIN, KING OF BATTLE, THUNDER, etc.
- **Logistics**: IRONHORSE, WARPIG, SUPPLY TRAIN, etc.
- **Aviation**: Use squadron designations (VMFA-251 = THUNDERBOLTS, VMM-266 = FIGHTING GRIFFINS, etc.)
- **Recon**: SWIFT SILENT DEADLY, SHADOW, etc.
- **MLR units**: Modern callsigns (SENTINEL, OVERWATCH, LITTORAL, etc.)

```python
CALLSIGNS = {
    # ── I MEF: Steel Guardian scenario ─────────────────────
    # 1/7 Marines
    "1/7":          ["PALE HORSE-6", "PALE HORSE-3", "PALE HORSE-S4", "PALE HORSE-LOG"],
    "A Co 1/7":     ["APACHE-6", "APACHE-4", "APACHE-LOG"],
    "B Co 1/7":     ["BLACKJACK-6", "BLACKJACK-4", "BLACKJACK-LOG"],
    "C Co 1/7":     ["COMANCHE-6", "COMANCHE-4", "COMANCHE-LOG"],
    "Wpns Co 1/7":  ["WARHAMMER-6", "WARHAMMER-4"],
    "H&S Co 1/7":   ["HORSESHOE-6", "HORSESHOE-4"],
    # 1/11 Marines (Artillery)
    "1/11":         ["STEEL RAIN-6", "STEEL RAIN-FDC", "STEEL RAIN-LOG"],
    # 1st Recon Bn
    "1st Recon Bn": ["SHADOW-6", "SHADOW-3", "SHADOW-LOG"],
    # CLB-7
    "CLB-7":        ["IRONHORSE-6", "IRONHORSE-4", "IRONHORSE-DISTRO", "IRONHORSE-MAINT"],
    "CLR-1":        ["FORGE-6", "FORGE-4", "FORGE-S4"],

    # ── II MEF: Pacific Fury scenario ──────────────────────
    # 26th MEU
    "26th MEU":     ["BATAAN-6", "BATAAN-3", "BATAAN-LOG"],
    # 2/6 Marines
    "2/6":          ["WARLORD-6", "WARLORD-3", "WARLORD-S4", "WARLORD-LOG"],
    "A Co 2/6":     ["ALPHA DAWG-6", "ALPHA DAWG-4", "ALPHA DAWG-LOG"],
    "B Co 2/6":     ["BRAVO BULL-6", "BRAVO BULL-4", "BRAVO BULL-LOG"],
    "C Co 2/6":     ["CHAOS-6", "CHAOS-4", "CHAOS-LOG"],
    "Wpns Co 2/6":  ["WARDOG-6", "WARDOG-4"],
    "H&S Co 2/6":   ["HEADHUNTER-6", "HEADHUNTER-4"],
    # 2/10 Marines (Artillery)
    "2/10":         ["THUNDER-6", "THUNDER-FDC", "THUNDER-LOG"],
    # Aviation
    "VMM-266":      ["FIGHTING GRIFFIN-OPS", "FIGHTING GRIFFIN-LOG"],
    "HMLA-269":     ["GUNRUNNER-OPS", "GUNRUNNER-LOG"],
    "VMFA-251":     ["THUNDERBOLT-OPS", "THUNDERBOLT-LOG"],
    # LCE
    "CLB-26":       ["WARPIG-6", "WARPIG-4", "WARPIG-DISTRO", "WARPIG-MAINT"],
    # Recon
    "2nd Recon Bn": ["SWIFT SILENT-6", "SWIFT SILENT-3", "SWIFT SILENT-LOG"],

    # ── III MEF: Iron Forge scenario ───────────────────────
    # 3rd MLR
    "3rd MLR":      ["SENTINEL-6", "SENTINEL-3", "SENTINEL-LOG"],
    "3rd LCT":      ["LITTORAL-6", "LITTORAL-4", "LITTORAL-LOG"],
    "3rd LAAB":     ["OVERWATCH-6", "OVERWATCH-4", "OVERWATCH-LOG"],
    "3rd LLB":      ["SUPPLY LINE-6", "SUPPLY LINE-4", "SUPPLY LINE-LOG"],
    # 12th MLR
    "12th MLR":     ["ISLAND WATCH-6", "ISLAND WATCH-3", "ISLAND WATCH-LOG"],
    "12th LCT":     ["TRIDENT-6", "TRIDENT-4", "TRIDENT-LOG"],
    "12th LAAB":    ["AEGIS-6", "AEGIS-4", "AEGIS-LOG"],
    "12th LLB":     ["LIFELINE-6", "LIFELINE-4", "LIFELINE-LOG"],
    # 3/4 Marines
    "3/4":          ["DARK HORSE-6", "DARK HORSE-3", "DARK HORSE-S4", "DARK HORSE-LOG"],
    "A Co 3/4":     ["AVENGER-6", "AVENGER-4", "AVENGER-LOG"],
    "B Co 3/4":     ["BLADE-6", "BLADE-4", "BLADE-LOG"],
    "C Co 3/4":     ["COBRA-6", "COBRA-4", "COBRA-LOG"],
    # 3/12 Marines (Artillery)
    "3/12":         ["KING-6", "KING-FDC", "KING-LOG"],
    # Recon/CEB
    "3rd Recon Bn": ["PHANTOM-6", "PHANTOM-3", "PHANTOM-LOG"],
    "3rd CEB":      ["SAPPER-6", "SAPPER-4", "SAPPER-LOG"],
    # Aviation
    "VMM-262":      ["FLYING TIGER-OPS", "FLYING TIGER-LOG"],
    "HMLA-369":     ["GUNFIGHTER-OPS", "GUNFIGHTER-LOG"],
    # 3rd MLG
    "CLB-3":        ["COMBAT TRAIN-6", "COMBAT TRAIN-4", "COMBAT TRAIN-DISTRO"],
    "CLB-4":        ["ROADRUNNER-6", "ROADRUNNER-4", "ROADRUNNER-DISTRO"],
    "CLR-3":        ["BACKBONE-6", "BACKBONE-4", "BACKBONE-S4"],
    "3rd Maint Bn": ["WRENCH-6", "WRENCH-4", "WRENCH-LOG"],
    "9th ESB":      ["PIONEER-6", "PIONEER-4", "PIONEER-LOG"],
    "3rd TSB":      ["CONVOY MASTER-6", "CONVOY MASTER-4"],
    # III MIG
    "3rd Intel Bn": ["ALL SEEING-6", "ALL SEEING-3"],
    "7th Comm Bn":  ["SIGNAL-6", "SIGNAL-3", "SIGNAL-LOG"],
    # 31st MEU
    "31st MEU":     ["TYPHOON-6", "TYPHOON-3", "TYPHOON-LOG"],
}
```

---

## Task 4: Expand mIRC Channel Definitions Per Scenario

Each scenario should define its own set of mIRC channels that the simulator generates traffic for:

### Steel Guardian Channels (I MEF)
```python
STEEL_GUARDIAN_CHANNELS = {
    "#1-7-LOG-NET":       {"units": ["1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7", "Wpns Co 1/7"], "content": "logistics"},
    "#1-7-MAINT-NET":     {"units": ["1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7"], "content": "maintenance"},
    "#1-7-SUPPLY-REQ":    {"units": ["1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7"], "content": "supply_requests"},
    "#CLB7-DISTRO":       {"units": ["CLB-7", "CLR-1", "1/7"], "content": "distribution"},
    "#7THMAR-LOG-COMMON": {"units": ["1/7", "CLB-7", "CLR-1", "1/11"], "content": "regimental_log"},
    "#1-11-FIRES":        {"units": ["1/11", "1/7"], "content": "fires_support"},
    "#RECON-OPS":         {"units": ["1st Recon Bn", "1/7"], "content": "recon_ops"},
}
```

### Pacific Fury Channels (II MEF)
```python
PACIFIC_FURY_CHANNELS = {
    "#26MEU-LOG-NET":     {"units": ["26th MEU", "2/6", "CLB-26"], "content": "logistics"},
    "#BLT26-LOG":         {"units": ["2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6", "Wpns Co 2/6"], "content": "logistics"},
    "#BLT26-MAINT":       {"units": ["2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6"], "content": "maintenance"},
    "#CLB26-DISTRO":      {"units": ["CLB-26", "2/6"], "content": "distribution"},
    "#MEU-ACE-OPS":       {"units": ["VMM-266", "HMLA-269", "VMFA-251", "26th MEU"], "content": "aviation_ops"},
    "#2-10-FIRES":        {"units": ["2/10", "2/6"], "content": "fires_support"},
    "#MEU-TAC-LOG":       {"units": ["26th MEU", "2/6", "CLB-26", "VMM-266"], "content": "tactical_log"},
}
```

### Iron Forge Channels (III MEF)
```python
IRON_FORGE_CHANNELS = {
    "#3MARDIV-LOG-NET":   {"units": ["3rd MLR", "12th MLR", "3/4", "CLR-3"], "content": "logistics"},
    "#3MLR-LOG":          {"units": ["3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB"], "content": "logistics"},
    "#12MLR-LOG":         {"units": ["12th MLR", "12th LCT", "12th LAAB", "12th LLB"], "content": "logistics"},
    "#3-4-LOG-NET":       {"units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"], "content": "logistics"},
    "#3-4-MAINT-NET":     {"units": ["3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4"], "content": "maintenance"},
    "#3MLG-DISTRO":       {"units": ["CLR-3", "CLB-3", "CLB-4", "3rd TSB"], "content": "distribution"},
    "#3MLG-MAINT":        {"units": ["3rd Maint Bn", "CLB-3", "CLB-4", "3/4"], "content": "maintenance"},
    "#3MARDIV-FIRES":     {"units": ["3/12", "3rd MLR", "3/4"], "content": "fires_support"},
    "#31MEU-LOG":         {"units": ["31st MEU", "CLB-31"], "content": "logistics"},
}
```

---

## Task 5: Update Unit State Initialization

When a scenario starts, the simulator must initialize `UnitState` objects for every participating unit. The initialization should vary by echelon and type:

### Supply Load-Outs by Unit Type

```python
SUPPLY_TEMPLATES = {
    "infantry_company": {
        "CL_I":   SupplyTemplate("MRE", "CL I", required=900, daily_rate=300),
        "WATER":  SupplyTemplate("Water (gal)", "CL I", required=500, daily_rate=250),
        "5.56":   SupplyTemplate("5.56mm", "CL V", required=21000, daily_rate=1000),
        "7.62":   SupplyTemplate("7.62mm", "CL V", required=8000, daily_rate=400),
        "40MM":   SupplyTemplate("40mm HEDP", "CL V", required=600, daily_rate=50),
    },
    "infantry_battalion": {
        # Aggregated from companies + BN-level items
        "JP8":    SupplyTemplate("JP-8 (gal)", "CL III", required=3000, daily_rate=800),
        "DIESEL": SupplyTemplate("Diesel (gal)", "CL III", required=5000, daily_rate=1200),
        "MOGAS":  SupplyTemplate("MOGAS (gal)", "CL III", required=500, daily_rate=100),
    },
    "artillery_battalion": {
        "155MM":  SupplyTemplate("155mm HE", "CL V", required=2000, daily_rate=200),
        "155WP":  SupplyTemplate("155mm WP", "CL V", required=200, daily_rate=20),
        "ILLUM":  SupplyTemplate("155mm ILLUM", "CL V", required=400, daily_rate=40),
        "JP8":    SupplyTemplate("JP-8 (gal)", "CL III", required=2000, daily_rate=500),
        "DIESEL": SupplyTemplate("Diesel (gal)", "CL III", required=3000, daily_rate=700),
    },
    "logistics_battalion": {
        "JP8":    SupplyTemplate("JP-8 (gal)", "CL III", required=50000, daily_rate=8000),
        "DIESEL": SupplyTemplate("Diesel (gal)", "CL III", required=30000, daily_rate=5000),
        "MRE":    SupplyTemplate("MRE", "CL I", required=10000, daily_rate=2000),
        "WATER":  SupplyTemplate("Water (gal)", "CL I", required=8000, daily_rate=3000),
    },
    "mlr_littoral_combat_team": {
        "NSM":    SupplyTemplate("NSM Missiles", "CL V", required=8, daily_rate=0),
        "DIESEL": SupplyTemplate("Diesel (gal)", "CL III", required=2000, daily_rate=400),
        "MRE":    SupplyTemplate("MRE", "CL I", required=600, daily_rate=200),
        "5.56":   SupplyTemplate("5.56mm", "CL V", required=15000, daily_rate=500),
    },
    "mlr_anti_air_battalion": {
        "STINGER": SupplyTemplate("Stinger Missiles", "CL V", required=24, daily_rate=0),
        "DIESEL":  SupplyTemplate("Diesel (gal)", "CL III", required=1500, daily_rate=300),
        "MRE":     SupplyTemplate("MRE", "CL I", required=400, daily_rate=150),
    },
    "aviation_squadron": {
        "JP5":     SupplyTemplate("JP-5 (gal)", "CL III", required=80000, daily_rate=15000),
        "FLARES":  SupplyTemplate("Countermeasure Flares", "CL V", required=500, daily_rate=50),
        "20MM":    SupplyTemplate("20mm PGU", "CL V", required=5000, daily_rate=200),
    },
    "recon_battalion": {
        "MRE":    SupplyTemplate("MRE", "CL I", required=300, daily_rate=100),
        "WATER":  SupplyTemplate("Water (gal)", "CL I", required=200, daily_rate=100),
        "5.56":   SupplyTemplate("5.56mm", "CL V", required=10000, daily_rate=500),
        "DIESEL": SupplyTemplate("Diesel (gal)", "CL III", required=1000, daily_rate=200),
    },
}
```

### Equipment Tables by Unit Type

```python
EQUIPMENT_TEMPLATES = {
    "infantry_company": [
        EquipTemplate("D1195", "HMMWV M1151", count=8, breakdown_rate=0.03),
        EquipTemplate("E0846", "JLTV M1280", count=4, breakdown_rate=0.02),
        EquipTemplate("D1234", "MTVR MK23", count=3, breakdown_rate=0.04),
    ],
    "infantry_battalion": [
        EquipTemplate("D1195", "HMMWV M1151", count=35, breakdown_rate=0.03),
        EquipTemplate("E0846", "JLTV M1280", count=20, breakdown_rate=0.02),
        EquipTemplate("D1234", "MTVR MK23", count=12, breakdown_rate=0.04),
        EquipTemplate("B0163", "LAV-25", count=0, breakdown_rate=0.05),  # Only for LAR
        EquipTemplate("B2200", "M88A2 Recovery", count=2, breakdown_rate=0.03),
    ],
    "artillery_battalion": [
        EquipTemplate("D6005", "M777A2 155mm", count=18, breakdown_rate=0.02),
        EquipTemplate("D1234", "MTVR MK23", count=24, breakdown_rate=0.04),
        EquipTemplate("E0846", "JLTV M1280", count=8, breakdown_rate=0.02),
        EquipTemplate("B4444", "M142 HIMARS", count=9, breakdown_rate=0.02),
    ],
    "logistics_battalion": [
        EquipTemplate("D1234", "MTVR MK23", count=48, breakdown_rate=0.04),
        EquipTemplate("D1244", "MTVR MK25 (Wrecker)", count=4, breakdown_rate=0.03),
        EquipTemplate("D1266", "LVS MK48/18", count=12, breakdown_rate=0.05),
        EquipTemplate("D1195", "HMMWV M1151", count=15, breakdown_rate=0.03),
        EquipTemplate("E0880", "TRAM Forklift", count=6, breakdown_rate=0.04),
        EquipTemplate("B2200", "M88A2 Recovery", count=2, breakdown_rate=0.03),
    ],
    "mlr_littoral_combat_team": [
        EquipTemplate("E0846", "JLTV M1280", count=15, breakdown_rate=0.02),
        EquipTemplate("F0001", "NMESIS Launcher", count=4, breakdown_rate=0.01),
        EquipTemplate("D1234", "MTVR MK23", count=6, breakdown_rate=0.04),
    ],
}
```

Map each participating unit to the appropriate template based on its name/echelon:

```python
def classify_unit_type(unit_abbr: str, echelon: str) -> str:
    """Determine the supply/equipment template for a unit."""
    if echelon == "CO":
        return "infantry_company"
    if "Recon" in unit_abbr:
        return "recon_battalion"
    if "CLB" in unit_abbr or "DSB" in unit_abbr or "TSB" in unit_abbr:
        return "logistics_battalion"
    if "LCT" in unit_abbr:
        return "mlr_littoral_combat_team"
    if "LAAB" in unit_abbr:
        return "mlr_anti_air_battalion"
    if "LLB" in unit_abbr:
        return "logistics_battalion"  # Littoral logistics similar to CLB
    if any(x in unit_abbr for x in ["VMM", "VMFA", "HMLA", "HMH", "VMGR"]):
        return "aviation_squadron"
    if "/" in unit_abbr and any(x in unit_abbr for x in ["/10", "/11", "/12", "/14"]):
        return "artillery_battalion"
    if echelon == "BN":
        return "infantry_battalion"
    return "infantry_battalion"  # default fallback
```

---

## Task 6: Alembic Migration for New Echelon Values

If using Alembic for database migrations, create a migration that adds the new `Echelon` enum values (`HQMC`, `WING`, `GRP`, `SQDN`) to the PostgreSQL enum type. If not using Alembic, ensure the enum type in PostgreSQL is updated before seeding.

```python
# Example Alembic migration
def upgrade():
    op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'HQMC'")
    op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'WING'")
    op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'GRP'")
    op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'SQDN'")

def downgrade():
    pass  # PostgreSQL doesn't support removing enum values
```

---

## Task 7: Update Frontend Unit Selectors

The frontend likely has unit pickers/selectors. Update them to handle the new hierarchy:

1. **Tree-based unit selector** — Display units as a collapsible tree: HQMC > I MEF > 1st MarDiv > 1st Marines > 1/1 > A Co 1/1
2. **Filtered search** — Let users type "2/6" or "26th MEU" and get instant matches from the full list
3. **Echelon icons** — Add icons/badges for the new echelon types (WING, GRP, SQDN)
4. **Default to the user's MEF** — If a user is assigned to a I MEF unit, default the tree to expand I MEF

---

## Task 8: Update the Seed Process

Update `backend/app/main.py` lifespan to handle the expanded hierarchy:

1. The `seed_units()` call already handles the full hierarchy via the recursive `create_unit_tree()` function
2. Ensure the development seed still works — the unit map returned by `seed_units()` now contains 400+ units
3. If `sample_data.py` references unit abbreviations, verify those abbreviations still match (they should — we kept backward compatibility with the original I MEF units)

---

## Summary of Files to Create/Modify

| File | Action |
|------|--------|
| `backend/seed/seed_units.py` | ✅ Already updated (403 units) |
| `backend/app/models/unit.py` | ✅ Already updated (new Echelon values) |
| `backend/simulator/units.py` | **Create** — hierarchy loader + unit lookup |
| `backend/simulator/scenario.py` | **Update** — expand 3 scenarios with real units |
| `backend/simulator/generators/mirc.py` | **Update** — expanded callsigns + channels |
| `backend/simulator/generators/tak.py` | **Update** — AO_OKINAWA, position data for III MEF units |
| `backend/simulator/config.py` | **Update** — add supply/equipment templates by unit type |
| `frontend/src/components/UnitSelector.tsx` | **Update** — tree-based selector for 400+ units |
| Alembic migration | **Create** — add new enum values |
| `backend/app/main.py` | **Verify** — seed process handles expanded hierarchy |

---

## Important Notes

- **Backward compatible**: All original unit abbreviations (1/1, 2/1, 3/1, CLB-1, CLR-1, etc.) still exist in the hierarchy with the same abbreviations. Nothing breaks.
- **UIC scheme**: Units use a systematic UIC scheme — `M1xxxx` = I MEF, `M2xxxx` = II MEF, `M3xxxx` = III MEF, `M4xxxx` = MARFORRES, `M5xxxx` = MARSOC, `M6xxxx` = TECOM, `M7xxxx` = MCICOM, `M8xxxx` = MARFOR commands. Consistent and predictable.
- **Idempotent seeding**: `create_unit_tree()` checks by UIC before creating. Safe to run multiple times.
- **Force Design 2030 updates**: The hierarchy reflects current Force Design changes — 3rd and 12th Marine Littoral Regiments in III MEF, 5/11 deactivated, HIMARS consolidated into 1/11, etc.
- **Reserve units included**: MARFORRES has 4th MarDiv, 4th MAW, 4th MLG — useful for total force scenarios.
