# KEYSTONE — Expanded Exercise Scenarios for Mock Data Simulator

## Mission

Add a comprehensive library of real-world USMC exercise scenarios to the mock data simulator. The simulator currently has three scenarios (`steel_guardian`, `pacific_fury`, `iron_forge`). This prompt adds **15+ new scenarios** based on actual Marine Corps exercises — pre-deployment training, multinational exercises, INDOPACOM operations, NATO/EUCOM exercises, CENTCOM/SOUTHCOM operations, and EABO/littoral operations. Each scenario must plug into the existing simulator architecture (engine, event queue, generators, feeders) and use units from the full USMC hierarchy in `seed/seed_units.py`.

---

## Scenario Architecture Reminder

Each scenario follows the existing pattern:

```python
Scenario(
    name="Exercise Name",
    description="Brief description",
    start_time=datetime(...),
    end_time=datetime(...),
    participating_units=[...],   # Unit abbreviations from seed_units.py
    location="Location",
    ao=AO_DEFINITION,           # Area of operations with key locations
    op_tempo="HIGH",            # Overall default tempo
    phases=[Phase(...)],        # Named phases with day ranges and tempo
    channels={...},             # mIRC channels for this exercise
    callsigns={...},            # Callsigns for participating units
)
```

---

## Category 1: Pre-Deployment Training Exercises (I MEF / CONUS)

### 1. `integrated_training_exercise` — ITX at 29 Palms

The Integrated Training Exercise is the Marine Corps' premier combined-arms pre-deployment training event at MCAGCC Twentynine Palms. An infantry battalion plus supporting arms conducts force-on-force and live-fire training against a dedicated opposing force (OPFOR). This is the bread-and-butter exercise that every deploying battalion goes through.

```python
INTEGRATED_TRAINING_EXERCISE = Scenario(
    name="Integrated Training Exercise (ITX)",
    description="2/5 Battalion ITX, MCAGCC 29 Palms — Combined arms pre-deployment certification",
    start_time=datetime(2026, 4, 7, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 4, 25, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # GCE - Battalion Landing Team built around 2/5
        "2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5",
        "Wpns Co 2/5", "H&S Co 2/5",
        # Reinforcing arms
        "2/11",                    # Artillery battery attached
        "1st CEB",                 # Engineer platoon attached
        "1st LAR Bn",              # LAR company attached
        "3rd AABn",                # AAV platoon attached
        # LCE
        "CLB-5",
        "CLR-1",
    ],
    location="MCAGCC Twentynine Palms, CA",
    ao=AO_29_PALMS,
    op_tempo="HIGH",
    phases=[
        Phase("Range Package", day_range=(1, 4), tempo="MEDIUM"),
        Phase("Mojave Viper MOUT", day_range=(5, 7), tempo="HIGH"),
        Phase("Force-on-Force", day_range=(8, 12), tempo="HIGH"),
        Phase("Combined Arms Live Fire", day_range=(13, 15), tempo="HIGH"),
        Phase("Battalion FEX", day_range=(16, 18), tempo="HIGH"),
        Phase("Recovery", day_range=(19, 19), tempo="LOW"),
    ],
    channels={
        "#2-5-LOG-NET":       {"units": ["2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5", "Wpns Co 2/5"], "content": "logistics"},
        "#2-5-MAINT-NET":     {"units": ["2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5"], "content": "maintenance"},
        "#CLB5-DISTRO":       {"units": ["CLB-5", "CLR-1", "2/5"], "content": "distribution"},
        "#5THMAR-LOG-COMMON": {"units": ["2/5", "CLB-5", "CLR-1", "2/11"], "content": "regimental_log"},
        "#2-11-FIRES":        {"units": ["2/11", "2/5"], "content": "fires_support"},
        "#ITX-RANGE-CTRL":    {"units": ["2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5"], "content": "range_control"},
    },
)
```

### 2. `steel_knight` — I MEF Division-Level Exercise

Steel Knight is 1st Marine Division's premier annual exercise — larger than a single battalion. It certifies the entire division staff and integrates the GCE with the ACE and LCE for a full MAGTF event. Takes place across Southern California and the Southwest.

```python
STEEL_KNIGHT = Scenario(
    name="Exercise Steel Knight",
    description="1st MarDiv division-level certification exercise, Southern California",
    start_time=datetime(2026, 12, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 12, 14, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # Division HQ
        "1st MarDiv", "HQBN 1st MarDiv",
        # GCE - Multiple regiments
        "5th Marines",
        "1/5", "A Co 1/5", "B Co 1/5", "C Co 1/5", "Wpns Co 1/5", "H&S Co 1/5",
        "2/5", "A Co 2/5", "B Co 2/5", "C Co 2/5", "Wpns Co 2/5", "H&S Co 2/5",
        "3/5", "A Co 3/5", "B Co 3/5", "C Co 3/5", "Wpns Co 3/5", "H&S Co 3/5",
        "7th Marines",
        "1/7", "A Co 1/7", "B Co 1/7", "C Co 1/7", "Wpns Co 1/7", "H&S Co 1/7",
        "2/7", "A Co 2/7", "B Co 2/7", "C Co 2/7", "Wpns Co 2/7", "H&S Co 2/7",
        # Artillery
        "11th Marines", "1/11", "2/11", "3/11",
        # Recon & supporting
        "1st Recon Bn", "1st LAR Bn", "1st CEB",
        # ACE (selected squadrons from 3rd MAW)
        "MAG-39", "HMLA-369", "HMLA-267",
        "MAG-16", "VMM-163", "VMM-166",
        "MAG-11", "VMFA-314",
        # LCE
        "1st MLG", "CLR-1", "CLB-1", "CLB-5", "CLB-7",
        "CLR-15", "CLB-11",
        "1st DSB",
        # MIG
        "I MIG", "9th Comm Bn", "1st Intel Bn",
    ],
    location="Camp Pendleton, 29 Palms, San Clemente Island",
    ao=AO_SOCAL,  # New AO definition needed
    op_tempo="HIGH",
    phases=[
        Phase("Force Generation", day_range=(1, 2), tempo="MEDIUM"),
        Phase("Deployment & Staging", day_range=(3, 4), tempo="MEDIUM"),
        Phase("Shaping Operations", day_range=(5, 6), tempo="MEDIUM"),
        Phase("Decisive Action", day_range=(7, 10), tempo="HIGH"),
        Phase("Exploitation / Transition", day_range=(11, 12), tempo="HIGH"),
        Phase("Redeployment & Recovery", day_range=(13, 14), tempo="LOW"),
    ],
)
```

### 3. `meu_comptuex` — MEU Composite Training Unit Exercise

COMPTUEX is the final pre-deployment certification for a Marine Expeditionary Unit and its Amphibious Ready Group. The MEU executes the full spectrum of MEU missions: amphibious assault, NEO, humanitarian assistance, maritime interdiction, and more. If they pass, they deploy.

