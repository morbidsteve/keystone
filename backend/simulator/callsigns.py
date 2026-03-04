"""Callsign registry for all simulator scenarios.

Maps unit abbreviations to their tactical callsigns. Used by unit state
creation to assign realistic callsigns to simulated units.
"""

from __future__ import annotations

CALLSIGNS: dict[str, list[str]] = {
    # ===========================================================================
    # Steel Guardian (1/7)
    # ===========================================================================
    "1/7": ["RIPPER 6", "RIPPER 3", "RIPPER 4"],
    "A Co 1/7": ["ALPHA 6", "ALPHA 5"],
    "B Co 1/7": ["BRAVO 6", "BRAVO 5"],
    "C Co 1/7": ["CHARLIE 6", "CHARLIE 5"],
    "Wpns Co 1/7": ["WEAPON 6", "WEAPON 5"],
    "H&S Co 1/7": ["HEADHUNTER 6", "HEADHUNTER 5"],
    "1/11": ["CANNON 6", "CANNON 3"],
    "CLB-7": ["IRONHORSE 6", "IRONHORSE 3", "IRONHORSE 4"],
    "CLR-1": ["SUPPLY 6", "SUPPLY 3"],
    "1st Recon Bn": ["SHADOW 6", "SHADOW 3"],
    # ===========================================================================
    # Pacific Fury (26th MEU)
    # ===========================================================================
    "26th MEU": ["EAGLE 6", "EAGLE 3"],
    "2/6": ["SPARTAN 6", "SPARTAN 3", "SPARTAN 4"],
    "A Co 2/6": ["APACHE 6", "APACHE 5"],
    "B Co 2/6": ["BANDIT 6", "BANDIT 5"],
    "C Co 2/6": ["COBRA 6", "COBRA 5"],
    "Wpns Co 2/6": ["DAGGER 6", "DAGGER 5"],
    "H&S Co 2/6": ["HAMMER 6", "HAMMER 5"],
    "2/10": ["THUNDER 6", "THUNDER 3"],
    "VMM-266": ["GRIFFIN 6", "GRIFFIN OPS"],
    "HMLA-269": ["GUNRUNNER 6", "GUNRUNNER OPS"],
    "VMFA-251": ["THUNDERBOLT 6", "THUNDERBOLT OPS"],
    "CLB-26": ["MUSTANG 6", "MUSTANG 3"],
    "2nd Recon Bn": ["GHOST 6", "GHOST 3"],
    # ===========================================================================
    # Iron Forge (III MEF)
    # ===========================================================================
    "3rd MLR": ["TRIDENT 6", "TRIDENT 3"],
    "3rd LCT": ["LANCER 6", "LANCER 3"],
    "3rd LAAB": ["SHIELD 6", "SHIELD 3"],
    "3rd LLB": ["ANCHOR 6", "ANCHOR 3"],
    "12th MLR": ["VANGUARD 6", "VANGUARD 3"],
    "12th LCT": ["SABER 6", "SABER 3"],
    "12th LAAB": ["SENTINEL 6", "SENTINEL 3"],
    "12th LLB": ["DEPOT 6", "DEPOT 3"],
    "3/4": ["DARKSIDE 6", "DARKSIDE 3", "DARKSIDE 4"],
    "A Co 3/4": ["ASSASSIN 6", "ASSASSIN 5"],
    "B Co 3/4": ["BARBARIAN 6", "BARBARIAN 5"],
    "C Co 3/4": ["CRUSADER 6", "CRUSADER 5"],
    "3/12": ["STEEL RAIN 6", "STEEL RAIN 3"],
    "3rd Recon Bn": ["REAPER 6", "REAPER 3"],
    "3rd CEB": ["PIONEER 6", "PIONEER 3"],
    "VMM-262": ["TIGER 6", "TIGER OPS"],
    "HMLA-369": ["GUNFIGHTER 6", "GUNFIGHTER OPS"],
    "CLB-3": ["WARHORSE 6", "WARHORSE 3"],
    "CLB-4": ["STALLION 6", "STALLION 3"],
    "CLR-3": ["PROVIDER 6", "PROVIDER 3"],
    "3rd Maint Bn": ["WRENCH 6", "WRENCH 3"],
    "9th ESB": ["BUILDER 6", "BUILDER 3"],
    "3rd TSB": ["TRANSPORTER 6", "TRANSPORTER 3"],
    "3rd Intel Bn": ["ORACLE 6", "ORACLE 3"],
    "7th Comm Bn": ["SIGNAL 6", "SIGNAL 3"],
    "31st MEU": ["WOLFPACK 6", "WOLFPACK 3"],
    # ===========================================================================
    # ITX (2/5)
    # ===========================================================================
    "2/5": ["GERONIMO-6", "GERONIMO-3", "GERONIMO-S4", "GERONIMO-LOG"],
    "A Co 2/5": ["AZTEC-6", "AZTEC-4", "AZTEC-LOG"],
    "B Co 2/5": ["BANSHEE-6", "BANSHEE-4", "BANSHEE-LOG"],
    "C Co 2/5": ["CAVALIER-6", "CAVALIER-4", "CAVALIER-LOG"],
    "Wpns Co 2/5": ["WRECKING CREW-6", "WRECKING CREW-4"],
    "H&S Co 2/5": ["HEADQUARTERS-6", "HEADQUARTERS-4"],
    "CLB-5": ["PACKRAT-6", "PACKRAT-4", "PACKRAT-DISTRO", "PACKRAT-MAINT"],
    # ===========================================================================
    # Steel Knight (1st MarDiv)
    # ===========================================================================
    "1st MarDiv": ["BLUE DIAMOND-6", "BLUE DIAMOND-3", "BLUE DIAMOND-LOG"],
    "HQBN 1st MarDiv": ["DIAMOND HQ-6", "DIAMOND HQ-4"],
    "5th Marines": ["STONEWALL-6", "STONEWALL-3"],
    "1/5": ["MAKE PEACE-6", "MAKE PEACE-3", "MAKE PEACE-S4", "MAKE PEACE-LOG"],
    "A Co 1/5": ["ALAMO-6", "ALAMO-4", "ALAMO-LOG"],
    "B Co 1/5": ["BUSHMASTER-6", "BUSHMASTER-4", "BUSHMASTER-LOG"],
    "C Co 1/5": ["CORSAIR-6", "CORSAIR-4", "CORSAIR-LOG"],
    "3/5": ["DARKHORSE-6", "DARKHORSE-3", "DARKHORSE-S4", "DARKHORSE-LOG"],
    "A Co 3/5": ["ARROW-6", "ARROW-4", "ARROW-LOG"],
    "B Co 3/5": ["BLACKHEART-6", "BLACKHEART-4", "BLACKHEART-LOG"],
    "C Co 3/5": ["CUTLASS-6", "CUTLASS-4", "CUTLASS-LOG"],
    "2/7": ["WAR DOG-6", "WAR DOG-3", "WAR DOG-S4", "WAR DOG-LOG"],
    "A Co 2/7": ["ANIMAL-6", "ANIMAL-4", "ANIMAL-LOG"],
    "B Co 2/7": ["BASTARD-6", "BASTARD-4", "BASTARD-LOG"],
    "C Co 2/7": ["CHOSIN-6", "CHOSIN-4", "CHOSIN-LOG"],
    "11th Marines": ["CANNON KING-6", "CANNON KING-3"],
    "3/11": ["BATTLEMENT-6", "BATTLEMENT-FDC", "BATTLEMENT-LOG"],
    "1st LAR Bn": ["WOLFPACK-6", "WOLFPACK-3", "WOLFPACK-LOG"],
    "CLB-11": ["SUPPLY CHAIN-6", "SUPPLY CHAIN-4", "SUPPLY CHAIN-DISTRO"],
    "1st DSB": ["DISTRIBUTION-6", "DISTRIBUTION-4"],
    "I MIG": ["CYBER KNIGHT-6", "CYBER KNIGHT-3"],
    "9th Comm Bn": ["NETWORK-6", "NETWORK-3"],
    "1st Intel Bn": ["ORACLE-6", "ORACLE-3"],
    # ===========================================================================
    # COMPTUEX (24th MEU)
    # ===========================================================================
    "24th MEU": ["IROQUOIS-6", "IROQUOIS-3", "IROQUOIS-LOG"],
    "1/8": ["BEIRUT-6", "BEIRUT-3", "BEIRUT-S4", "BEIRUT-LOG"],
    "A Co 1/8": ["ARES-6", "ARES-4", "ARES-LOG"],
    "B Co 1/8": ["BULLDOG-6", "BULLDOG-4", "BULLDOG-LOG"],
    "C Co 1/8": ["CENTURION-6", "CENTURION-4", "CENTURION-LOG"],
    "Wpns Co 1/8": ["WARPATH-6", "WARPATH-4"],
    "H&S Co 1/8": ["HEARTBEAT-6", "HEARTBEAT-4"],
    "CLB-24": ["GRIZZLY-6", "GRIZZLY-4", "GRIZZLY-DISTRO", "GRIZZLY-MAINT"],
    "VMM-264": ["BLACK KNIGHT-OPS", "BLACK KNIGHT-LOG"],
    "HMLA-167": ["WARRIOR-OPS", "WARRIOR-LOG"],
    "VMFA-224": ["BENGAL-OPS", "BENGAL-LOG"],
    # ===========================================================================
    # Ssang Yong / III MEF logistics
    # ===========================================================================
    "CLB-31": ["DRAGON TRAIN-6", "DRAGON TRAIN-4", "DRAGON TRAIN-DISTRO"],
    "CLR-37": ["DRAGON FORGE-6", "DRAGON FORGE-4"],
    # ===========================================================================
    # African Lion (1/2)
    # ===========================================================================
    "1/2": ["TIMBERWOLF-6", "TIMBERWOLF-3", "TIMBERWOLF-S4", "TIMBERWOLF-LOG"],
    "A Co 1/2": ["ALPHA WOLF-6", "ALPHA WOLF-4", "ALPHA WOLF-LOG"],
    "B Co 1/2": ["BRAVO WOLF-6", "BRAVO WOLF-4", "BRAVO WOLF-LOG"],
    "C Co 1/2": ["CHARLIE WOLF-6", "CHARLIE WOLF-4", "CHARLIE WOLF-LOG"],
    "Wpns Co 1/2": ["WOLFHOUND-6", "WOLFHOUND-4"],
    "H&S Co 1/2": ["WOLF DEN-6", "WOLF DEN-4"],
    "CLB-2": ["IRON WOLF-6", "IRON WOLF-4", "IRON WOLF-DISTRO"],
    # ===========================================================================
    # Cold Response (2/2)
    # ===========================================================================
    "2/2": ["VIKING-6", "VIKING-3", "VIKING-S4", "VIKING-LOG"],
    "A Co 2/2": ["FROST-6", "FROST-4", "FROST-LOG"],
    "B Co 2/2": ["BLIZZARD-6", "BLIZZARD-4", "BLIZZARD-LOG"],
    "C Co 2/2": ["COLD STEEL-6", "COLD STEEL-4", "COLD STEEL-LOG"],
    "Wpns Co 2/2": ["WINTER-6", "WINTER-4"],
    "H&S Co 2/2": ["WARMTH-6", "WARMTH-4"],
    "CLB-6": ["ARCTIC TRAIN-6", "ARCTIC TRAIN-4", "ARCTIC TRAIN-DISTRO"],
    # ===========================================================================
    # Reserve ITX
    # ===========================================================================
    "1/23": ["LONE STAR-6", "LONE STAR-3", "LONE STAR-S4"],
    "2/23": ["GATOR-6", "GATOR-3", "GATOR-S4"],
    "3/23": ["BAYOU-6", "BAYOU-3", "BAYOU-S4"],
    "2/14": ["RESERVE THUNDER-6", "RESERVE THUNDER-FDC"],
    "3/14": ["RESERVE STEEL-6", "RESERVE STEEL-FDC"],
    "4th LAR Bn": ["RESERVE WOLF-6", "RESERVE WOLF-3"],
    "4th CEB": ["RESERVE SAPPER-6", "RESERVE SAPPER-4"],
    "CLB-451": ["RESERVE SUPPLY-6", "RESERVE SUPPLY-4", "RESERVE SUPPLY-DISTRO"],
    "CLR-4": ["RESERVE FORGE-6", "RESERVE FORGE-4"],
    # ===========================================================================
    # Trident Spear (13th MEU)
    # ===========================================================================
    "13th MEU": ["TRIDENT-6", "TRIDENT-3", "TRIDENT-LOG"],
    "1/4": ["CHINA MARINE-6", "CHINA MARINE-3", "CHINA MARINE-S4", "CHINA MARINE-LOG"],
    "A Co 1/4": ["ANNIHILATOR-6", "ANNIHILATOR-4", "ANNIHILATOR-LOG"],
    "B Co 1/4": ["BRUTE-6", "BRUTE-4", "BRUTE-LOG"],
    "C Co 1/4": ["CHAMPION-6", "CHAMPION-4", "CHAMPION-LOG"],
    "Wpns Co 1/4": ["WARLANCE-6", "WARLANCE-4"],
    "H&S Co 1/4": ["HOME BASE-6", "HOME BASE-4"],
    "CLB-13": ["EAGLE SUPPLY-6", "EAGLE SUPPLY-4", "EAGLE SUPPLY-DISTRO"],
    "VMM-161": ["GREY HAWK-OPS", "GREY HAWK-LOG"],
    "HMLA-469": ["VENGEANCE-OPS", "VENGEANCE-LOG"],
    "VMFA-211": ["WAKE ISLAND-OPS", "WAKE ISLAND-LOG"],
    "1st ANGLICO": ["FIRELINK-6", "FIRELINK-3"],
    # ===========================================================================
    # Additional units referenced across scenarios
    # ===========================================================================
    "2/11": ["STEEL CURTAIN-6", "STEEL CURTAIN-FDC"],
    "CLB-1": ["SUPPLY HORSE-6", "SUPPLY HORSE-4"],
    "VMM-268": ["RED DRAGON-OPS", "RED DRAGON-LOG"],
    "VMM-265": ["DRAGON-OPS", "DRAGON-LOG"],
    "VMM-163": ["RIDGERUNNER-OPS", "RIDGERUNNER-LOG"],
    "2nd LAR Bn": ["HIGHLANDER-6", "HIGHLANDER-3"],
    "8th Comm Bn": ["GUARDIAN NET-6", "GUARDIAN NET-3"],
    "2nd Intel Bn": ["ALL SEEING-6", "ALL SEEING-3"],
    "4th Recon Bn": ["PHANTOM-6", "PHANTOM-3"],
    "1/1": ["FIRST FORCE-6", "FIRST FORCE-3"],
    "2/1": ["MISSION FIRST-6", "MISSION FIRST-3"],
    "3/1": ["THUNDERING THIRD-6", "THUNDERING THIRD-3"],
}
