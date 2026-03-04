"""Areas of Operation (AO) definitions for all simulator scenarios.

Each AO defines a geographic center, radius, and key named locations used for
unit positioning, convoy routing, and phase-based movement during simulation.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# CONUS Training Areas
# ---------------------------------------------------------------------------

AO_29_PALMS: dict[str, object] = {
    "center": (34.2367, -116.0542),
    "radius_km": 30,
    "key_locations": {
        "CAMP_WILSON": (34.3092, -116.2214),
        "MAIN_GATE": (34.2367, -116.0542),
        "COYOTE_NORTH": (34.3500, -116.1500),
        "COYOTE_SOUTH": (34.2800, -116.1800),
        "RANGE_400": (34.2000, -116.2500),
        "RANGE_410": (34.2200, -116.3000),
        "MSR_RAPTOR": (34.2800, -116.2000),
        "COMBAT_CENTER": (34.2367, -116.0542),
    },
    # Legacy flat keys for backward compatibility
    "main_base": (34.2367, -116.0560),
    "camp_wilson": (34.2100, -116.1330),
    "fob_alpha": (34.2950, -116.0200),
    "fob_bravo": (34.1800, -116.1700),
    "supply_point_1": (34.2500, -116.0900),
    "lz_eagle": (34.2700, -116.0400),
    "checkpoint_1": (34.2200, -116.0700),
    "checkpoint_2": (34.2600, -116.1100),
    "range_400": (34.3000, -116.0000),
    "combat_town": (34.2150, -116.1250),
}

AO_SOCAL: dict[str, object] = {
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
    },
}

# ---------------------------------------------------------------------------
# East Coast
# ---------------------------------------------------------------------------

AO_LEJEUNE: dict[str, object] = {
    "center": (34.6700, -77.3500),
    "radius_km": 15,
    "mainside": (34.6700, -77.3500),
    "camp_geiger": (34.6567, -77.3872),
    "courthouse_bay": (34.6192, -77.3461),
    "onslow_beach": (34.5800, -77.3200),
    "mile_hammock_bay": (34.5900, -77.3400),
    "camp_johnson": (34.7000, -77.4200),
    "stone_bay": (34.6100, -77.3300),
}

AO_LEJEUNE_OFFSHORE: dict[str, object] = {
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
    },
}

# ---------------------------------------------------------------------------
# Okinawa / Japan
# ---------------------------------------------------------------------------

AO_OKINAWA: dict[str, object] = {
    "center": (26.3344, 127.7731),
    "radius_km": 25,
    "camp_foster": (26.3344, 127.7731),
    "camp_hansen": (26.4494, 127.7686),
    "camp_schwab": (26.5292, 127.9375),
    "camp_kinser": (26.3014, 127.7222),
    "mcas_futenma": (26.2742, 127.7564),
    "kadena_ab": (26.3517, 127.7681),
    "white_beach": (26.3306, 127.8817),
    "naha_port": (26.2167, 127.6700),
    "northern_training_area": (26.5800, 128.0500),
}

AO_JAPAN: dict[str, object] = {
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
    },
}

AO_FIRST_ISLAND_CHAIN: dict[str, object] = {
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
        "EAB_ALPHA": (24.8000, 125.3000),
        "EAB_BRAVO": (24.4500, 123.0000),
        "EAB_CHARLIE": (28.4000, 129.5000),
        "LOGISTICS_NODE_SOUTH": (24.7500, 125.2500),
        "LOGISTICS_NODE_NORTH": (26.3000, 127.8000),
    },
}

# ---------------------------------------------------------------------------
# Indo-Pacific
# ---------------------------------------------------------------------------

AO_THAILAND: dict[str, object] = {
    "center": (12.6833, 100.8833),
    "radius_km": 40,
    "key_locations": {
        "SATTAHIP_NAVAL_BASE": (12.6833, 100.8833),
        "UTAPAO_AIRFIELD": (12.6797, 101.0050),
        "RAYONG_TRAINING_AREA": (12.7000, 101.2500),
        "CAMP_AKATOSROT": (12.7500, 101.1000),
        "LANDING_BEACH_ALPHA": (12.5500, 100.9200),
        "HA_DR_SITE": (12.8000, 101.0000),
    },
}

AO_PHILIPPINES: dict[str, object] = {
    "center": (18.2000, 121.9000),
    "radius_km": 300,
    "key_locations": {
        "FORT_MAGSAYSAY": (15.4667, 121.0833),
        "CROW_VALLEY": (15.2500, 120.5833),
        "BATAN_ISLAND": (20.4500, 121.9700),
        "ITBAYAT_ISLAND": (20.7900, 121.8400),
        "MAVULIS_ISLAND": (21.0600, 121.9600),
        "LAOAG_AIRFIELD": (18.1781, 120.5314),
        "PALAWAN": (9.8500, 118.7386),
        "SUBIC_BAY": (14.7944, 120.2833),
        "CAMP_AGUINALDO": (14.5500, 121.0500),
    },
}

AO_KOREA: dict[str, object] = {
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
    },
}

AO_MARIANAS: dict[str, object] = {
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
    },
}

AO_HAWAII: dict[str, object] = {
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
    },
}

# ---------------------------------------------------------------------------
# Africa / Europe / Middle East
# ---------------------------------------------------------------------------

AO_MOROCCO: dict[str, object] = {
    "center": (30.4278, -9.5981),
    "radius_km": 50,
    "key_locations": {
        "AGADIR": (30.4278, -9.5981),
        "TAN_TAN_AIRFIELD": (28.4481, -11.1614),
        "BEN_GUERIR_AB": (32.0950, -7.9486),
        "TRAINING_AREA_SOUTH": (29.5000, -10.0000),
        "LANDING_BEACH": (30.3500, -9.6500),
        "HADR_VILLAGE": (30.5000, -9.5000),
    },
}

AO_NORWAY: dict[str, object] = {
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
    },
}

AO_UAE: dict[str, object] = {
    "center": (24.8500, 55.8000),
    "radius_km": 30,
    "key_locations": {
        "AL_HAMRA_TRAINING": (24.8500, 55.8000),
        "RAS_AL_KHAIMAH": (25.7895, 55.9432),
        "OFFSHORE_STAGING": (24.7000, 55.7000),
        "LANDING_BEACH": (24.8200, 55.8200),
        "LOGISTICS_SUPPORT_AREA": (24.9000, 55.9000),
        "OBJECTIVE_FALCON": (24.8800, 55.8500),
    },
}

# ---------------------------------------------------------------------------
# South America
# ---------------------------------------------------------------------------

AO_CHILE: dict[str, object] = {
    "center": (-33.0472, -71.6127),
    "radius_km": 50,
    "key_locations": {
        "VALPARAISO_NAVAL_BASE": (-33.0472, -71.6127),
        "CONCON_BEACH": (-32.9333, -71.5167),
        "OFFSHORE_TRAINING_AREA": (-33.2000, -71.8000),
        "QUINTERO_PORT": (-32.7667, -71.5167),
    },
}

# ---------------------------------------------------------------------------
# Crisis Response / Generic
# ---------------------------------------------------------------------------

AO_CRISIS_RESPONSE: dict[str, object] = {
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
    },
}

# ---------------------------------------------------------------------------
# Scenario-to-AO mapping
# ---------------------------------------------------------------------------

SCENARIO_AO: dict[str, dict] = {
    "steel_guardian": AO_29_PALMS,
    "pacific_fury": AO_LEJEUNE,
    "iron_forge": AO_OKINAWA,
    "itx": AO_29_PALMS,
    "steel_knight": AO_SOCAL,
    "comptuex": AO_LEJEUNE_OFFSHORE,
    "cobra_gold": AO_THAILAND,
    "balikatan": AO_PHILIPPINES,
    "resolute_dragon": AO_JAPAN,
    "ssang_yong": AO_KOREA,
    "kamandag": AO_PHILIPPINES,
    "valiant_shield": AO_MARIANAS,
    "rimpac": AO_HAWAII,
    "african_lion": AO_MOROCCO,
    "cold_response": AO_NORWAY,
    "native_fury": AO_UAE,
    "unitas": AO_CHILE,
    "reserve_itx": AO_29_PALMS,
    "island_sentinel": AO_FIRST_ISLAND_CHAIN,
    "trident_spear": AO_CRISIS_RESPONSE,
}