```python
MEU_COMPTUEX = Scenario(
    name="24th MEU COMPTUEX",
    description="24th MEU Composite Training Unit Exercise — Final deployment certification",
    start_time=datetime(2026, 5, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 5, 14, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # MEU CE
        "24th MEU",
        # BLT (GCE)
        "1/8", "A Co 1/8", "B Co 1/8", "C Co 1/8",
        "Wpns Co 1/8", "H&S Co 1/8",
        # Artillery det
        "1/10",
        # ACE
        "VMM-264", "HMLA-167", "VMFA-224",
        # LCE
        "CLB-24",
        # Recon det
        "2nd Recon Bn",
        # ANGLICO
        "2nd ANGLICO",
    ],
    location="Camp Lejeune, Atlantic Ocean, Caribbean",
    ao=AO_LEJEUNE_OFFSHORE,  # New AO with sea lanes
    op_tempo="HIGH",
    phases=[
        Phase("Amphibious Assault", day_range=(1, 3), tempo="HIGH"),
        Phase("Maritime Interdiction Ops", day_range=(4, 5), tempo="MEDIUM"),
        Phase("NEO / Evacuation", day_range=(6, 7), tempo="HIGH"),
        Phase("Humanitarian Assistance", day_range=(8, 9), tempo="MEDIUM"),
        Phase("Raid / Direct Action", day_range=(10, 11), tempo="HIGH"),
        Phase("Sustained Operations Ashore", day_range=(12, 13), tempo="HIGH"),
        Phase("Reembark", day_range=(14, 14), tempo="MEDIUM"),
    ],
)
```

---

## Category 2: Indo-Pacific Exercises (III MEF / INDOPACOM)

### 4. `cobra_gold` — Multinational Exercise, Thailand

The largest joint exercise in mainland Asia. Co-hosted by Thailand and US, with 30+ nations participating. Includes field training, humanitarian civic action, and command-post exercises. Marines from III MEF are primary participants.

```python
COBRA_GOLD = Scenario(
    name="Exercise Cobra Gold",
    description="Cobra Gold 26 — Multinational exercise, Kingdom of Thailand (III MEF lead)",
    start_time=datetime(2026, 2, 24, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 3, 7, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # III MEF elements
        "3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4",
        "3rd CEB",
        "3/12",
        # 3rd MLG support
        "CLB-3", "CLR-3",
        # Aviation
        "VMM-262",
        # 31st MEU (afloat support)
        "31st MEU",
        # Comms
        "7th Comm Bn",
    ],
    location="Sattahip & Rayong Province, Thailand",
    ao=AO_THAILAND,
    op_tempo="MEDIUM",
    phases=[
        Phase("Reception & Staging", day_range=(1, 2), tempo="LOW"),
        Phase("Command Post Exercise", day_range=(3, 5), tempo="MEDIUM"),
        Phase("Field Training Exercise", day_range=(6, 9), tempo="HIGH"),
        Phase("Humanitarian Civic Action", day_range=(10, 11), tempo="LOW"),
        Phase("Recovery & Redeployment", day_range=(12, 12), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_THAILAND = {
    "center": (12.6833, 100.8833),
    "radius_km": 40,
    "key_locations": {
        "SATTAHIP_NAVAL_BASE": (12.6833, 100.8833),
        "UTAPAO_AIRFIELD": (12.6797, 101.0050),
        "RAYONG_TRAINING_AREA": (12.7000, 101.2500),
        "CAMP_AKATOSROT": (12.7500, 101.1000),
        "LANDING_BEACH_ALPHA": (12.5500, 100.9200),
        "HA_DR_SITE": (12.8000, 101.0000),
    }
}
```

### 5. `balikatan` — US-Philippines Bilateral Exercise

The largest annual US-Philippines military exercise. Heavy focus on EABO, littoral operations, and island defense. The 3rd Marine Littoral Regiment is the primary USMC participant.

```python
BALIKATAN = Scenario(
    name="Exercise Balikatan",
    description="Balikatan 26 — US-Philippines bilateral exercise with EABO focus",
    start_time=datetime(2026, 4, 20, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 5, 8, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 3rd MLR (primary)
        "3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB",
        # 12th MLR elements
        "12th MLR", "12th LCT",
        # Supporting
        "3rd Recon Bn",
        # Aviation
        "VMM-262", "HMLA-369",
        # Logistics
        "CLB-3", "3rd TSB",
        # Comms/Intel
        "3rd Intel Bn", "7th Comm Bn",
    ],
    location="Luzon, Batanes, Palawan — Philippines",
    ao=AO_PHILIPPINES,
    op_tempo="HIGH",
    phases=[
        Phase("Opening / Force Flow", day_range=(1, 3), tempo="MEDIUM"),
        Phase("Combined CPX", day_range=(4, 6), tempo="MEDIUM"),
        Phase("Maritime Key Terrain Security Ops", day_range=(7, 12), tempo="HIGH"),
        Phase("EABO — Island Seizure & Defense", day_range=(13, 16), tempo="HIGH"),
        Phase("Live Fire / SINKEX", day_range=(17, 18), tempo="HIGH"),
        Phase("Redeployment", day_range=(19, 19), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_PHILIPPINES = {
    "center": (18.2000, 121.9000),
    "radius_km": 300,
    "key_locations": {
        "FORT_MAGSAYSAY": (15.4667, 121.0833),
        "CROW_VALLEY": (15.2500, 120.5833),
        "BATAN_ISLAND": (20.4500, 121.9700),
        "ITBAYAT_ISLAND": (20.7900, 121.8400),
        "MAVULIS_ISLAND": (21.0600, 121.9600),  # Northernmost Philippine island
        "LAOAG_AIRFIELD": (18.1781, 120.5314),
        "PALAWAN": (9.8500, 118.7386),
        "SUBIC_BAY": (14.7944, 120.2833),
        "CAMP_AGUINALDO": (14.5500, 121.0500),
    }
}
```

### 6. `resolute_dragon` — US-Japan Bilateral Exercise

Major bilateral exercise with the Japan Ground Self-Defense Force (JGSDF). Tests integrated fires, EABO concepts, and combined logistics. 3rd MarDiv and JGSDF Amphibious Rapid Deployment Brigade are primary participants.

