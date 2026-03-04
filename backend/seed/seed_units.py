"""Seed the USMC unit hierarchy for KEYSTONE.

Comprehensive active-duty Marine Corps organizational structure from
Headquarters Marine Corps down to battalion level (with companies for
infantry battalions). Includes all three MEFs, MARFORRES, and MARSOC.

Sources: Official USMC websites, Marines.mil, public USMC organizational
documents (as of early 2025).

Creates ~400+ unit records covering:
  - Headquarters Marine Corps (HQMC)
  - I MEF  (Camp Pendleton) — 1st MarDiv, 3rd MAW, 1st MLG, I MIG, MEUs
  - II MEF (Camp Lejeune)  — 2nd MarDiv, 2nd MAW, 2nd MLG, II MIG, MEUs
  - III MEF (Okinawa)      — 3rd MarDiv, 1st MAW, 3rd MLG, III MIG, 31st MEU
  - Marine Forces Reserve  — 4th MarDiv, 4th MAW, 4th MLG
  - MARSOC                 — Marine Raider Regiment
  - Supporting Establishment — TECOM, MCICOM, MCRC
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.unit import Echelon, Unit

# Shorthand aliases for readability
_HQMC = Echelon.HQMC
_MEF = Echelon.MEF
_DIV = Echelon.DIV
_WING = Echelon.WING
_GRP = Echelon.GRP
_REGT = Echelon.REGT
_BN = Echelon.BN
_SQDN = Echelon.SQDN
_CO = Echelon.CO


def _infantry_bn_companies(bn_number: int, regt_number: int, uic_prefix: str):
    """Generate standard infantry battalion companies (A-D + W + H&S)."""
    letters = [
        ("Alpha", "A"),
        ("Bravo", "B"),
        ("Charlie", "C"),
        ("Delta", "D"),  # sometimes Weapons instead
    ]
    children = {}
    for i, (name, letter) in enumerate(letters, 1):
        co_name = f"{name} Company {bn_number}/{regt_number}"
        co_abbr = f"{letter} Co {bn_number}/{regt_number}"
        children[co_name] = {
            "abbr": co_abbr,
            "echelon": _CO,
            "uic": f"{uic_prefix}{i}",
        }
    # Weapons Company
    children[f"Weapons Company {bn_number}/{regt_number}"] = {
        "abbr": f"Wpns Co {bn_number}/{regt_number}",
        "echelon": _CO,
        "uic": f"{uic_prefix}5",
    }
    # H&S Company
    children[f"H&S Company {bn_number}/{regt_number}"] = {
        "abbr": f"H&S Co {bn_number}/{regt_number}",
        "echelon": _CO,
        "uic": f"{uic_prefix}6",
    }
    return children


# ──────────────────────────────────────────────────────────────────────
# FULL USMC HIERARCHY
# ──────────────────────────────────────────────────────────────────────

UNIT_HIERARCHY = {
    # ═══════════════════════════════════════════════════════════════════
    # HEADQUARTERS MARINE CORPS
    # ═══════════════════════════════════════════════════════════════════
    "Headquarters Marine Corps": {
        "abbr": "HQMC",
        "echelon": _HQMC,
        "uic": "H00001",
        "children": {},
    },
    # ═══════════════════════════════════════════════════════════════════
    # I MARINE EXPEDITIONARY FORCE — Camp Pendleton, CA
    # ═══════════════════════════════════════════════════════════════════
    "I Marine Expeditionary Force": {
        "abbr": "I MEF",
        "echelon": _MEF,
        "uic": "M10000",
        "children": {
            # ─── 1st Marine Division ──────────────────────────────────
            "1st Marine Division": {
                "abbr": "1st MarDiv",
                "echelon": _DIV,
                "uic": "M11000",
                "children": {
                    "Headquarters Battalion, 1st MarDiv": {
                        "abbr": "HQBN 1st MarDiv",
                        "echelon": _BN,
                        "uic": "M11001",
                    },
                    # 1st Marine Regiment
                    "1st Marine Regiment": {
                        "abbr": "1st Marines",
                        "echelon": _REGT,
                        "uic": "M11100",
                        "children": {
                            "1st Bn 1st Marines": {
                                "abbr": "1/1",
                                "echelon": _BN,
                                "uic": "M11110",
                                "children": _infantry_bn_companies(1, 1, "M1111"),
                            },
                            "2nd Bn 1st Marines": {
                                "abbr": "2/1",
                                "echelon": _BN,
                                "uic": "M11120",
                                "children": _infantry_bn_companies(2, 1, "M1112"),
                            },
                            "3rd Bn 1st Marines": {
                                "abbr": "3/1",
                                "echelon": _BN,
                                "uic": "M11130",
                                "children": _infantry_bn_companies(3, 1, "M1113"),
                            },
                            "1st Bn 4th Marines": {
                                "abbr": "1/4",
                                "echelon": _BN,
                                "uic": "M11140",
                                "children": _infantry_bn_companies(1, 4, "M1114"),
                            },
                        },
                    },
                    # 5th Marine Regiment
                    "5th Marine Regiment": {
                        "abbr": "5th Marines",
                        "echelon": _REGT,
                        "uic": "M11200",
                        "children": {
                            "1st Bn 5th Marines": {
                                "abbr": "1/5",
                                "echelon": _BN,
                                "uic": "M11210",
                                "children": _infantry_bn_companies(1, 5, "M1121"),
                            },
                            "2nd Bn 5th Marines": {
                                "abbr": "2/5",
                                "echelon": _BN,
                                "uic": "M11220",
                                "children": _infantry_bn_companies(2, 5, "M1122"),
                            },
                            "3rd Bn 5th Marines": {
                                "abbr": "3/5",
                                "echelon": _BN,
                                "uic": "M11230",
                                "children": _infantry_bn_companies(3, 5, "M1123"),
                            },
                            "2nd Bn 4th Marines": {
                                "abbr": "2/4",
                                "echelon": _BN,
                                "uic": "M11240",
                                "children": _infantry_bn_companies(2, 4, "M1124"),
                            },
                        },
                    },
                    # 7th Marine Regiment
                    "7th Marine Regiment": {
                        "abbr": "7th Marines",
                        "echelon": _REGT,
                        "uic": "M11300",
                        "children": {
                            "1st Bn 7th Marines": {
                                "abbr": "1/7",
                                "echelon": _BN,
                                "uic": "M11310",
                                "children": _infantry_bn_companies(1, 7, "M1131"),
                            },
                            "2nd Bn 7th Marines": {
                                "abbr": "2/7",
                                "echelon": _BN,
                                "uic": "M11320",
                                "children": _infantry_bn_companies(2, 7, "M1132"),
                            },
                            "3rd Bn 7th Marines": {
                                "abbr": "3/7",
                                "echelon": _BN,
                                "uic": "M11330",
                                "children": _infantry_bn_companies(3, 7, "M1133"),
                            },
                        },
                    },
                    # 11th Marine Regiment (Artillery)
                    "11th Marine Regiment": {
                        "abbr": "11th Marines",
                        "echelon": _REGT,
                        "uic": "M11400",
                        "children": {
                            "1st Bn 11th Marines": {
                                "abbr": "1/11",
                                "echelon": _BN,
                                "uic": "M11410",
                            },
                            "2nd Bn 11th Marines": {
                                "abbr": "2/11",
                                "echelon": _BN,
                                "uic": "M11420",
                            },
                            "3rd Bn 11th Marines": {
                                "abbr": "3/11",
                                "echelon": _BN,
                                "uic": "M11430",
                            },
                        },
                    },
                    # Separate Battalions under 1st MarDiv
                    "1st Reconnaissance Battalion": {
                        "abbr": "1st Recon Bn",
                        "echelon": _BN,
                        "uic": "M11510",
                    },
                    "1st Light Armored Reconnaissance Battalion": {
                        "abbr": "1st LAR Bn",
                        "echelon": _BN,
                        "uic": "M11520",
                    },
                    "3rd Light Armored Reconnaissance Battalion": {
                        "abbr": "3rd LAR Bn",
                        "echelon": _BN,
                        "uic": "M11530",
                    },
                    "1st Combat Engineer Battalion": {
                        "abbr": "1st CEB",
                        "echelon": _BN,
                        "uic": "M11540",
                    },
                    "3rd Assault Amphibian Battalion": {
                        "abbr": "3rd AABn",
                        "echelon": _BN,
                        "uic": "M11550",
                    },
                    "1st Tank Battalion": {
                        "abbr": "1st Tanks",
                        "echelon": _BN,
                        "uic": "M11560",
                    },
                },
            },
            # ─── 3rd Marine Aircraft Wing ─────────────────────────────
            "3rd Marine Aircraft Wing": {
                "abbr": "3rd MAW",
                "echelon": _WING,
                "uic": "M12000",
                "children": {
                    "Marine Wing Headquarters Squadron 3": {
                        "abbr": "MWHS-3",
                        "echelon": _SQDN,
                        "uic": "M12001",
                    },
                    "Marine Aircraft Group 11": {
                        "abbr": "MAG-11",
                        "echelon": _GRP,
                        "uic": "M12100",
                        "children": {
                            "VMFA-211": {
                                "abbr": "VMFA-211",
                                "echelon": _SQDN,
                                "uic": "M12111",
                            },
                            "VMFA-225": {
                                "abbr": "VMFA-225",
                                "echelon": _SQDN,
                                "uic": "M12112",
                            },
                            "VMFA-232": {
                                "abbr": "VMFA-232",
                                "echelon": _SQDN,
                                "uic": "M12113",
                            },
                            "VMFA-314": {
                                "abbr": "VMFA-314",
                                "echelon": _SQDN,
                                "uic": "M12114",
                            },
                            "VMFA-323": {
                                "abbr": "VMFA-323",
                                "echelon": _SQDN,
                                "uic": "M12115",
                            },
                            "VMFAT-101": {
                                "abbr": "VMFAT-101",
                                "echelon": _SQDN,
                                "uic": "M12116",
                            },
                            "VMGR-352": {
                                "abbr": "VMGR-352",
                                "echelon": _SQDN,
                                "uic": "M12117",
                            },
                        },
                    },
                    "Marine Aircraft Group 13": {
                        "abbr": "MAG-13",
                        "echelon": _GRP,
                        "uic": "M12200",
                        "children": {
                            "VMFA-121": {
                                "abbr": "VMFA-121",
                                "echelon": _SQDN,
                                "uic": "M12211",
                            },
                            "VMFA-211 Det": {
                                "abbr": "VMFA-211 Det",
                                "echelon": _SQDN,
                                "uic": "M12212",
                            },
                            "VMFA-311": {
                                "abbr": "VMFA-311",
                                "echelon": _SQDN,
                                "uic": "M12213",
                            },
                            "VMFA-122": {
                                "abbr": "VMFA-122",
                                "echelon": _SQDN,
                                "uic": "M12214",
                            },
                            "VMU-1": {
                                "abbr": "VMU-1",
                                "echelon": _SQDN,
                                "uic": "M12215",
                            },
                        },
                    },
                    "Marine Aircraft Group 16": {
                        "abbr": "MAG-16",
                        "echelon": _GRP,
                        "uic": "M12300",
                        "children": {
                            "VMM-161": {
                                "abbr": "VMM-161",
                                "echelon": _SQDN,
                                "uic": "M12311",
                            },
                            "VMM-163": {
                                "abbr": "VMM-163",
                                "echelon": _SQDN,
                                "uic": "M12312",
                            },
                            "VMM-165": {
                                "abbr": "VMM-165",
                                "echelon": _SQDN,
                                "uic": "M12313",
                            },
                            "VMM-166": {
                                "abbr": "VMM-166",
                                "echelon": _SQDN,
                                "uic": "M12314",
                            },
                            "HMH-361": {
                                "abbr": "HMH-361",
                                "echelon": _SQDN,
                                "uic": "M12315",
                            },
                            "HMH-462": {
                                "abbr": "HMH-462",
                                "echelon": _SQDN,
                                "uic": "M12316",
                            },
                            "HMH-465": {
                                "abbr": "HMH-465",
                                "echelon": _SQDN,
                                "uic": "M12317",
                            },
                            "HMH-466": {
                                "abbr": "HMH-466",
                                "echelon": _SQDN,
                                "uic": "M12318",
                            },
                        },
                    },
                    "Marine Aircraft Group 39": {
                        "abbr": "MAG-39",
                        "echelon": _GRP,
                        "uic": "M12400",
                        "children": {
                            "HMLA-169": {
                                "abbr": "HMLA-169",
                                "echelon": _SQDN,
                                "uic": "M12411",
                            },
                            "HMLA-267": {
                                "abbr": "HMLA-267",
                                "echelon": _SQDN,
                                "uic": "M12412",
                            },
                            "HMLA-367": {
                                "abbr": "HMLA-367",
                                "echelon": _SQDN,
                                "uic": "M12413",
                            },
                            "HMLA-469": {
                                "abbr": "HMLA-469",
                                "echelon": _SQDN,
                                "uic": "M12414",
                            },
                            "VMM-362": {
                                "abbr": "VMM-362",
                                "echelon": _SQDN,
                                "uic": "M12415",
                            },
                            "VMM-364": {
                                "abbr": "VMM-364",
                                "echelon": _SQDN,
                                "uic": "M12416",
                            },
                            "HMLAT-303": {
                                "abbr": "HMLAT-303",
                                "echelon": _SQDN,
                                "uic": "M12417",
                            },
                        },
                    },
                    "Marine Air Control Group 38": {
                        "abbr": "MACG-38",
                        "echelon": _GRP,
                        "uic": "M12500",
                    },
                    "Marine Wing Support Group 37": {
                        "abbr": "MWSG-37",
                        "echelon": _GRP,
                        "uic": "M12600",
                    },
                },
            },
            # ─── 1st Marine Logistics Group ───────────────────────────
            "1st Marine Logistics Group": {
                "abbr": "1st MLG",
                "echelon": _GRP,
                "uic": "M13000",
                "children": {
                    "Headquarters & Service Battalion, 1st MLG": {
                        "abbr": "H&S Bn 1st MLG",
                        "echelon": _BN,
                        "uic": "M13001",
                    },
                    "Combat Logistics Regiment 1": {
                        "abbr": "CLR-1",
                        "echelon": _REGT,
                        "uic": "M13100",
                        "children": {
                            "Combat Logistics Battalion 1": {
                                "abbr": "CLB-1",
                                "echelon": _BN,
                                "uic": "M13110",
                            },
                            "Combat Logistics Battalion 5": {
                                "abbr": "CLB-5",
                                "echelon": _BN,
                                "uic": "M13120",
                            },
                            "Combat Logistics Battalion 7": {
                                "abbr": "CLB-7",
                                "echelon": _BN,
                                "uic": "M13130",
                            },
                            "1st Distribution Support Battalion": {
                                "abbr": "1st DSB",
                                "echelon": _BN,
                                "uic": "M13140",
                            },
                        },
                    },
                    "Combat Logistics Regiment 15": {
                        "abbr": "CLR-15",
                        "echelon": _REGT,
                        "uic": "M13200",
                        "children": {
                            "Combat Logistics Battalion 11": {
                                "abbr": "CLB-11",
                                "echelon": _BN,
                                "uic": "M13210",
                            },
                            "Combat Logistics Battalion 13": {
                                "abbr": "CLB-13",
                                "echelon": _BN,
                                "uic": "M13220",
                            },
                            "Combat Logistics Battalion 15": {
                                "abbr": "CLB-15",
                                "echelon": _BN,
                                "uic": "M13230",
                            },
                        },
                    },
                    "Combat Logistics Regiment 17": {
                        "abbr": "CLR-17",
                        "echelon": _REGT,
                        "uic": "M13300",
                        "children": {
                            "1st Maintenance Battalion": {
                                "abbr": "1st Maint Bn",
                                "echelon": _BN,
                                "uic": "M13310",
                            },
                        },
                    },
                    "7th Engineer Support Battalion": {
                        "abbr": "7th ESB",
                        "echelon": _BN,
                        "uic": "M13410",
                    },
                    "1st Dental Battalion": {
                        "abbr": "1st Dental Bn",
                        "echelon": _BN,
                        "uic": "M13420",
                    },
                },
            },
            # ─── I MEF Information Group ──────────────────────────────
            "I MEF Information Group": {
                "abbr": "I MIG",
                "echelon": _GRP,
                "uic": "M14000",
                "children": {
                    "I MEF Support Battalion": {
                        "abbr": "I MSB",
                        "echelon": _BN,
                        "uic": "M14100",
                    },
                    "1st Intelligence Battalion": {
                        "abbr": "1st Intel Bn",
                        "echelon": _BN,
                        "uic": "M14200",
                    },
                    "1st Radio Battalion": {
                        "abbr": "1st Radio Bn",
                        "echelon": _BN,
                        "uic": "M14300",
                    },
                    "9th Communication Battalion": {
                        "abbr": "9th Comm Bn",
                        "echelon": _BN,
                        "uic": "M14400",
                    },
                    "1st Air Naval Gunfire Liaison Company": {
                        "abbr": "1st ANGLICO",
                        "echelon": _CO,
                        "uic": "M14500",
                    },
                },
            },
            # ─── MEUs under I MEF ─────────────────────────────────────
            "11th Marine Expeditionary Unit": {
                "abbr": "11th MEU",
                "echelon": _GRP,
                "uic": "M15100",
            },
            "13th Marine Expeditionary Unit": {
                "abbr": "13th MEU",
                "echelon": _GRP,
                "uic": "M15200",
            },
            "15th Marine Expeditionary Unit": {
                "abbr": "15th MEU",
                "echelon": _GRP,
                "uic": "M15300",
            },
        },
    },
    # ═══════════════════════════════════════════════════════════════════
    # II MARINE EXPEDITIONARY FORCE — Camp Lejeune, NC
    # ═══════════════════════════════════════════════════════════════════
    "II Marine Expeditionary Force": {
        "abbr": "II MEF",
        "echelon": _MEF,
        "uic": "M20000",
        "children": {
            # ─── 2nd Marine Division ──────────────────────────────────
            "2nd Marine Division": {
                "abbr": "2nd MarDiv",
                "echelon": _DIV,
                "uic": "M21000",
                "children": {
                    "Headquarters Battalion, 2nd MarDiv": {
                        "abbr": "HQBN 2nd MarDiv",
                        "echelon": _BN,
                        "uic": "M21001",
                    },
                    # 2nd Marine Regiment
                    "2nd Marine Regiment": {
                        "abbr": "2nd Marines",
                        "echelon": _REGT,
                        "uic": "M21100",
                        "children": {
                            "1st Bn 2nd Marines": {
                                "abbr": "1/2",
                                "echelon": _BN,
                                "uic": "M21110",
                                "children": _infantry_bn_companies(1, 2, "M2111"),
                            },
                            "2nd Bn 2nd Marines": {
                                "abbr": "2/2",
                                "echelon": _BN,
                                "uic": "M21120",
                                "children": _infantry_bn_companies(2, 2, "M2112"),
                            },
                            "3rd Bn 2nd Marines": {
                                "abbr": "3/2",
                                "echelon": _BN,
                                "uic": "M21130",
                                "children": _infantry_bn_companies(3, 2, "M2113"),
                            },
                            "2nd Bn 8th Marines": {
                                "abbr": "2/8",
                                "echelon": _BN,
                                "uic": "M21140",
                                "children": _infantry_bn_companies(2, 8, "M2114"),
                            },
                        },
                    },
                    # 6th Marine Regiment
                    "6th Marine Regiment": {
                        "abbr": "6th Marines",
                        "echelon": _REGT,
                        "uic": "M21200",
                        "children": {
                            "1st Bn 6th Marines": {
                                "abbr": "1/6",
                                "echelon": _BN,
                                "uic": "M21210",
                                "children": _infantry_bn_companies(1, 6, "M2121"),
                            },
                            "2nd Bn 6th Marines": {
                                "abbr": "2/6",
                                "echelon": _BN,
                                "uic": "M21220",
                                "children": _infantry_bn_companies(2, 6, "M2122"),
                            },
                            "3rd Bn 6th Marines": {
                                "abbr": "3/6",
                                "echelon": _BN,
                                "uic": "M21230",
                                "children": _infantry_bn_companies(3, 6, "M2123"),
                            },
                            "1st Bn 8th Marines": {
                                "abbr": "1/8",
                                "echelon": _BN,
                                "uic": "M21240",
                                "children": _infantry_bn_companies(1, 8, "M2124"),
                            },
                        },
                    },
                    # 10th Marine Regiment (Artillery)
                    "10th Marine Regiment": {
                        "abbr": "10th Marines",
                        "echelon": _REGT,
                        "uic": "M21300",
                        "children": {
                            "1st Bn 10th Marines": {
                                "abbr": "1/10",
                                "echelon": _BN,
                                "uic": "M21310",
                            },
                            "2nd Bn 10th Marines": {
                                "abbr": "2/10",
                                "echelon": _BN,
                                "uic": "M21320",
                            },
                        },
                    },
                    # Separate Battalions under 2nd MarDiv
                    "2nd Reconnaissance Battalion": {
                        "abbr": "2nd Recon Bn",
                        "echelon": _BN,
                        "uic": "M21410",
                    },
                    "2nd Light Armored Reconnaissance Battalion": {
                        "abbr": "2nd LAR Bn",
                        "echelon": _BN,
                        "uic": "M21420",
                    },
                    "2nd Combat Engineer Battalion": {
                        "abbr": "2nd CEB",
                        "echelon": _BN,
                        "uic": "M21430",
                    },
                    "2nd Assault Amphibian Battalion": {
                        "abbr": "2nd AABn",
                        "echelon": _BN,
                        "uic": "M21440",
                    },
                },
            },
            # ─── 2nd Marine Aircraft Wing ─────────────────────────────
            "2nd Marine Aircraft Wing": {
                "abbr": "2nd MAW",
                "echelon": _WING,
                "uic": "M22000",
                "children": {
                    "Marine Wing Headquarters Squadron 2": {
                        "abbr": "MWHS-2",
                        "echelon": _SQDN,
                        "uic": "M22001",
                    },
                    "Marine Aircraft Group 14": {
                        "abbr": "MAG-14",
                        "echelon": _GRP,
                        "uic": "M22100",
                        "children": {
                            "VMFA-115": {
                                "abbr": "VMFA-115",
                                "echelon": _SQDN,
                                "uic": "M22111",
                            },
                            "VMFA-224": {
                                "abbr": "VMFA-224",
                                "echelon": _SQDN,
                                "uic": "M22112",
                            },
                            "VMFA-251": {
                                "abbr": "VMFA-251",
                                "echelon": _SQDN,
                                "uic": "M22113",
                            },
                            "VMFA-312": {
                                "abbr": "VMFA-312",
                                "echelon": _SQDN,
                                "uic": "M22114",
                            },
                            "VMFA-501": {
                                "abbr": "VMFA-501",
                                "echelon": _SQDN,
                                "uic": "M22115",
                            },
                            "VMFA-542": {
                                "abbr": "VMFA-542",
                                "echelon": _SQDN,
                                "uic": "M22116",
                            },
                            "VMGR-252": {
                                "abbr": "VMGR-252",
                                "echelon": _SQDN,
                                "uic": "M22117",
                            },
                        },
                    },
                    "Marine Aircraft Group 26": {
                        "abbr": "MAG-26",
                        "echelon": _GRP,
                        "uic": "M22200",
                        "children": {
                            "VMM-261": {
                                "abbr": "VMM-261",
                                "echelon": _SQDN,
                                "uic": "M22211",
                            },
                            "VMM-263": {
                                "abbr": "VMM-263",
                                "echelon": _SQDN,
                                "uic": "M22212",
                            },
                            "VMM-264": {
                                "abbr": "VMM-264",
                                "echelon": _SQDN,
                                "uic": "M22213",
                            },
                            "VMM-266": {
                                "abbr": "VMM-266",
                                "echelon": _SQDN,
                                "uic": "M22214",
                            },
                            "HMH-461": {
                                "abbr": "HMH-461",
                                "echelon": _SQDN,
                                "uic": "M22215",
                            },
                            "HMH-464": {
                                "abbr": "HMH-464",
                                "echelon": _SQDN,
                                "uic": "M22216",
                            },
                            "HMH-366": {
                                "abbr": "HMH-366",
                                "echelon": _SQDN,
                                "uic": "M22217",
                            },
                        },
                    },
                    "Marine Aircraft Group 29": {
                        "abbr": "MAG-29",
                        "echelon": _GRP,
                        "uic": "M22300",
                        "children": {
                            "HMLA-167": {
                                "abbr": "HMLA-167",
                                "echelon": _SQDN,
                                "uic": "M22311",
                            },
                            "HMLA-269": {
                                "abbr": "HMLA-269",
                                "echelon": _SQDN,
                                "uic": "M22312",
                            },
                            "HMLA-467": {
                                "abbr": "HMLA-467",
                                "echelon": _SQDN,
                                "uic": "M22313",
                            },
                            "VMU-2": {
                                "abbr": "VMU-2",
                                "echelon": _SQDN,
                                "uic": "M22314",
                            },
                        },
                    },
                    "Marine Air Control Group 28": {
                        "abbr": "MACG-28",
                        "echelon": _GRP,
                        "uic": "M22400",
                    },
                    "Marine Wing Support Group 27": {
                        "abbr": "MWSG-27",
                        "echelon": _GRP,
                        "uic": "M22500",
                    },
                },
            },
            # ─── 2nd Marine Logistics Group ───────────────────────────
            "2nd Marine Logistics Group": {
                "abbr": "2nd MLG",
                "echelon": _GRP,
                "uic": "M23000",
                "children": {
                    "Headquarters & Service Battalion, 2nd MLG": {
                        "abbr": "H&S Bn 2nd MLG",
                        "echelon": _BN,
                        "uic": "M23001",
                    },
                    "Combat Logistics Regiment 2": {
                        "abbr": "CLR-2",
                        "echelon": _REGT,
                        "uic": "M23100",
                        "children": {
                            "Combat Logistics Battalion 2": {
                                "abbr": "CLB-2",
                                "echelon": _BN,
                                "uic": "M23110",
                            },
                            "Combat Logistics Battalion 6": {
                                "abbr": "CLB-6",
                                "echelon": _BN,
                                "uic": "M23120",
                            },
                            "Combat Logistics Battalion 8": {
                                "abbr": "CLB-8",
                                "echelon": _BN,
                                "uic": "M23130",
                            },
                            "Combat Logistics Battalion 22": {
                                "abbr": "CLB-22",
                                "echelon": _BN,
                                "uic": "M23140",
                            },
                            "Combat Logistics Battalion 24": {
                                "abbr": "CLB-24",
                                "echelon": _BN,
                                "uic": "M23150",
                            },
                            "Combat Logistics Battalion 26": {
                                "abbr": "CLB-26",
                                "echelon": _BN,
                                "uic": "M23160",
                            },
                        },
                    },
                    "Combat Logistics Regiment 27": {
                        "abbr": "CLR-27",
                        "echelon": _REGT,
                        "uic": "M23200",
                        "children": {
                            "2nd Distribution Support Battalion": {
                                "abbr": "2nd DSB",
                                "echelon": _BN,
                                "uic": "M23210",
                            },
                        },
                    },
                    "2nd Combat Readiness Regiment": {
                        "abbr": "2nd CRR",
                        "echelon": _REGT,
                        "uic": "M23300",
                        "children": {
                            "2nd Maintenance Battalion": {
                                "abbr": "2nd Maint Bn",
                                "echelon": _BN,
                                "uic": "M23310",
                            },
                        },
                    },
                    "8th Engineer Support Battalion": {
                        "abbr": "8th ESB",
                        "echelon": _BN,
                        "uic": "M23410",
                    },
                    "2nd Dental Battalion": {
                        "abbr": "2nd Dental Bn",
                        "echelon": _BN,
                        "uic": "M23420",
                    },
                },
            },
            # ─── II MEF Information Group ─────────────────────────────
            "II MEF Information Group": {
                "abbr": "II MIG",
                "echelon": _GRP,
                "uic": "M24000",
                "children": {
                    "II MEF Support Battalion": {
                        "abbr": "II MSB",
                        "echelon": _BN,
                        "uic": "M24100",
                    },
                    "2nd Intelligence Battalion": {
                        "abbr": "2nd Intel Bn",
                        "echelon": _BN,
                        "uic": "M24200",
                    },
                    "2nd Radio Battalion": {
                        "abbr": "2nd Radio Bn",
                        "echelon": _BN,
                        "uic": "M24300",
                    },
                    "8th Communication Battalion": {
                        "abbr": "8th Comm Bn",
                        "echelon": _BN,
                        "uic": "M24400",
                    },
                    "2nd Air Naval Gunfire Liaison Company": {
                        "abbr": "2nd ANGLICO",
                        "echelon": _CO,
                        "uic": "M24500",
                    },
                },
            },
            # ─── MEUs under II MEF ────────────────────────────────────
            "22nd Marine Expeditionary Unit": {
                "abbr": "22nd MEU",
                "echelon": _GRP,
                "uic": "M25100",
            },
            "24th Marine Expeditionary Unit": {
                "abbr": "24th MEU",
                "echelon": _GRP,
                "uic": "M25200",
            },
            "26th Marine Expeditionary Unit": {
                "abbr": "26th MEU",
                "echelon": _GRP,
                "uic": "M25300",
            },
            # ─── 2nd MEB ─────────────────────────────────────────────
            "2nd Marine Expeditionary Brigade": {
                "abbr": "2nd MEB",
                "echelon": _GRP,
                "uic": "M25400",
            },
        },
    },
    # ═══════════════════════════════════════════════════════════════════
    # III MARINE EXPEDITIONARY FORCE — Okinawa, Japan
    # ═══════════════════════════════════════════════════════════════════
    "III Marine Expeditionary Force": {
        "abbr": "III MEF",
        "echelon": _MEF,
        "uic": "M30000",
        "children": {
            # ─── 3rd Marine Division ──────────────────────────────────
            "3rd Marine Division": {
                "abbr": "3rd MarDiv",
                "echelon": _DIV,
                "uic": "M31000",
                "children": {
                    "Headquarters Battalion, 3rd MarDiv": {
                        "abbr": "HQBN 3rd MarDiv",
                        "echelon": _BN,
                        "uic": "M31001",
                    },
                    # 3rd Marine Littoral Regiment (MLR)
                    "3rd Marine Littoral Regiment": {
                        "abbr": "3rd MLR",
                        "echelon": _REGT,
                        "uic": "M31100",
                        "children": {
                            "3rd Littoral Combat Team": {
                                "abbr": "3rd LCT",
                                "echelon": _BN,
                                "uic": "M31110",
                            },
                            "3rd Littoral Anti-Air Battalion": {
                                "abbr": "3rd LAAB",
                                "echelon": _BN,
                                "uic": "M31120",
                            },
                            "3rd Littoral Logistics Battalion": {
                                "abbr": "3rd LLB",
                                "echelon": _BN,
                                "uic": "M31130",
                            },
                        },
                    },
                    # 12th Marine Littoral Regiment (MLR)
                    "12th Marine Littoral Regiment": {
                        "abbr": "12th MLR",
                        "echelon": _REGT,
                        "uic": "M31200",
                        "children": {
                            "12th Littoral Combat Team": {
                                "abbr": "12th LCT",
                                "echelon": _BN,
                                "uic": "M31210",
                            },
                            "12th Littoral Anti-Air Battalion": {
                                "abbr": "12th LAAB",
                                "echelon": _BN,
                                "uic": "M31220",
                            },
                            "12th Littoral Logistics Battalion": {
                                "abbr": "12th LLB",
                                "echelon": _BN,
                                "uic": "M31230",
                            },
                        },
                    },
                    # 4th Marine Regiment (remaining traditional infantry)
                    "4th Marine Regiment": {
                        "abbr": "4th Marines",
                        "echelon": _REGT,
                        "uic": "M31300",
                        "children": {
                            "3rd Bn 4th Marines": {
                                "abbr": "3/4",
                                "echelon": _BN,
                                "uic": "M31310",
                                "children": _infantry_bn_companies(3, 4, "M3131"),
                            },
                        },
                    },
                    # 12th Marine Regiment (Artillery — redesignated)
                    "12th Marine Regiment": {
                        "abbr": "12th Marines",
                        "echelon": _REGT,
                        "uic": "M31400",
                        "children": {
                            "3rd Bn 12th Marines": {
                                "abbr": "3/12",
                                "echelon": _BN,
                                "uic": "M31410",
                            },
                        },
                    },
                    # Separate Battalions under 3rd MarDiv
                    "3rd Reconnaissance Battalion": {
                        "abbr": "3rd Recon Bn",
                        "echelon": _BN,
                        "uic": "M31510",
                    },
                    "3rd Combat Engineer Battalion": {
                        "abbr": "3rd CEB",
                        "echelon": _BN,
                        "uic": "M31520",
                    },
                },
            },
            # ─── 1st Marine Aircraft Wing ─────────────────────────────
            "1st Marine Aircraft Wing": {
                "abbr": "1st MAW",
                "echelon": _WING,
                "uic": "M32000",
                "children": {
                    "Marine Wing Headquarters Squadron 1": {
                        "abbr": "MWHS-1",
                        "echelon": _SQDN,
                        "uic": "M32001",
                    },
                    "Marine Aircraft Group 12": {
                        "abbr": "MAG-12",
                        "echelon": _GRP,
                        "uic": "M32100",
                        "children": {
                            "VMFA-242": {
                                "abbr": "VMFA-242",
                                "echelon": _SQDN,
                                "uic": "M32111",
                            },
                        },
                    },
                    "Marine Aircraft Group 24": {
                        "abbr": "MAG-24",
                        "echelon": _GRP,
                        "uic": "M32200",
                        "children": {
                            "VMM-268": {
                                "abbr": "VMM-268",
                                "echelon": _SQDN,
                                "uic": "M32211",
                            },
                            "HMLA-367 Det": {
                                "abbr": "HMLA-367 Det",
                                "echelon": _SQDN,
                                "uic": "M32212",
                            },
                        },
                    },
                    "Marine Aircraft Group 36": {
                        "abbr": "MAG-36",
                        "echelon": _GRP,
                        "uic": "M32300",
                        "children": {
                            "VMM-262": {
                                "abbr": "VMM-262",
                                "echelon": _SQDN,
                                "uic": "M32311",
                            },
                            "VMM-265": {
                                "abbr": "VMM-265",
                                "echelon": _SQDN,
                                "uic": "M32312",
                            },
                            "HMLA-369": {
                                "abbr": "HMLA-369",
                                "echelon": _SQDN,
                                "uic": "M32313",
                            },
                            "HMH-772": {
                                "abbr": "HMH-772",
                                "echelon": _SQDN,
                                "uic": "M32314",
                            },
                        },
                    },
                    "Marine Air Control Group 18": {
                        "abbr": "MACG-18",
                        "echelon": _GRP,
                        "uic": "M32400",
                    },
                    "Marine Wing Support Group 17": {
                        "abbr": "MWSG-17",
                        "echelon": _GRP,
                        "uic": "M32500",
                    },
                },
            },
            # ─── 3rd Marine Logistics Group ───────────────────────────
            "3rd Marine Logistics Group": {
                "abbr": "3rd MLG",
                "echelon": _GRP,
                "uic": "M33000",
                "children": {
                    "Headquarters & Service Battalion, 3rd MLG": {
                        "abbr": "H&S Bn 3rd MLG",
                        "echelon": _BN,
                        "uic": "M33001",
                    },
                    "Combat Logistics Regiment 3": {
                        "abbr": "CLR-3",
                        "echelon": _REGT,
                        "uic": "M33100",
                        "children": {
                            "Combat Logistics Battalion 3": {
                                "abbr": "CLB-3",
                                "echelon": _BN,
                                "uic": "M33110",
                            },
                            "Combat Logistics Battalion 4": {
                                "abbr": "CLB-4",
                                "echelon": _BN,
                                "uic": "M33120",
                            },
                            "3rd Distribution Support Battalion": {
                                "abbr": "3rd DSB",
                                "echelon": _BN,
                                "uic": "M33130",
                            },
                        },
                    },
                    "Combat Logistics Regiment 37": {
                        "abbr": "CLR-37",
                        "echelon": _REGT,
                        "uic": "M33200",
                        "children": {
                            "Combat Logistics Battalion 31": {
                                "abbr": "CLB-31",
                                "echelon": _BN,
                                "uic": "M33210",
                            },
                        },
                    },
                    "3rd Maintenance Battalion": {
                        "abbr": "3rd Maint Bn",
                        "echelon": _BN,
                        "uic": "M33310",
                    },
                    "3rd Medical Battalion": {
                        "abbr": "3rd Med Bn",
                        "echelon": _BN,
                        "uic": "M33320",
                    },
                    "9th Engineer Support Battalion": {
                        "abbr": "9th ESB",
                        "echelon": _BN,
                        "uic": "M33330",
                    },
                    "3rd Dental Battalion": {
                        "abbr": "3rd Dental Bn",
                        "echelon": _BN,
                        "uic": "M33340",
                    },
                    "3rd Transportation Support Battalion": {
                        "abbr": "3rd TSB",
                        "echelon": _BN,
                        "uic": "M33350",
                    },
                },
            },
            # ─── III MEF Information Group ────────────────────────────
            "III MEF Information Group": {
                "abbr": "III MIG",
                "echelon": _GRP,
                "uic": "M34000",
                "children": {
                    "III MEF Support Battalion": {
                        "abbr": "III MSB",
                        "echelon": _BN,
                        "uic": "M34100",
                    },
                    "3rd Intelligence Battalion": {
                        "abbr": "3rd Intel Bn",
                        "echelon": _BN,
                        "uic": "M34200",
                    },
                    "3rd Radio Battalion": {
                        "abbr": "3rd Radio Bn",
                        "echelon": _BN,
                        "uic": "M34300",
                    },
                    "7th Communication Battalion": {
                        "abbr": "7th Comm Bn",
                        "echelon": _BN,
                        "uic": "M34400",
                    },
                    "3rd Air Naval Gunfire Liaison Company": {
                        "abbr": "3rd ANGLICO",
                        "echelon": _CO,
                        "uic": "M34500",
                    },
                },
            },
            # ─── MEU & MEB under III MEF ──────────────────────────────
            "31st Marine Expeditionary Unit": {
                "abbr": "31st MEU",
                "echelon": _GRP,
                "uic": "M35100",
            },
            "3rd Marine Expeditionary Brigade": {
                "abbr": "3rd MEB",
                "echelon": _GRP,
                "uic": "M35200",
            },
        },
    },
    # ═══════════════════════════════════════════════════════════════════
    # MARINE FORCES RESERVE
    # ═══════════════════════════════════════════════════════════════════
    "Marine Forces Reserve": {
        "abbr": "MARFORRES",
        "echelon": _MEF,
        "uic": "M40000",
        "children": {
            # ─── 4th Marine Division (Reserve) ────────────────────────
            "4th Marine Division": {
                "abbr": "4th MarDiv",
                "echelon": _DIV,
                "uic": "M41000",
                "children": {
                    "14th Marine Regiment": {
                        "abbr": "14th Marines",
                        "echelon": _REGT,
                        "uic": "M41100",
                        "children": {
                            "2nd Bn 14th Marines": {
                                "abbr": "2/14",
                                "echelon": _BN,
                                "uic": "M41110",
                            },
                            "3rd Bn 14th Marines": {
                                "abbr": "3/14",
                                "echelon": _BN,
                                "uic": "M41120",
                            },
                            "5th Bn 14th Marines": {
                                "abbr": "5/14",
                                "echelon": _BN,
                                "uic": "M41130",
                            },
                        },
                    },
                    "23rd Marine Regiment": {
                        "abbr": "23rd Marines",
                        "echelon": _REGT,
                        "uic": "M41200",
                        "children": {
                            "1st Bn 23rd Marines": {
                                "abbr": "1/23",
                                "echelon": _BN,
                                "uic": "M41210",
                            },
                            "2nd Bn 23rd Marines": {
                                "abbr": "2/23",
                                "echelon": _BN,
                                "uic": "M41220",
                            },
                            "3rd Bn 23rd Marines": {
                                "abbr": "3/23",
                                "echelon": _BN,
                                "uic": "M41230",
                            },
                        },
                    },
                    "24th Marine Regiment": {
                        "abbr": "24th Marines",
                        "echelon": _REGT,
                        "uic": "M41300",
                        "children": {
                            "1st Bn 24th Marines": {
                                "abbr": "1/24",
                                "echelon": _BN,
                                "uic": "M41310",
                            },
                            "2nd Bn 24th Marines": {
                                "abbr": "2/24",
                                "echelon": _BN,
                                "uic": "M41320",
                            },
                            "3rd Bn 24th Marines": {
                                "abbr": "3/24",
                                "echelon": _BN,
                                "uic": "M41330",
                            },
                        },
                    },
                    "25th Marine Regiment": {
                        "abbr": "25th Marines",
                        "echelon": _REGT,
                        "uic": "M41400",
                        "children": {
                            "1st Bn 25th Marines": {
                                "abbr": "1/25",
                                "echelon": _BN,
                                "uic": "M41410",
                            },
                            "2nd Bn 25th Marines": {
                                "abbr": "2/25",
                                "echelon": _BN,
                                "uic": "M41420",
                            },
                            "3rd Bn 25th Marines": {
                                "abbr": "3/25",
                                "echelon": _BN,
                                "uic": "M41430",
                            },
                        },
                    },
                    # Separate Battalions (Reserve)
                    "4th Assault Amphibian Battalion": {
                        "abbr": "4th AABn",
                        "echelon": _BN,
                        "uic": "M41510",
                    },
                    "4th Combat Engineer Battalion": {
                        "abbr": "4th CEB",
                        "echelon": _BN,
                        "uic": "M41520",
                    },
                    "4th Light Armored Reconnaissance Battalion": {
                        "abbr": "4th LAR Bn",
                        "echelon": _BN,
                        "uic": "M41530",
                    },
                    "4th Reconnaissance Battalion": {
                        "abbr": "4th Recon Bn",
                        "echelon": _BN,
                        "uic": "M41540",
                    },
                    "4th Tank Battalion": {
                        "abbr": "4th Tanks",
                        "echelon": _BN,
                        "uic": "M41550",
                    },
                },
            },
            # ─── 4th Marine Aircraft Wing (Reserve) ───────────────────
            "4th Marine Aircraft Wing": {
                "abbr": "4th MAW",
                "echelon": _WING,
                "uic": "M42000",
                "children": {
                    "Marine Aircraft Group 41": {
                        "abbr": "MAG-41",
                        "echelon": _GRP,
                        "uic": "M42100",
                    },
                    "Marine Aircraft Group 42": {
                        "abbr": "MAG-42",
                        "echelon": _GRP,
                        "uic": "M42200",
                    },
                    "Marine Aircraft Group 49": {
                        "abbr": "MAG-49",
                        "echelon": _GRP,
                        "uic": "M42300",
                    },
                },
            },
            # ─── 4th Marine Logistics Group (Reserve) ─────────────────
            "4th Marine Logistics Group": {
                "abbr": "4th MLG",
                "echelon": _GRP,
                "uic": "M43000",
                "children": {
                    "Combat Logistics Regiment 4": {
                        "abbr": "CLR-4",
                        "echelon": _REGT,
                        "uic": "M43100",
                        "children": {
                            "Combat Logistics Battalion 451": {
                                "abbr": "CLB-451",
                                "echelon": _BN,
                                "uic": "M43110",
                            },
                            "Combat Logistics Battalion 453": {
                                "abbr": "CLB-453",
                                "echelon": _BN,
                                "uic": "M43120",
                            },
                        },
                    },
                    "4th Medical Battalion": {
                        "abbr": "4th Med Bn",
                        "echelon": _BN,
                        "uic": "M43210",
                    },
                    "4th Dental Battalion": {
                        "abbr": "4th Dental Bn",
                        "echelon": _BN,
                        "uic": "M43220",
                    },
                    "6th Engineer Support Battalion": {
                        "abbr": "6th ESB",
                        "echelon": _BN,
                        "uic": "M43230",
                    },
                },
            },
            # ─── Force Headquarters Group ─────────────────────────────
            "Force Headquarters Group": {
                "abbr": "FHG",
                "echelon": _GRP,
                "uic": "M44000",
            },
        },
    },
    # ═══════════════════════════════════════════════════════════════════
    # MARINE FORCES SPECIAL OPERATIONS COMMAND (MARSOC)
    # ═══════════════════════════════════════════════════════════════════
    "Marine Forces Special Operations Command": {
        "abbr": "MARSOC",
        "echelon": _GRP,
        "uic": "M50000",
        "children": {
            "Marine Raider Regiment": {
                "abbr": "MRR",
                "echelon": _REGT,
                "uic": "M51000",
                "children": {
                    "1st Marine Raider Battalion": {
                        "abbr": "1st MRB",
                        "echelon": _BN,
                        "uic": "M51100",
                    },
                    "2nd Marine Raider Battalion": {
                        "abbr": "2nd MRB",
                        "echelon": _BN,
                        "uic": "M51200",
                    },
                    "3rd Marine Raider Battalion": {
                        "abbr": "3rd MRB",
                        "echelon": _BN,
                        "uic": "M51300",
                    },
                },
            },
            "Marine Raider Support Group": {
                "abbr": "MRSG",
                "echelon": _GRP,
                "uic": "M52000",
                "children": {
                    "Marine Raider Training Center": {
                        "abbr": "MRTC",
                        "echelon": _BN,
                        "uic": "M52100",
                    },
                    "Marine Raider Support Battalion": {
                        "abbr": "MRSB",
                        "echelon": _BN,
                        "uic": "M52200",
                    },
                },
            },
        },
    },
    # ═══════════════════════════════════════════════════════════════════
    # SUPPORTING ESTABLISHMENT
    # ═══════════════════════════════════════════════════════════════════
    "Marine Corps Training and Education Command": {
        "abbr": "TECOM",
        "echelon": _GRP,
        "uic": "M60000",
        "children": {
            "Marine Corps Recruiting Command": {
                "abbr": "MCRC",
                "echelon": _GRP,
                "uic": "M61000",
            },
            "Training Command": {
                "abbr": "TRNGCMD",
                "echelon": _GRP,
                "uic": "M62000",
                "children": {
                    "Marine Corps Recruit Depot San Diego": {
                        "abbr": "MCRD SD",
                        "echelon": _GRP,
                        "uic": "M62100",
                    },
                    "Marine Corps Recruit Depot Parris Island": {
                        "abbr": "MCRD PI",
                        "echelon": _GRP,
                        "uic": "M62200",
                    },
                    "The Basic School": {
                        "abbr": "TBS",
                        "echelon": _BN,
                        "uic": "M62300",
                    },
                    "Infantry Officer Course": {
                        "abbr": "IOC",
                        "echelon": _CO,
                        "uic": "M62400",
                    },
                    "School of Infantry - West": {
                        "abbr": "SOI-W",
                        "echelon": _BN,
                        "uic": "M62500",
                    },
                    "School of Infantry - East": {
                        "abbr": "SOI-E",
                        "echelon": _BN,
                        "uic": "M62600",
                    },
                },
            },
            "Education Command": {
                "abbr": "EDCOM",
                "echelon": _GRP,
                "uic": "M63000",
                "children": {
                    "Marine Corps University": {
                        "abbr": "MCU",
                        "echelon": _GRP,
                        "uic": "M63100",
                    },
                    "Marine Corps War College": {
                        "abbr": "MCWAR",
                        "echelon": _GRP,
                        "uic": "M63200",
                    },
                },
            },
        },
    },
    "Marine Corps Installations Command": {
        "abbr": "MCICOM",
        "echelon": _GRP,
        "uic": "M70000",
        "children": {
            "Marine Corps Base Camp Pendleton": {
                "abbr": "MCB CamPen",
                "echelon": _GRP,
                "uic": "M71000",
            },
            "Marine Corps Base Camp Lejeune": {
                "abbr": "MCB CamLej",
                "echelon": _GRP,
                "uic": "M72000",
            },
            "Marine Corps Base Quantico": {
                "abbr": "MCB Quantico",
                "echelon": _GRP,
                "uic": "M73000",
            },
            "Marine Corps Base Camp Butler": {
                "abbr": "MCB CamBut",
                "echelon": _GRP,
                "uic": "M74000",
            },
            "Marine Corps Base Hawaii": {
                "abbr": "MCB Hawaii",
                "echelon": _GRP,
                "uic": "M75000",
            },
            "Marine Corps Air Station Miramar": {
                "abbr": "MCAS Miramar",
                "echelon": _GRP,
                "uic": "M76000",
            },
            "Marine Corps Air Station Cherry Point": {
                "abbr": "MCAS ChPt",
                "echelon": _GRP,
                "uic": "M77000",
            },
            "Marine Corps Air Station Yuma": {
                "abbr": "MCAS Yuma",
                "echelon": _GRP,
                "uic": "M78000",
            },
            "Marine Corps Air Station Beaufort": {
                "abbr": "MCAS Beaufort",
                "echelon": _GRP,
                "uic": "M79000",
            },
            "Marine Corps Air Station Iwakuni": {
                "abbr": "MCAS Iwakuni",
                "echelon": _GRP,
                "uic": "M79100",
            },
            "Marine Corps Air Ground Combat Center Twentynine Palms": {
                "abbr": "MCAGCC 29 Palms",
                "echelon": _GRP,
                "uic": "M79200",
            },
        },
    },
    # ─── Marine Corps Forces Commands ─────────────────────────────────
    "Marine Forces Pacific": {
        "abbr": "MARFORPAC",
        "echelon": _GRP,
        "uic": "M80000",
    },
    "Marine Forces Command": {
        "abbr": "MARFORCOM",
        "echelon": _GRP,
        "uic": "M81000",
    },
    "Marine Forces Cyber Command": {
        "abbr": "MARFORCYBER",
        "echelon": _GRP,
        "uic": "M82000",
    },
    "Marine Forces Europe and Africa": {
        "abbr": "MARFOREUR/AF",
        "echelon": _GRP,
        "uic": "M83000",
    },
    "Marine Forces Central Command": {
        "abbr": "MARCENT",
        "echelon": _GRP,
        "uic": "M84000",
    },
    "Marine Forces Southern Command": {
        "abbr": "MARFORSOUTH",
        "echelon": _GRP,
        "uic": "M85000",
    },
    "Marine Forces Korea": {
        "abbr": "MARFOR-K",
        "echelon": _GRP,
        "uic": "M86000",
    },
}


async def create_unit_tree(
    db: AsyncSession, tree: dict, parent_id: int | None = None
) -> dict:
    """Recursively create units from the hierarchy definition.

    Returns a mapping of unit name/abbr -> unit id for use by other seed scripts.
    """
    unit_map = {}

    for name, config in tree.items():
        # Check if unit already exists by UIC
        uic = config.get("uic")
        existing = None
        if uic:
            result = await db.execute(select(Unit).where(Unit.uic == uic))
            existing = result.scalar_one_or_none()

        if existing:
            unit = existing
        else:
            unit = Unit(
                name=name,
                abbreviation=config["abbr"],
                echelon=config["echelon"],
                parent_id=parent_id,
                uic=uic,
            )
            db.add(unit)
            await db.flush()

        unit_map[name] = unit.id
        unit_map[config["abbr"]] = unit.id

        # Recurse into children
        children = config.get("children", {})
        if children:
            child_map = await create_unit_tree(db, children, unit.id)
            unit_map.update(child_map)

    return unit_map


async def seed_units():
    """Main entry point for seeding units."""
    async with async_session() as db:
        unit_map = await create_unit_tree(db, UNIT_HIERARCHY)
        await db.commit()
        # Each unit appears twice in map (name + abbr)
        unique_count = len(unit_map) // 2
        print(f"Seeded {unique_count} units.")
        return unit_map


if __name__ == "__main__":
    asyncio.run(seed_units())
