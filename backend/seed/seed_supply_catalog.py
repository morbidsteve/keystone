"""Seed the supply catalog with ~140 USMC supply items across all supply classes.

Covers CL I (Subsistence), CL II (Clothing/Tools), CL III (POL), CL IV (Construction),
CL V (Ammunition cross-refs), CL VI (Personal Demand), CL VII (Major End Items refs),
CL VIII (Medical), CL IX (Repair Parts), and CL X (Non-Standard).

Idempotent — checks NSN before inserting.
"""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog_supply import SupplyCatalogItem

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Seed data — supply items organized by supply class.
# ---------------------------------------------------------------------------

_SUPPLY_CATALOG: list[dict] = [
    # -----------------------------------------------------------------------
    # CL I — Subsistence (~8 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "8970-01-E70-3116",
        "nomenclature": "MEAL, READY-TO-EAT, INDIVIDUAL",
        "common_name": "MRE Case (12)",
        "supply_class": "I",
        "supply_subclass": "CR",
        "unit_of_issue": "CS",
        "category": "Combat Ration",
        "notes": "12 meals/case",
    },
    {
        "nsn": "8970-01-E58-1047",
        "nomenclature": "UNITIZED GROUP RATION – HEAT & SERVE",
        "common_name": "UGR-H&S Module",
        "supply_class": "I",
        "supply_subclass": "GR",
        "unit_of_issue": "MD",
        "category": "Group Ration",
        "notes": "Feeds 50",
    },
    {
        "nsn": "8970-01-E58-1052",
        "nomenclature": "UNITIZED GROUP RATION – A-RATION",
        "common_name": "UGR-A Module",
        "supply_class": "I",
        "supply_subclass": "GR",
        "unit_of_issue": "MD",
        "category": "Group Ration",
        "notes": "Fresh prep, 50 pax",
    },
    {
        "nsn": "8970-01-521-8765",
        "nomenclature": "FIRST STRIKE RATION",
        "common_name": "FSR Pack",
        "supply_class": "I",
        "supply_subclass": "CR",
        "unit_of_issue": "EA",
        "category": "Combat Ration",
        "notes": "1-person/24hr",
    },
    {
        "nsn": "8960-01-456-7890",
        "nomenclature": "WATER, PURIFIED, POTABLE",
        "common_name": "Bottled Water Case",
        "supply_class": "I",
        "supply_subclass": "W",
        "unit_of_issue": "CS",
        "category": "Water",
        "notes": "24 bottles / case",
    },
    {
        "nsn": "8920-01-234-5678",
        "nomenclature": "BEVERAGE BASE, POWDER",
        "common_name": "Drink Mix Case",
        "supply_class": "I",
        "supply_subclass": "BV",
        "unit_of_issue": "CS",
        "category": "Beverage",
        "notes": "Electrolyte/flavor",
    },
    {
        "nsn": "8940-01-345-6789",
        "nomenclature": "BREAD, WHITE, SLICED",
        "common_name": "White Bread (Loaf)",
        "supply_class": "I",
        "supply_subclass": "BK",
        "unit_of_issue": "LF",
        "category": "Bakery",
        "notes": "Field bakery output",
    },
    {
        "nsn": "8945-01-567-8901",
        "nomenclature": "CREAMER, NON-DAIRY, PKT",
        "common_name": "Non-Dairy Creamer",
        "supply_class": "I",
        "supply_subclass": "CD",
        "unit_of_issue": "BX",
        "category": "Condiment",
        "notes": "1000 ct",
    },
    # -----------------------------------------------------------------------
    # CL II — Clothing, Tools, Hand Tools (~13 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "8415-01-630-5529",
        "nomenclature": "COAT, COMBAT, FROG",
        "common_name": "FROG Combat Shirt",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Clothing",
        "notes": "Flame-resistant",
    },
    {
        "nsn": "8415-01-630-5534",
        "nomenclature": "TROUSERS, COMBAT, FROG",
        "common_name": "FROG Combat Pants",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Clothing",
        "notes": "Flame-resistant",
    },
    {
        "nsn": "8430-01-565-2525",
        "nomenclature": "BOOTS, COMBAT, HOT WEATHER",
        "common_name": "Danner RAT Hot",
        "supply_class": "II",
        "unit_of_issue": "PR",
        "category": "Footwear",
    },
    {
        "nsn": "8465-01-580-1303",
        "nomenclature": "PACK, MAIN, FILBE",
        "common_name": "FILBE Main Pack",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Load Bearing",
    },
    {
        "nsn": "8465-01-600-7845",
        "nomenclature": "ASSAULT PACK, FILBE",
        "common_name": "FILBE Assault Pack",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Load Bearing",
    },
    {
        "nsn": "8465-01-547-2587",
        "nomenclature": "PLATE CARRIER, SCALABLE",
        "common_name": "SPC Plate Carrier",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Body Armor",
        "notes": "Gen III",
    },
    {
        "nsn": "8470-01-547-2594",
        "nomenclature": "PLATE, BODY ARMOR, SAPI",
        "common_name": "ESAPI Plate (Med)",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Body Armor",
    },
    {
        "nsn": "5120-01-398-4489",
        "nomenclature": "TOOL KIT, GENERAL MECHANIC",
        "common_name": "GMTK",
        "supply_class": "II",
        "unit_of_issue": "KT",
        "category": "Tools",
    },
    {
        "nsn": "5180-01-456-7891",
        "nomenclature": "TOOL KIT, SUPPLEMENTAL",
        "common_name": "STK",
        "supply_class": "II",
        "unit_of_issue": "KT",
        "category": "Tools",
    },
    {
        "nsn": "5120-01-432-1234",
        "nomenclature": "WRENCH SET, COMBO, SAE/METRIC",
        "common_name": "Wrench Set",
        "supply_class": "II",
        "unit_of_issue": "SE",
        "category": "Tools",
    },
    {
        "nsn": "7520-01-207-4921",
        "nomenclature": "NOTEBOOK, RITE IN THE RAIN",
        "common_name": "Field Notebook",
        "supply_class": "II",
        "unit_of_issue": "DZ",
        "category": "Office",
        "notes": "Weatherproof",
    },
    {
        "nsn": "7530-01-578-1234",
        "nomenclature": "MAP BOARD, ACETATE",
        "common_name": "Acetate Map Board",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Office",
    },
    {
        "nsn": "8340-01-628-8855",
        "nomenclature": "TENT, COMBAT, 2-PERSON",
        "common_name": "Combat Tent 2P",
        "supply_class": "II",
        "unit_of_issue": "EA",
        "category": "Shelter",
        "notes": "Improved",
    },
    # -----------------------------------------------------------------------
    # CL III — POL (~10 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "9130-01-536-8130",
        "nomenclature": "FUEL, AVIATION, TURBINE, JP-8",
        "common_name": "JP-8",
        "supply_class": "III",
        "supply_subclass": "FL",
        "unit_of_issue": "BL",
        "category": "Fuel",
        "is_hazmat": True,
        "notes": "55 gal drum",
    },
    {
        "nsn": "9130-00-160-1818",
        "nomenclature": "FUEL, DIESEL, ULTRA-LOW SULFUR",
        "common_name": "Diesel (ULSD)",
        "supply_class": "III",
        "supply_subclass": "FL",
        "unit_of_issue": "BL",
        "category": "Fuel",
        "is_hazmat": True,
    },
    {
        "nsn": "9130-01-286-5295",
        "nomenclature": "GASOLINE, AUTOMOTIVE, UNLEADED",
        "common_name": "MOGAS",
        "supply_class": "III",
        "supply_subclass": "FL",
        "unit_of_issue": "GL",
        "category": "Fuel",
        "is_hazmat": True,
    },
    {
        "nsn": "9150-01-197-7688",
        "nomenclature": "LUBRICATING OIL, ENGINE, 15W-40",
        "common_name": "Engine Oil 15W-40",
        "supply_class": "III",
        "supply_subclass": "LB",
        "unit_of_issue": "QT",
        "category": "Lubricant",
        "is_hazmat": False,
    },
    {
        "nsn": "9150-01-286-5295",
        "nomenclature": "GREASE, AUTOMOTIVE & ARTILLERY",
        "common_name": "GAA Grease",
        "supply_class": "III",
        "supply_subclass": "LB",
        "unit_of_issue": "TB",
        "category": "Lubricant",
        "is_hazmat": False,
        "notes": "14oz tube",
    },
    {
        "nsn": "9150-01-102-3455",
        "nomenclature": "LUBRICANT, WEAPONS (CLP)",
        "common_name": "CLP",
        "supply_class": "III",
        "supply_subclass": "LB",
        "unit_of_issue": "BT",
        "category": "Lubricant",
        "is_hazmat": False,
        "notes": "4oz bottle",
    },
    {
        "nsn": "9140-00-292-9689",
        "nomenclature": "FUEL, COMPRESSED, TRIOXANE",
        "common_name": "Trioxane Fuel Bar",
        "supply_class": "III",
        "supply_subclass": "FS",
        "unit_of_issue": "BX",
        "category": "Fuel-Solid",
        "is_hazmat": True,
        "notes": "Heat ration",
    },
    {
        "nsn": "9150-01-378-5218",
        "nomenclature": "COOLANT, ANTIFREEZE, EXTENDED",
        "common_name": "Antifreeze ELC",
        "supply_class": "III",
        "supply_subclass": "CL",
        "unit_of_issue": "GL",
        "category": "Coolant",
        "is_hazmat": True,
    },
    {
        "nsn": "9150-01-345-6790",
        "nomenclature": "FLUID, BRAKE, SILICONE",
        "common_name": "Brake Fluid DOT5",
        "supply_class": "III",
        "supply_subclass": "FD",
        "unit_of_issue": "QT",
        "category": "Fluid",
        "is_hazmat": True,
    },
    {
        "nsn": "9130-01-345-6791",
        "nomenclature": "FLUID, HYDRAULIC, MIL-PRF-83282",
        "common_name": "Hydraulic Fluid",
        "supply_class": "III",
        "supply_subclass": "FD",
        "unit_of_issue": "GL",
        "category": "Fluid",
        "is_hazmat": True,
    },
    # -----------------------------------------------------------------------
    # CL IV — Construction (~9 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "5660-01-532-6208",
        "nomenclature": "BARRIER, HESCO BASTION, 4x4",
        "common_name": "HESCO 4x4 Unit",
        "supply_class": "IV",
        "unit_of_issue": "EA",
        "category": "Barrier",
    },
    {
        "nsn": "5660-01-532-6210",
        "nomenclature": "BARRIER, HESCO BASTION, 5x5",
        "common_name": "HESCO 5x5 Unit",
        "supply_class": "IV",
        "unit_of_issue": "EA",
        "category": "Barrier",
    },
    {
        "nsn": "5660-00-262-4505",
        "nomenclature": "WIRE, BARBED, CONCERTINA",
        "common_name": "Concertina Wire",
        "supply_class": "IV",
        "unit_of_issue": "RL",
        "category": "Wire",
    },
    {
        "nsn": "5640-01-456-7892",
        "nomenclature": "SANDBAG, POLYPROPYLENE",
        "common_name": "Sandbag (empty)",
        "supply_class": "IV",
        "unit_of_issue": "BD",
        "category": "Fill",
        "notes": "100/bale",
    },
    {
        "nsn": "5680-01-567-8902",
        "nomenclature": "PICKET, STEEL, T-TYPE",
        "common_name": "T-Post Picket",
        "supply_class": "IV",
        "unit_of_issue": "EA",
        "category": "Fencing",
    },
    {
        "nsn": "5610-01-345-6792",
        "nomenclature": "LUMBER, DIM, 2x4x8 TREATED",
        "common_name": "2x4 Treated",
        "supply_class": "IV",
        "unit_of_issue": "EA",
        "category": "Lumber",
    },
    {
        "nsn": "5610-01-456-7893",
        "nomenclature": 'PLYWOOD, CDX, 4x8, 3/4"',
        "common_name": "CDX Plywood Sheet",
        "supply_class": "IV",
        "unit_of_issue": "SH",
        "category": "Panel",
    },
    {
        "nsn": "5640-01-678-9012",
        "nomenclature": "FILL MATERIAL, AGGREGATE",
        "common_name": "Crushed Rock/yd3",
        "supply_class": "IV",
        "unit_of_issue": "CY",
        "category": "Fill",
    },
    {
        "nsn": "5680-01-789-0123",
        "nomenclature": "CAMOUFLAGE NETTING SYSTEM",
        "common_name": "LCSS Camo Net",
        "supply_class": "IV",
        "unit_of_issue": "SE",
        "category": "Concealment",
    },
    # -----------------------------------------------------------------------
    # CL V — Ammunition (cross-refs to ammunition catalog, ~5 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "1305-01-580-7334",
        "dodic": "A059",
        "nomenclature": "CTG, 5.56MM, BALL, M855A1",
        "common_name": "5.56mm Ball EPR",
        "supply_class": "V",
        "unit_of_issue": "HD",
        "category": "Small Arms",
        "is_controlled": True,
    },
    {
        "nsn": "1305-01-463-8534",
        "dodic": "A075",
        "nomenclature": "CTG, 5.56MM, TRACER, M856A1",
        "common_name": "5.56mm Tracer",
        "supply_class": "V",
        "unit_of_issue": "HD",
        "category": "Small Arms",
        "is_controlled": True,
    },
    {
        "nsn": "1305-01-536-8131",
        "dodic": "A131",
        "nomenclature": "CTG, 7.62MM, BALL, M80A1",
        "common_name": "7.62mm Ball EPR",
        "supply_class": "V",
        "unit_of_issue": "HD",
        "category": "Small Arms",
        "is_controlled": True,
    },
    {
        "nsn": "1305-00-922-5618",
        "dodic": "A557",
        "nomenclature": "CTG, .50 CAL, BALL, M33",
        "common_name": ".50 Cal Ball",
        "supply_class": "V",
        "unit_of_issue": "HD",
        "category": "Small Arms",
        "is_controlled": True,
    },
    {
        "nsn": "1310-01-567-8903",
        "dodic": "B519",
        "nomenclature": "GRENADE, HAND, FRAG, M67",
        "common_name": "M67 Frag",
        "supply_class": "V",
        "unit_of_issue": "EA",
        "category": "Grenade",
        "is_controlled": True,
    },
    # -----------------------------------------------------------------------
    # CL VI — Personal Demand (~3 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "8950-01-456-7898",
        "nomenclature": "SUNDRY PACK, UNIT",
        "common_name": "Sundry Pack",
        "supply_class": "VI",
        "unit_of_issue": "PK",
        "category": "Personal Demand",
    },
    {
        "nsn": "8520-01-567-8908",
        "nomenclature": "SOAP, BODY, INDIVIDUAL",
        "common_name": "Body Wash Packet",
        "supply_class": "VI",
        "unit_of_issue": "BX",
        "category": "Personal Demand",
    },
    {
        "nsn": "8530-01-678-9017",
        "nomenclature": "TOWEL, BATH, OLIVE DRAB",
        "common_name": "OD Bath Towel",
        "supply_class": "VI",
        "unit_of_issue": "EA",
        "category": "Personal Demand",
    },
    # -----------------------------------------------------------------------
    # CL VII — Major End Items (reference only, ~3 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "2320-01-535-3885",
        "nomenclature": "TRUCK, UTILITY, JLTV M1280A1",
        "common_name": "JLTV (ref)",
        "supply_class": "VII",
        "unit_of_issue": "EA",
        "category": "Major End Item",
    },
    {
        "nsn": "2350-01-585-3846",
        "nomenclature": "VEHICLE, AMPHIBIOUS COMBAT, ACV",
        "common_name": "ACV (ref)",
        "supply_class": "VII",
        "unit_of_issue": "EA",
        "category": "Major End Item",
    },
    {
        "nsn": "1005-01-592-7891",
        "nomenclature": "RIFLE, 5.56MM, M27 IAR",
        "common_name": "M27 IAR (ref)",
        "supply_class": "VII",
        "unit_of_issue": "EA",
        "category": "Major End Item",
    },
    # -----------------------------------------------------------------------
    # CL VIII — Medical (~15 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "6545-01-586-7693",
        "nomenclature": "BAG, COMBAT LIFESAVER (CLS)",
        "common_name": "CLS Bag (stocked)",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Kit",
    },
    {
        "nsn": "6545-01-532-4962",
        "nomenclature": "KIT, INDIVIDUAL FIRST AID (IFAK)",
        "common_name": "IFAK Gen II",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Kit",
    },
    {
        "nsn": "6515-01-521-7976",
        "nomenclature": "TOURNIQUET, COMBAT APPLICATION",
        "common_name": "CAT Gen 7",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Hemostatic",
    },
    {
        "nsn": "6510-01-562-3325",
        "nomenclature": "BANDAGE, ELASTIC (ISRAELI)",
        "common_name": "Israeli Bandage 6\"",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Bandage",
    },
    {
        "nsn": "6510-01-578-4530",
        "nomenclature": "GAUZE, HEMOSTATIC, COMBAT",
        "common_name": "Combat Gauze Z-fold",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Hemostatic",
        "notes": "QuikClot",
    },
    {
        "nsn": "6515-01-589-1234",
        "nomenclature": "NEEDLE, DECOMPRESSION, 14GA",
        "common_name": "ARS Needle 14ga",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Airway",
    },
    {
        "nsn": "6505-01-345-6793",
        "nomenclature": "TABLET, MOXIFLOXACIN 400MG",
        "common_name": "Moxi (Combat Pill Pack)",
        "supply_class": "VIII",
        "unit_of_issue": "PG",
        "category": "Antibiotic",
        "is_controlled": True,
    },
    {
        "nsn": "6505-01-456-7894",
        "nomenclature": "ACETAMINOPHEN, 500MG TABS",
        "common_name": "Tylenol 500mg",
        "supply_class": "VIII",
        "unit_of_issue": "BT",
        "category": "Analgesic",
        "notes": "100/bottle",
    },
    {
        "nsn": "6532-01-567-8904",
        "nomenclature": "LITTER, PATIENT, POLELESS",
        "common_name": "Talon II Litter",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Evacuation",
    },
    {
        "nsn": "6545-01-678-9013",
        "nomenclature": "CHEST SEAL, VENTED (HYFIN)",
        "common_name": "HyFin Chest Seal",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Hemostatic",
        "notes": "Twin-pack",
    },
    {
        "nsn": "6530-01-789-0124",
        "nomenclature": "SPLINT, SAM",
        "common_name": "SAM Splint",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Immobilization",
    },
    {
        "nsn": "6515-01-890-1235",
        "nomenclature": "IV START KIT, 18GA",
        "common_name": "IV Start Kit",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "IV Therapy",
        "notes": "Saline lock",
    },
    {
        "nsn": "6505-01-901-2346",
        "nomenclature": "EPINEPHRINE AUTO-INJECTOR",
        "common_name": "EpiPen",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Emergency",
    },
    {
        "nsn": "6532-01-012-3457",
        "nomenclature": "BAG, BODY, HUMAN REMAINS",
        "common_name": "HR Pouch",
        "supply_class": "VIII",
        "unit_of_issue": "EA",
        "category": "Mortuary",
    },
    {
        "nsn": "6545-01-123-4568",
        "nomenclature": "KIT, SURGICAL, FIELD",
        "common_name": "FST Surgical Kit",
        "supply_class": "VIII",
        "unit_of_issue": "KT",
        "category": "Surgical",
    },
    # -----------------------------------------------------------------------
    # CL IX — Repair Parts (~15 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "2530-01-576-4020",
        "nomenclature": "TIRE, PNEUMATIC, JLTV",
        "common_name": "JLTV Tire 37\"",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Tire",
    },
    {
        "nsn": "2530-01-512-3340",
        "nomenclature": "TIRE, PNEUMATIC, MTVR",
        "common_name": "MTVR Tire 16.00R20",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Tire",
    },
    {
        "nsn": "2940-01-456-7895",
        "nomenclature": "FILTER, OIL, ENGINE",
        "common_name": "Oil Filter (HMMWV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Filter",
    },
    {
        "nsn": "2940-01-567-8905",
        "nomenclature": "FILTER, FUEL",
        "common_name": "Fuel Filter (MTVR)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Filter",
    },
    {
        "nsn": "2940-01-678-9014",
        "nomenclature": "FILTER, AIR, ENGINE",
        "common_name": "Air Filter (JLTV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Filter",
    },
    {
        "nsn": "2920-01-789-0125",
        "nomenclature": "ALTERNATOR, 28V, 200A",
        "common_name": "Alternator (HMMWV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Electrical",
    },
    {
        "nsn": "2920-01-890-1236",
        "nomenclature": "STARTER, ENGINE, 24V",
        "common_name": "Starter Motor (MTVR)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Electrical",
    },
    {
        "nsn": "2520-01-901-2347",
        "nomenclature": "PAD, BRAKE, FRONT",
        "common_name": "Brake Pad Set (JLTV)",
        "supply_class": "IX",
        "unit_of_issue": "SE",
        "category": "Brake",
    },
    {
        "nsn": "2990-01-012-3458",
        "nomenclature": "BELT, SERPENTINE",
        "common_name": "Drive Belt (HMMWV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Drive Train",
    },
    {
        "nsn": "5945-01-123-4569",
        "nomenclature": "FUSE, AUTOMOTIVE, ASSORTED",
        "common_name": "Fuse Kit (Assorted)",
        "supply_class": "IX",
        "unit_of_issue": "KT",
        "category": "Electrical",
    },
    {
        "nsn": "2910-01-234-5679",
        "nomenclature": "INJECTOR, FUEL",
        "common_name": "Fuel Injector (MTVR)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Fuel System",
    },
    {
        "nsn": "2590-01-345-6794",
        "nomenclature": "LIGHT, MARKER, BLACKOUT",
        "common_name": "Blackout Marker Light",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Lighting",
    },
    {
        "nsn": "4820-01-456-7896",
        "nomenclature": "VALVE, CONTROL, CTIS",
        "common_name": "CTIS Valve (MTVR)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Tire Inflation",
    },
    {
        "nsn": "2520-01-567-8906",
        "nomenclature": "CV JOINT, HALF SHAFT",
        "common_name": "CV Joint (JLTV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Drive Train",
    },
    {
        "nsn": "2530-01-678-9015",
        "nomenclature": "WHEEL, RUN-FLAT INSERT",
        "common_name": "Run-Flat (HMMWV)",
        "supply_class": "IX",
        "unit_of_issue": "EA",
        "category": "Tire",
    },
    # -----------------------------------------------------------------------
    # CL X — Non-Standard (~8 items)
    # -----------------------------------------------------------------------
    {
        "nsn": "3830-01-456-7897",
        "nomenclature": "BOAT, INFLATABLE, CRRC",
        "common_name": "CRRC 7-Man",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Watercraft",
    },
    {
        "nsn": "3825-01-567-8907",
        "nomenclature": "ANCHOR, LIGHTWEIGHT, 35LB",
        "common_name": "Danforth Anchor",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Watercraft",
    },
    {
        "nsn": "6625-01-678-9016",
        "nomenclature": "THEODOLITE, SURVEYING",
        "common_name": "Engineer Surveying Theodolite",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Survey",
    },
    {
        "nsn": "3740-01-789-0126",
        "nomenclature": "ROLLER, MINE, TOWED",
        "common_name": "Mine Roller System",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Mine Counter",
    },
    {
        "nsn": "3750-01-890-1237",
        "nomenclature": "CHARGE, DEMOLITION, M183",
        "common_name": "Satchel Charge",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Demolition",
        "is_controlled": True,
    },
    {
        "nsn": "3750-01-901-2348",
        "nomenclature": "DET CORD, M456",
        "common_name": "Det Cord 100ft",
        "supply_class": "X",
        "unit_of_issue": "RL",
        "category": "Demolition",
        "is_controlled": True,
    },
    {
        "nsn": "5985-01-012-3459",
        "nomenclature": "ANTENNA, BROADBAND, OE-254",
        "common_name": "OE-254 Antenna",
        "supply_class": "X",
        "unit_of_issue": "EA",
        "category": "Comms",
    },
    {
        "nsn": "1095-01-123-4570",
        "nomenclature": "STAKES, CONCERTINA INSTALL",
        "common_name": "Wire Installation Stakes",
        "supply_class": "X",
        "unit_of_issue": "BD",
        "category": "Barrier",
    },
]


async def seed_supply_catalog(db: AsyncSession) -> int:
    """Seed supply catalog. Returns count of items inserted.

    Idempotent — checks NSN before inserting each item.
    """
    inserted = 0

    for item_data in _SUPPLY_CATALOG:
        nsn = item_data.get("nsn")
        if nsn:
            result = await db.execute(
                select(SupplyCatalogItem).where(SupplyCatalogItem.nsn == nsn)
            )
            if result.scalar_one_or_none():
                continue

        record = SupplyCatalogItem(**item_data)
        db.add(record)
        inserted += 1

    if inserted:
        await db.flush()

    return inserted