```python
RESOLUTE_DRAGON = Scenario(
    name="Exercise Resolute Dragon",
    description="Resolute Dragon 26 — US-Japan bilateral, Okinawa & mainland Japan",
    start_time=datetime(2026, 9, 15, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 9, 28, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 3rd MarDiv
        "3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB",
        "3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4",
        "3/12",
        "3rd CEB",
        # Aviation
        "MAG-36", "VMM-262", "VMM-265", "HMLA-369",
        # Logistics
        "3rd MLG", "CLR-3", "CLB-3", "CLB-4",
        "3rd Maint Bn", "9th ESB",
        # III MIG
        "3rd Intel Bn", "3rd Radio Bn", "7th Comm Bn",
    ],
    location="Okinawa, Camp Fuji, Hokkaido — Japan",
    ao=AO_JAPAN,
    op_tempo="HIGH",
    phases=[
        Phase("Force Deployment", day_range=(1, 2), tempo="MEDIUM"),
        Phase("Combined Arms Maneuver", day_range=(3, 6), tempo="HIGH"),
        Phase("Integrated Fires", day_range=(7, 9), tempo="HIGH"),
        Phase("EABO / Maritime ISR", day_range=(10, 12), tempo="HIGH"),
        Phase("Redeployment", day_range=(13, 14), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_JAPAN = {
    "center": (26.3344, 127.7731),
    "radius_km": 50,
    "key_locations": {
        "CAMP_HANSEN": (26.4494, 127.7686),
        "CAMP_SCHWAB": (26.5292, 127.9375),
        "MCAS_FUTENMA": (26.2742, 127.7564),
        "MCAS_IWAKUNI": (34.1464, 132.2356),
        "CAMP_FUJI": (35.2897, 138.7811),
        "NAHA_PORT": (26.2167, 127.6700),
        "NORTHERN_TRAINING_AREA": (26.5800, 128.0500),
        "IE_SHIMA": (26.7167, 127.7833),
        "KADENA_AB": (26.3517, 127.7681),
    }
}
```

### 7. `ssang_yong` — US-ROK Amphibious Exercise, Korea

Large-scale combined amphibious exercise with the Republic of Korea Marine Corps. 13,000+ personnel. Tests combined forcible entry operations with beach assaults, air assaults, and naval gunfire support.

```python
SSANG_YONG = Scenario(
    name="Exercise Ssang Yong",
    description="Ssang Yong 26 — US-ROK combined amphibious exercise, Pohang, South Korea",
    start_time=datetime(2026, 8, 25, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 9, 7, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # BLT from III MEF
        "3/4", "A Co 3/4", "B Co 3/4", "C Co 3/4",
        # 31st MEU
        "31st MEU",
        # Artillery
        "3/12",
        # Aviation
        "VMM-265", "HMLA-369",
        # Logistics
        "CLB-31", "CLR-37",
        # Recon
        "3rd Recon Bn",
        # 3rd ANGLICO
        "3rd ANGLICO",
    ],
    location="Pohang, Gyeongsangbuk-Do, South Korea",
    ao=AO_KOREA,
    op_tempo="HIGH",
    phases=[
        Phase("Force Staging / Embark", day_range=(1, 2), tempo="MEDIUM"),
        Phase("At-Sea Period", day_range=(3, 4), tempo="MEDIUM"),
        Phase("Combined Amphibious Assault", day_range=(5, 8), tempo="HIGH"),
        Phase("Exploitation Ashore", day_range=(9, 11), tempo="HIGH"),
        Phase("Backload / AAR", day_range=(12, 14), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_KOREA = {
    "center": (36.0190, 129.3435),
    "radius_km": 30,
    "key_locations": {
        "POHANG_BEACH": (36.0190, 129.3435),
        "POHANG_AIRFIELD": (35.9878, 129.4203),
        "DOKSEOK_BEACH": (36.0800, 129.4200),
        "ASSEMBLY_AREA_NORTH": (36.1200, 129.3000),
        "ASSEMBLY_AREA_SOUTH": (35.9500, 129.3500),
        "OBJECTIVE_ALPHA": (36.0500, 129.3800),
        "OBJECTIVE_BRAVO": (36.1000, 129.4000),
        "AT_SEA_STAGING": (35.8000, 129.5000),
    }
}
```

### 8. `kamandag` — US-Philippines Maritime Exercise

Focused on maritime security, counter-terrorism, and humanitarian assistance in the Philippines. Follows Balikatan in the annual exercise calendar.

```python
KAMANDAG = Scenario(
    name="Exercise KAMANDAG",
    description="KAMANDAG 9 — US-Philippines maritime security exercise",
    start_time=datetime(2026, 10, 5, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 10, 16, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 3rd MLR forward-deployed
        "3rd MLR", "3rd LCT", "3rd LLB",
        # 31st MEU elements
        "31st MEU",
        # Aviation
        "VMM-262",
        # Logistics
        "CLB-3",
    ],
    location="Luzon, Palawan — Philippines",
    ao=AO_PHILIPPINES,  # Reuse Balikatan AO
    op_tempo="MEDIUM",
    phases=[
        Phase("Opening / HADR Planning", day_range=(1, 2), tempo="LOW"),
        Phase("Amphibious Operations", day_range=(3, 5), tempo="HIGH"),
        Phase("Maritime Security Ops", day_range=(6, 8), tempo="MEDIUM"),
        Phase("HADR Execution", day_range=(9, 10), tempo="MEDIUM"),
        Phase("Closing / AAR", day_range=(11, 12), tempo="LOW"),
    ],
)
```

### 9. `valiant_shield` — Joint Force Exercise, Guam & Marianas

One of the largest US military war games in the Pacific. Joint exercise focused on detecting, tracking, and engaging threats at sea, in the air, and on land. Integrates all services.

```python
VALIANT_SHIELD = Scenario(
    name="Exercise Valiant Shield",
    description="Valiant Shield 26 — Joint multi-domain exercise, Guam & Marianas Islands",
    start_time=datetime(2026, 6, 8, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 6, 20, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # III MEF forward elements
        "3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB",
        "12th MLR", "12th LCT", "12th LAAB", "12th LLB",
        # Aviation
        "MAG-12", "VMFA-242",
        "MAG-36", "VMM-262",
        # Logistics
        "CLB-4", "3rd TSB",
        # III MIG
        "3rd Intel Bn", "3rd Radio Bn",
    ],
    location="Guam, CNMI, Palau, Marianas Island Range Complex",
    ao=AO_MARIANAS,
    op_tempo="HIGH",
    phases=[
        Phase("Force Positioning", day_range=(1, 2), tempo="MEDIUM"),
        Phase("Integrated Fires", day_range=(3, 5), tempo="HIGH"),
        Phase("Anti-Surface Warfare", day_range=(6, 8), tempo="HIGH"),
        Phase("Expeditionary Advanced Base Ops", day_range=(9, 11), tempo="HIGH"),
        Phase("Recovery", day_range=(12, 13), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_MARIANAS = {
    "center": (13.4443, 144.7937),
    "radius_km": 200,
    "key_locations": {
        "NAVAL_BASE_GUAM": (13.4443, 144.7937),
        "ANDERSEN_AFB": (13.5839, 144.9244),
        "TINIAN": (14.9528, 145.6236),
        "SAIPAN": (15.1850, 145.7467),
        "ROTA": (14.1533, 145.2128),
        "PALAU": (7.5150, 134.5825),
        "FIRING_RANGE_NORTH": (13.6500, 144.8500),
        "AT_SEA_LANE_ALPHA": (13.0000, 145.0000),
    }
}
```

### 10. `rimpac` — Rim of the Pacific

The world's largest international maritime exercise. 29 nations, 25,000+ personnel, 40+ ships. Held biennially off Hawaii. Marines participate in amphibious assault, HADR, and live-fire events.

```python
RIMPAC = Scenario(
    name="Exercise RIMPAC",
    description="RIMPAC 26 — Multinational maritime exercise, Hawaii (29 nations)",
    start_time=datetime(2026, 6, 25, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 8, 1, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # I MEF elements (RIMPAC Marine component typically from I MEF)
        "1/1", "A Co 1/1", "B Co 1/1", "C Co 1/1",
        "Wpns Co 1/1", "H&S Co 1/1",
        "1/11",
        # 15th MEU
        "15th MEU",
        # Aviation
        "VMFA-314", "VMM-163", "HMLA-267",
        # Logistics
        "CLB-1", "CLR-1",
        # III MEF elements (from Hawaii)
        "3rd MLR", "3rd LCT",
        # Recon
        "1st Recon Bn",
    ],
    location="Hawaiian Islands, Pacific Missile Range Facility",
    ao=AO_HAWAII,
    op_tempo="MEDIUM",
    phases=[
        Phase("Harbor Phase / Planning", day_range=(1, 7), tempo="LOW"),
        Phase("At-Sea Phase — ASW/AAW", day_range=(8, 14), tempo="MEDIUM"),
        Phase("Amphibious Assault", day_range=(15, 20), tempo="HIGH"),
        Phase("Live Fire / SINKEX", day_range=(21, 28), tempo="HIGH"),
        Phase("HADR Event", day_range=(29, 33), tempo="MEDIUM"),
        Phase("Recovery & Closing", day_range=(34, 38), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_HAWAII = {
    "center": (21.4389, -158.0001),
    "radius_km": 100,
    "key_locations": {
        "PEARL_HARBOR": (21.3469, -157.9742),
        "MCB_HAWAII_KBAY": (21.4389, -157.7481),
        "BELLOWS_BEACH": (21.3581, -157.7108),
        "POHAKULOA_TRAINING_AREA": (19.7500, -155.4167),
        "PMRF_BARKING_SANDS": (22.0742, -159.7856),
        "DILLINGHAM_AIRFIELD": (21.5792, -158.1978),
        "AT_SEA_RIMPAC_BOX": (21.0000, -158.5000),
    }
}
```

---

## Category 3: Europe / NATO Exercises (II MEF / EUCOM)

### 11. `african_lion` — Multinational Exercise, North Africa

US Africa Command's premier joint exercise. Hosted by Morocco with participants from 20+ nations. Marines from II MEF train alongside African and European allies in combined arms, HADR, and peacekeeping scenarios.

```python
AFRICAN_LION = Scenario(
    name="Exercise African Lion",
    description="African Lion 26 — USAFRICOM multinational exercise, Morocco & Senegal",
    start_time=datetime(2026, 5, 15, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 6, 5, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # II MEF elements
        "1/2", "A Co 1/2", "B Co 1/2", "C Co 1/2",
        "Wpns Co 1/2", "H&S Co 1/2",
        # Artillery
        "1/10",
        # Aviation
        "VMM-261", "HMLA-167",
        # Logistics
        "CLB-2", "CLR-2",
        # CEB
        "2nd CEB",
        # Comms
        "8th Comm Bn",
    ],
    location="Agadir, Morocco & Dakar, Senegal",
    ao=AO_MOROCCO,
    op_tempo="MEDIUM",
    phases=[
        Phase("Reception / Staging", day_range=(1, 3), tempo="LOW"),
        Phase("Combined Arms Maneuver", day_range=(4, 8), tempo="HIGH"),
        Phase("Humanitarian Assistance", day_range=(9, 12), tempo="MEDIUM"),
        Phase("Peacekeeping Operations", day_range=(13, 16), tempo="MEDIUM"),
        Phase("Live Fire", day_range=(17, 19), tempo="HIGH"),
        Phase("Recovery", day_range=(20, 22), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_MOROCCO = {
    "center": (30.4278, -9.5981),
    "radius_km": 50,
    "key_locations": {
        "AGADIR": (30.4278, -9.5981),
        "TAN_TAN_AIRFIELD": (28.4481, -11.1614),
        "BEN_GUERIR_AB": (32.0950, -7.9486),
        "TRAINING_AREA_SOUTH": (29.5000, -10.0000),
        "LANDING_BEACH": (30.3500, -9.6500),
        "HADR_VILLAGE": (30.5000, -9.5000),
    }
}
```

### 12. `cold_response` — NATO Arctic Exercise, Norway

Large-scale NATO exercise in northern Norway. Tests cold-weather operations, amphibious landings in arctic conditions, and alliance interoperability. II MEF Marines train in extreme cold.

```python
COLD_RESPONSE = Scenario(
    name="Exercise Cold Response",
    description="Cold Response 26 — NATO arctic exercise, Northern Norway",
    start_time=datetime(2026, 3, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 3, 14, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # II MEF elements
        "2/2", "A Co 2/2", "B Co 2/2", "C Co 2/2",
        "Wpns Co 2/2", "H&S Co 2/2",
        # Artillery
        "2/10",
        # Recon
        "2nd Recon Bn",
        # Aviation
        "VMM-263", "HMLA-269",
        # Logistics
        "CLB-6", "CLR-2",
        # ANGLICO
        "2nd ANGLICO",
        # CEB
        "2nd CEB",
    ],
    location="Troms & Nordland, Northern Norway",
    ao=AO_NORWAY,
    op_tempo="HIGH",
    phases=[
        Phase("Cold Weather Prep & Staging", day_range=(1, 2), tempo="LOW"),
        Phase("Amphibious Landing (Arctic)", day_range=(3, 5), tempo="HIGH"),
        Phase("Advance to Contact", day_range=(6, 8), tempo="HIGH"),
        Phase("Combined Defense", day_range=(9, 11), tempo="HIGH"),
        Phase("Withdrawal & Reembark", day_range=(12, 13), tempo="MEDIUM"),
        Phase("AAR", day_range=(14, 14), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_NORWAY = {
    "center": (68.8000, 16.5400),
    "radius_km": 80,
    "key_locations": {
        "NARVIK": (68.4386, 17.4272),
        "HARSTAD": (68.8000, 16.5400),
        "EVENES_AIRFIELD": (68.4903, 16.6781),
        "SENJA_ISLAND": (69.2000, 17.0000),
        "SORTLAND": (68.6908, 15.4122),
        "LANDING_BEACH_NORTH": (69.0000, 16.0000),
        "MOUNTAIN_PASS_OBJ": (68.6000, 17.2000),
        "LOGISTICS_AREA_HARSTAD": (68.8000, 16.5000),
    }
}
```

---

## Category 4: CENTCOM / SOUTHCOM Exercises

### 13. `unitas` — Multinational Maritime Exercise, South America

The world's longest-running annual multinational maritime exercise. Hosted by Latin American countries, rotating annually. 20+ partner nations. Marines participate in amphibious operations, maritime security, and HADR.

```python
UNITAS = Scenario(
    name="Exercise UNITAS",
    description="UNITAS LXVII — Multinational maritime exercise, Chile (24 partner nations)",
    start_time=datetime(2026, 9, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 9, 12, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # II MEF detachment
        "2/7", "A Co 2/7", "B Co 2/7",
        # Aviation det
        "VMM-264",
        # Logistics
        "CLB-8",
        # 22nd MEU (if deployed to SOUTHCOM AOR)
        "22nd MEU",
    ],
    location="Valparaiso, Chile & Pacific offshore",
    ao=AO_CHILE,
    op_tempo="MEDIUM",
    phases=[
        Phase("In-Port Phase", day_range=(1, 2), tempo="LOW"),
        Phase("At-Sea Phase — ASW", day_range=(3, 5), tempo="MEDIUM"),
        Phase("Amphibious Operations", day_range=(6, 8), tempo="HIGH"),
        Phase("VBSS / MIO", day_range=(9, 10), tempo="MEDIUM"),
        Phase("HADR / SAR", day_range=(11, 11), tempo="MEDIUM"),
        Phase("Closing", day_range=(12, 12), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_CHILE = {
    "center": (-33.0472, -71.6127),
    "radius_km": 50,
    "key_locations": {
        "VALPARAISO_NAVAL_BASE": (-33.0472, -71.6127),
        "CONCON_BEACH": (-32.9333, -71.5167),
        "OFFSHORE_TRAINING_AREA": (-33.2000, -71.8000),
        "QUINTERO_PORT": (-32.7667, -71.5167),
    }
}
```

### 14. `native_fury` — CENTCOM Amphibious Exercise, Middle East

US Central Command exercise focused on amphibious operations in the Middle East region. Tests MEU capability to project power from sea to shore in the CENTCOM AOR.

```python
NATIVE_FURY = Scenario(
    name="Exercise Native Fury",
    description="Native Fury 26 — CENTCOM amphibious exercise, UAE",
    start_time=datetime(2026, 3, 15, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 3, 28, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 26th MEU (deployed)
        "26th MEU",
        # BLT
        "2/6", "A Co 2/6", "B Co 2/6", "C Co 2/6",
        "Wpns Co 2/6", "H&S Co 2/6",
        # Aviation
        "VMM-266", "HMLA-269",
        # Logistics
        "CLB-26",
        # ANGLICO
        "2nd ANGLICO",
    ],
    location="Al Hamra, United Arab Emirates",
    ao=AO_UAE,
    op_tempo="HIGH",
    phases=[
        Phase("At-Sea Staging", day_range=(1, 2), tempo="MEDIUM"),
        Phase("Ship-to-Shore Movement", day_range=(3, 5), tempo="HIGH"),
        Phase("Assault / Objective Seizure", day_range=(6, 8), tempo="HIGH"),
        Phase("Sustainment Ashore", day_range=(9, 11), tempo="MEDIUM"),
        Phase("Backload", day_range=(12, 14), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_UAE = {
    "center": (24.8500, 55.8000),
    "radius_km": 30,
    "key_locations": {
        "AL_HAMRA_TRAINING": (24.8500, 55.8000),
        "RAS_AL_KHAIMAH": (25.7895, 55.9432),
        "OFFSHORE_STAGING": (24.7000, 55.7000),
        "LANDING_BEACH": (24.8200, 55.8200),
        "LOGISTICS_SUPPORT_AREA": (24.9000, 55.9000),
        "OBJECTIVE_FALCON": (24.8800, 55.8500),
    }
}
```

---

## Category 5: Reserve Component Exercises

### 15. `reserve_itx` — Marine Forces Reserve ITX

Reserve component Integrated Training Exercise. Reserve battalions from 4th MarDiv deploy to 29 Palms for their annual active duty training period. Tests reserve unit readiness.

```python
RESERVE_ITX = Scenario(
    name="Marine Forces Reserve ITX",
    description="ITX 3-26 — Reserve component ITX, MCAGCC 29 Palms",
    start_time=datetime(2026, 6, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 6, 19, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 4th MarDiv reserve battalion
        "1/23", "2/23", "3/23",
        # Reserve artillery
        "2/14", "3/14",
        # Reserve LAR
        "4th LAR Bn",
        # Reserve CEB
        "4th CEB",
        # Reserve logistics
        "CLB-451", "CLR-4",
    ],
    location="MCAGCC Twentynine Palms, CA",
    ao=AO_29_PALMS,
    op_tempo="HIGH",
    phases=[
        Phase("Reception & Issue", day_range=(1, 2), tempo="LOW"),
        Phase("Range Package", day_range=(3, 6), tempo="MEDIUM"),
        Phase("MOUT / Urban Ops", day_range=(7, 9), tempo="HIGH"),
        Phase("Force-on-Force", day_range=(10, 14), tempo="HIGH"),
        Phase("Live Fire", day_range=(15, 17), tempo="HIGH"),
        Phase("Recovery / Turn-In", day_range=(18, 19), tempo="LOW"),
    ],
)
```

---

## Category 6: EABO / Littoral Operations

### 16. `island_sentinel` — EABO Scenario, First Island Chain

A standalone EABO scenario showcasing the 3rd Marine Littoral Regiment executing Maritime Key Terrain Security Operations across the First Island Chain. Deploys low-signature formations to multiple islands, establishes expeditionary advanced bases for ISR, fires, and sustainment.

```python
ISLAND_SENTINEL = Scenario(
    name="Island Sentinel",
    description="EABO stand-in force operations across First Island Chain — 3rd MLR",
    start_time=datetime(2026, 7, 1, 6, 0, tzinfo=timezone.utc),
    end_time=datetime(2026, 7, 21, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 3rd MLR (full commitment)
        "3rd MLR", "3rd LCT", "3rd LAAB", "3rd LLB",
        # 12th MLR (supporting)
        "12th MLR", "12th LCT", "12th LAAB", "12th LLB",
        # Recon
        "3rd Recon Bn",
        # Artillery
        "3/12",
        # Aviation
        "VMM-265", "HMLA-369",
        # Logistics (expeditionary)
        "CLB-4", "3rd TSB",
        # Intel / Comms
        "3rd Intel Bn", "3rd Radio Bn", "7th Comm Bn",
    ],
    location="Okinawa, Miyako-jima, Yonaguni, Amami-Oshima — First Island Chain",
    ao=AO_FIRST_ISLAND_CHAIN,
    op_tempo="MEDIUM",
    phases=[
        Phase("Advance Force Ops / ISR", day_range=(1, 3), tempo="LOW"),
        Phase("EAB Establishment — Island Alpha", day_range=(4, 6), tempo="HIGH"),
        Phase("EAB Establishment — Island Bravo", day_range=(7, 9), tempo="HIGH"),
        Phase("Distributed Operations / Fires", day_range=(10, 14), tempo="HIGH"),
        Phase("Relocation & Deception", day_range=(15, 17), tempo="MEDIUM"),
        Phase("Sustainment Under Contested Logistics", day_range=(18, 19), tempo="HIGH"),
        Phase("Withdrawal / Retrograde", day_range=(20, 21), tempo="MEDIUM"),
    ],
)
```

**AO Definition:**
```python
AO_FIRST_ISLAND_CHAIN = {
    "center": (26.3344, 127.7731),
    "radius_km": 500,
    "key_locations": {
        "OKINAWA_MAIN": (26.3344, 127.7731),
        "CAMP_SCHWAB": (26.5292, 127.9375),
        "MIYAKO_JIMA": (24.7833, 125.2833),
        "YONAGUNI": (24.4600, 122.9800),
        "AMAMI_OSHIMA": (28.3769, 129.4936),
        "NAHA_PORT": (26.2167, 127.6700),
        "IE_SHIMA": (26.7167, 127.7833),
        "EAB_ALPHA": (24.8000, 125.3000),      # Miyako area
        "EAB_BRAVO": (24.4500, 123.0000),       # Yonaguni area
        "EAB_CHARLIE": (28.4000, 129.5000),     # Amami area
        "LOGISTICS_NODE_SOUTH": (24.7500, 125.2500),
        "LOGISTICS_NODE_NORTH": (26.3000, 127.8000),
    }
}
```

### 17. `trident_spear` — MEU Crisis Response

A fictional but realistic crisis response scenario. A MEU receives a no-notice tasking to conduct a NEO (Non-combatant Evacuation Operation) followed by security operations. Tests the MEU's ability to respond to a real-world contingency with minimal planning time.

```python
TRIDENT_SPEAR = Scenario(
    name="Trident Spear",
    description="No-notice MEU crisis response — NEO + security operations (13th MEU)",
    start_time=datetime(2026, 8, 10, 2, 0, tzinfo=timezone.utc),  # 0200 — middle of the night alert
    end_time=datetime(2026, 8, 24, 18, 0, tzinfo=timezone.utc),
    participating_units=[
        # 13th MEU
        "13th MEU",
        # BLT
        "1/4", "A Co 1/4", "B Co 1/4", "C Co 1/4",
        "Wpns Co 1/4", "H&S Co 1/4",
        # Artillery
        "3/11",
        # Aviation
        "VMM-161", "HMLA-469", "VMFA-211",
        # Logistics
        "CLB-13",
        # Recon
        "1st Recon Bn",
        # ANGLICO
        "1st ANGLICO",
    ],
    location="Fictional — East African Littoral",
    ao=AO_CRISIS_RESPONSE,
    op_tempo="HIGH",
    phases=[
        Phase("Alert & Planning", day_range=(1, 1), tempo="HIGH"),
        Phase("Transit", day_range=(2, 3), tempo="MEDIUM"),
        Phase("NEO — Embassy Evacuation", day_range=(4, 5), tempo="HIGH"),
        Phase("Perimeter Security Ops", day_range=(6, 9), tempo="HIGH"),
        Phase("Humanitarian Assistance", day_range=(10, 11), tempo="MEDIUM"),
        Phase("Withdrawal to Sea", day_range=(12, 13), tempo="HIGH"),
        Phase("At-Sea Recovery", day_range=(14, 15), tempo="LOW"),
    ],
)
```

**AO Definition:**
```python
AO_CRISIS_RESPONSE = {
    "center": (-6.1659, 39.2026),
    "radius_km": 30,
    "key_locations": {
        "EMBASSY_COMPOUND": (-6.1659, 39.2026),
        "PORT_FACILITY": (-6.1800, 39.1900),
        "AIRFIELD": (-6.2200, 39.2500),
        "RALLY_POINT_ALPHA": (-6.1500, 39.2200),
        "HELICOPTER_LZ_1": (-6.1700, 39.2100),
        "HELICOPTER_LZ_2": (-6.1600, 39.1800),
        "AT_SEA_STAGING": (-6.3000, 39.3000),
        "HADR_SITE": (-6.2000, 39.1500),
    }
}
```

---

## Southern California AO (for Steel Knight)

```python
AO_SOCAL = {
    "center": (33.3500, -117.5000),
    "radius_km": 150,
    "key_locations": {
        "CAMP_PENDLETON_MAIN": (33.3038, -117.3541),
        "CAMP_HORNO": (33.3500, -117.4500),
        "CAMP_SAN_MATEO": (33.2900, -117.3800),
        "SAN_CLEMENTE_ISLAND": (32.9167, -118.4833),
        "29_PALMS_MAIN": (34.2367, -116.0542),
        "CAMP_WILSON": (34.3092, -116.2214),
        "MCAS_MIRAMAR": (32.8681, -117.1431),
        "MCAS_CAMP_PENDLETON": (33.3019, -117.3544),
        "DEL_MAR_BOAT_BASIN": (33.0200, -117.2800),
        "RED_BEACH": (33.2300, -117.4200),
        "WHITE_BEACH": (33.2100, -117.4400),
    }
}
```

## Camp Lejeune Offshore AO (for COMPTUEX)

```python
AO_LEJEUNE_OFFSHORE = {
    "center": (34.5800, -77.3200),
    "radius_km": 100,
    "key_locations": {
        "CAMP_LEJEUNE": (34.6700, -77.3500),
        "ONSLOW_BEACH": (34.5800, -77.3200),
        "CAMP_GEIGER": (34.6567, -77.3872),
        "COURTHOUSE_BAY": (34.6192, -77.3461),
        "AT_SEA_STAGING": (34.3000, -77.0000),
        "CHERRY_POINT": (34.9008, -76.8800),
        "MOREHEAD_CITY_PORT": (34.7231, -76.7264),
        "OBJECTIVE_BEACH_ALPHA": (34.5500, -77.3500),
        "NEO_SITE": (34.6000, -77.2000),
    }
}
```

---

## Scenario Registry

Add all scenarios to a registry so they can be selected by name via the CLI:

```python
SCENARIO_REGISTRY = {
    # Pre-Deployment Training (I MEF / CONUS)
    "steel_guardian":   STEEL_GUARDIAN,
    "itx":             INTEGRATED_TRAINING_EXERCISE,
    "steel_knight":    STEEL_KNIGHT,
    "comptuex":        MEU_COMPTUEX,

    # Indo-Pacific (III MEF / INDOPACOM)
    "cobra_gold":      COBRA_GOLD,
    "balikatan":       BALIKATAN,
    "resolute_dragon": RESOLUTE_DRAGON,
    "ssang_yong":      SSANG_YONG,
    "kamandag":        KAMANDAG,
    "valiant_shield":  VALIANT_SHIELD,
    "rimpac":          RIMPAC,

    # Europe / NATO / Africa (II MEF / EUCOM / AFRICOM)
    "african_lion":    AFRICAN_LION,
    "cold_response":   COLD_RESPONSE,

    # CENTCOM / SOUTHCOM
    "native_fury":     NATIVE_FURY,
    "unitas":          UNITAS,

    # Reserve Component
    "reserve_itx":     RESERVE_ITX,

    # EABO / Littoral Operations
    "island_sentinel": ISLAND_SENTINEL,

    # Crisis Response (fictional)
    "trident_spear":   TRIDENT_SPEAR,

    # Garrison Steady-State
    "iron_forge":      IRON_FORGE,
    "pacific_fury":    PACIFIC_FURY,
}
```

Update the CLI to list all available scenarios grouped by category:

```bash
$ python -m simulator list

Pre-Deployment Training (CONUS):
  steel_guardian    — 1/7 Battalion FEX, 29 Palms                    [14 days, I MEF]
  itx               — 2/5 Battalion ITX, 29 Palms                    [19 days, I MEF]
  steel_knight      — 1st MarDiv Division Exercise, SoCal            [14 days, I MEF]
  comptuex          — 24th MEU Deployment Certification              [14 days, II MEF]

Indo-Pacific:
  cobra_gold        — Multinational FTX, Thailand                    [12 days, III MEF]
  balikatan         — US-Philippines Bilateral, EABO Focus           [19 days, III MEF]
  resolute_dragon   — US-Japan Bilateral, Okinawa/Japan              [14 days, III MEF]
  ssang_yong        — US-ROK Amphibious, Pohang Korea               [14 days, III MEF]
  kamandag          — US-Philippines Maritime Security               [12 days, III MEF]
  valiant_shield    — Joint Multi-Domain, Guam/Marianas              [13 days, III MEF]
  rimpac            — Multinational Maritime, Hawaii (29 nations)    [38 days, I/III MEF]

Europe / NATO / Africa:
  african_lion      — AFRICOM Multinational, Morocco/Senegal         [22 days, II MEF]
  cold_response     — NATO Arctic, Northern Norway                   [14 days, II MEF]

CENTCOM / SOUTHCOM:
  native_fury       — CENTCOM Amphibious, UAE                        [14 days, II MEF]
  unitas            — Multinational Maritime, Chile                  [12 days, II MEF]

Reserve:
  reserve_itx       — MARFORRES ITX, 29 Palms                       [19 days, 4th MarDiv]

EABO / Littoral:
  island_sentinel   — EABO First Island Chain                        [21 days, III MEF]

Crisis Response:
  trident_spear     — No-Notice MEU NEO + Security Ops              [15 days, I MEF]

Garrison:
  iron_forge        — III MEF Steady-State, Okinawa                  [90 days, III MEF]
  pacific_fury      — 26th MEU Pre-Deployment, Camp Lejeune          [135 days, II MEF]

$ python -m simulator run --scenario=balikatan --speed=60
```

---

## Additional Callsigns for New Scenarios

Each new scenario needs callsigns. Add these to the master `CALLSIGNS` dict (or to per-scenario callsign overrides):

```python
# ── ITX (2/5) ─────────────────────────────────
"2/5":          ["GERONIMO-6", "GERONIMO-3", "GERONIMO-S4", "GERONIMO-LOG"],
"A Co 2/5":     ["AZTEC-6", "AZTEC-4", "AZTEC-LOG"],
"B Co 2/5":     ["BANSHEE-6", "BANSHEE-4", "BANSHEE-LOG"],
"C Co 2/5":     ["CAVALIER-6", "CAVALIER-4", "CAVALIER-LOG"],
"Wpns Co 2/5":  ["WRECKING CREW-6", "WRECKING CREW-4"],
"H&S Co 2/5":   ["HEADQUARTERS-6", "HEADQUARTERS-4"],
"CLB-5":        ["PACKRAT-6", "PACKRAT-4", "PACKRAT-DISTRO", "PACKRAT-MAINT"],

# ── Steel Knight (Division-level) ─────────────
"1st MarDiv":   ["BLUE DIAMOND-6", "BLUE DIAMOND-3", "BLUE DIAMOND-LOG"],
"HQBN 1st MarDiv": ["DIAMOND HQ-6", "DIAMOND HQ-4"],
"5th Marines":  ["STONEWALL-6", "STONEWALL-3"],
"1/5":          ["MAKE PEACE-6", "MAKE PEACE-3", "MAKE PEACE-S4", "MAKE PEACE-LOG"],
"A Co 1/5":     ["ALAMO-6", "ALAMO-4", "ALAMO-LOG"],
"B Co 1/5":     ["BUSHMASTER-6", "BUSHMASTER-4", "BUSHMASTER-LOG"],
"C Co 1/5":     ["CORSAIR-6", "CORSAIR-4", "CORSAIR-LOG"],
"3/5":          ["DARKHORSE-6", "DARKHORSE-3", "DARKHORSE-S4", "DARKHORSE-LOG"],
"A Co 3/5":     ["ARROW-6", "ARROW-4", "ARROW-LOG"],
"B Co 3/5":     ["BLACKHEART-6", "BLACKHEART-4", "BLACKHEART-LOG"],
"C Co 3/5":     ["CUTLASS-6", "CUTLASS-4", "CUTLASS-LOG"],
"2/7":          ["WAR DOG-6", "WAR DOG-3", "WAR DOG-S4", "WAR DOG-LOG"],
"A Co 2/7":     ["ANIMAL-6", "ANIMAL-4", "ANIMAL-LOG"],
"B Co 2/7":     ["BASTARD-6", "BASTARD-4", "BASTARD-LOG"],
"C Co 2/7":     ["CHOSIN-6", "CHOSIN-4", "CHOSIN-LOG"],
"11th Marines": ["CANNON KING-6", "CANNON KING-3"],
"3/11":         ["BATTLEMENT-6", "BATTLEMENT-FDC", "BATTLEMENT-LOG"],
"1st LAR Bn":   ["WOLFPACK-6", "WOLFPACK-3", "WOLFPACK-LOG"],
"CLB-11":       ["SUPPLY CHAIN-6", "SUPPLY CHAIN-4", "SUPPLY CHAIN-DISTRO"],
"1st DSB":      ["DISTRIBUTION-6", "DISTRIBUTION-4"],
"I MIG":        ["CYBER KNIGHT-6", "CYBER KNIGHT-3"],
"9th Comm Bn":  ["NETWORK-6", "NETWORK-3"],
"1st Intel Bn": ["ORACLE-6", "ORACLE-3"],

# ── COMPTUEX (24th MEU / 1/8) ─────────────────
"24th MEU":     ["IROQUOIS-6", "IROQUOIS-3", "IROQUOIS-LOG"],
"1/8":          ["BEIRUT-6", "BEIRUT-3", "BEIRUT-S4", "BEIRUT-LOG"],
"A Co 1/8":     ["ARES-6", "ARES-4", "ARES-LOG"],
"B Co 1/8":     ["BULLDOG-6", "BULLDOG-4", "BULLDOG-LOG"],
"C Co 1/8":     ["CENTURION-6", "CENTURION-4", "CENTURION-LOG"],
"Wpns Co 1/8":  ["WARPATH-6", "WARPATH-4"],
"H&S Co 1/8":   ["HEARTBEAT-6", "HEARTBEAT-4"],
"CLB-24":       ["GRIZZLY-6", "GRIZZLY-4", "GRIZZLY-DISTRO", "GRIZZLY-MAINT"],
"VMM-264":      ["BLACK KNIGHT-OPS", "BLACK KNIGHT-LOG"],
"HMLA-167":     ["WARRIOR-OPS", "WARRIOR-LOG"],
"VMFA-224":     ["BENGAL-OPS", "BENGAL-LOG"],

# ── Cobra Gold ─────────────────────────────────
# (Reuses 3/4, 3rd CEB, etc. callsigns from Iron Forge)

# ── Balikatan & EABO ──────────────────────────
# (Reuses 3rd MLR, 12th MLR callsigns from Iron Forge)

# ── Ssang Yong ─────────────────────────────────
"CLB-31":       ["DRAGON TRAIN-6", "DRAGON TRAIN-4", "DRAGON TRAIN-DISTRO"],
"CLR-37":       ["DRAGON FORGE-6", "DRAGON FORGE-4"],

# ── African Lion (1/2) ────────────────────────
"1/2":          ["TIMBERWOLF-6", "TIMBERWOLF-3", "TIMBERWOLF-S4", "TIMBERWOLF-LOG"],
"A Co 1/2":     ["ALPHA WOLF-6", "ALPHA WOLF-4", "ALPHA WOLF-LOG"],
"B Co 1/2":     ["BRAVO WOLF-6", "BRAVO WOLF-4", "BRAVO WOLF-LOG"],
"C Co 1/2":     ["CHARLIE WOLF-6", "CHARLIE WOLF-4", "CHARLIE WOLF-LOG"],
"Wpns Co 1/2":  ["WOLFHOUND-6", "WOLFHOUND-4"],
"H&S Co 1/2":   ["WOLF DEN-6", "WOLF DEN-4"],
"CLB-2":        ["IRON WOLF-6", "IRON WOLF-4", "IRON WOLF-DISTRO"],

# ── Cold Response (2/2) ──────────────────────
"2/2":          ["VIKING-6", "VIKING-3", "VIKING-S4", "VIKING-LOG"],
"A Co 2/2":     ["FROST-6", "FROST-4", "FROST-LOG"],
"B Co 2/2":     ["BLIZZARD-6", "BLIZZARD-4", "BLIZZARD-LOG"],
"C Co 2/2":     ["COLD STEEL-6", "COLD STEEL-4", "COLD STEEL-LOG"],
"Wpns Co 2/2":  ["WINTER-6", "WINTER-4"],
"H&S Co 2/2":   ["WARMTH-6", "WARMTH-4"],
"CLB-6":        ["ARCTIC TRAIN-6", "ARCTIC TRAIN-4", "ARCTIC TRAIN-DISTRO"],

# ── Native Fury ──────────────────────────────
# (Reuses 26th MEU / 2/6 callsigns from Pacific Fury)

# ── UNITAS (2/7 det) ────────────────────────
# (Reuses 2/7 callsigns from Steel Knight)

# ── Reserve ITX ─────────────────────────────
"1/23":         ["LONE STAR-6", "LONE STAR-3", "LONE STAR-S4"],
"2/23":         ["GATOR-6", "GATOR-3", "GATOR-S4"],
"3/23":         ["BAYOU-6", "BAYOU-3", "BAYOU-S4"],
"2/14":         ["RESERVE THUNDER-6", "RESERVE THUNDER-FDC"],
"3/14":         ["RESERVE STEEL-6", "RESERVE STEEL-FDC"],
"4th LAR Bn":   ["RESERVE WOLF-6", "RESERVE WOLF-3"],
"4th CEB":      ["RESERVE SAPPER-6", "RESERVE SAPPER-4"],
"CLB-451":      ["RESERVE SUPPLY-6", "RESERVE SUPPLY-4", "RESERVE SUPPLY-DISTRO"],
"CLR-4":        ["RESERVE FORGE-6", "RESERVE FORGE-4"],

# ── Trident Spear (13th MEU / 1/4) ─────────
"13th MEU":     ["TRIDENT-6", "TRIDENT-3", "TRIDENT-LOG"],
"1/4":          ["CHINA MARINE-6", "CHINA MARINE-3", "CHINA MARINE-S4", "CHINA MARINE-LOG"],
"A Co 1/4":     ["ANNIHILATOR-6", "ANNIHILATOR-4", "ANNIHILATOR-LOG"],
"B Co 1/4":     ["BRUTE-6", "BRUTE-4", "BRUTE-LOG"],
"C Co 1/4":     ["CHAMPION-6", "CHAMPION-4", "CHAMPION-LOG"],
"Wpns Co 1/4":  ["WARLANCE-6", "WARLANCE-4"],
"H&S Co 1/4":   ["HOME BASE-6", "HOME BASE-4"],
"CLB-13":       ["EAGLE SUPPLY-6", "EAGLE SUPPLY-4", "EAGLE SUPPLY-DISTRO"],
"VMM-161":      ["GREY HAWK-OPS", "GREY HAWK-LOG"],
"HMLA-469":     ["VENGEANCE-OPS", "VENGEANCE-LOG"],
"VMFA-211":     ["WAKE ISLAND-OPS", "WAKE ISLAND-LOG"],
"1st ANGLICO":  ["FIRELINK-6", "FIRELINK-3"],
```

---

## Implementation Notes

1. **Add these scenarios to the existing `simulator/scenario.py`** — don't create a separate file. They all use the same `Scenario` class.
2. **AO definitions go in a new `simulator/areas_of_operation.py`** file (or append to config). They're getting too numerous to keep inline.
3. **Callsigns should be in `simulator/callsigns.py`** — a single master dict that any scenario can reference.
4. **Each scenario must be runnable independently** — `python -m simulator run --scenario=balikatan --speed=60`
5. **Scenarios should be composable** — a user should be able to run multiple scenarios simultaneously to simulate a busy operational period (e.g., Steel Knight + Iron Forge + Balikatan all generating data at once).
6. **Supply templates from the Unit Hierarchy Update Prompt** apply to all new scenarios — no need to redefine them.
7. **mIRC channels for each new scenario** should follow the pattern established in the existing three scenarios. Use unit abbreviations and exercise names in channel names.
8. **Keep existing `steel_guardian`, `pacific_fury`, and `iron_forge`** scenarios intact. These new scenarios supplement them.
