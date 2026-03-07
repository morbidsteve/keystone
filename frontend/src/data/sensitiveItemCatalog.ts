// =============================================================================
// Sensitive Item Catalog — NSN/Nomenclature auto-lookup data
// =============================================================================

import type { SensitiveItemType } from '@/lib/types';

export interface CatalogEntry {
  nomenclature: string;
  nsn: string;
  itemType: SensitiveItemType;
  tamcn?: string;
  /** Short common name(s) used for fuzzy matching (e.g. "M4", "SAW") */
  aliases: string[];
}

export const SENSITIVE_ITEM_CATALOG: CatalogEntry[] = [
  // ---------------------------------------------------------------------------
  // WEAPON
  // ---------------------------------------------------------------------------
  { nomenclature: 'Rifle, 5.56mm, M4A1',               nsn: '1005-01-231-0973', itemType: 'WEAPON', aliases: ['M4A1', 'M4', 'Carbine'] },
  { nomenclature: 'Rifle, 5.56mm, M16A4',               nsn: '1005-01-383-2872', itemType: 'WEAPON', aliases: ['M16A4', 'M16'] },
  { nomenclature: 'Pistol, 9mm, M18 (SIG P320)',        nsn: '1005-01-659-6741', itemType: 'WEAPON', aliases: ['M18', 'SIG', 'P320', 'Pistol'] },
  { nomenclature: 'Machine Gun, 7.62mm, M240B',         nsn: '1005-01-412-4939', itemType: 'WEAPON', aliases: ['M240B', 'M240', '240 Bravo'] },
  { nomenclature: 'Machine Gun, 5.56mm, M249 SAW',      nsn: '1005-01-127-7510', itemType: 'WEAPON', aliases: ['M249', 'SAW', 'Squad Automatic'] },
  { nomenclature: 'Rifle, 5.56mm, M27 IAR',             nsn: '1005-01-596-8380', itemType: 'WEAPON', aliases: ['M27', 'IAR', 'Infantry Automatic'] },
  { nomenclature: 'Machine Gun, Cal .50, M2',            nsn: '1005-00-322-9715', itemType: 'WEAPON', aliases: ['M2', '.50 Cal', 'Ma Deuce', 'M2HB'] },
  { nomenclature: 'Grenade Launcher, 40mm, Mk19',       nsn: '1010-01-126-9063', itemType: 'WEAPON', aliases: ['Mk19', 'MK19', 'Mark 19', 'Grenade Launcher'] },
  { nomenclature: 'Grenade Launcher, 40mm, M203',       nsn: '1010-00-179-5693', itemType: 'WEAPON', aliases: ['M203', 'Grenade Launcher 203'] },
  { nomenclature: 'Launcher, Rocket, 84mm, AT4',        nsn: '1340-01-187-3927', itemType: 'WEAPON', aliases: ['AT4', 'AT-4', '84mm'] },
  { nomenclature: 'Launcher, Rocket, 66mm, M72 LAW',    nsn: '1340-00-691-1154', itemType: 'WEAPON', aliases: ['M72', 'LAW', '66mm'] },
  { nomenclature: 'Launcher, Rocket, 83mm, SMAW',       nsn: '1340-01-139-0916', itemType: 'WEAPON', aliases: ['SMAW', 'Shoulder-Launched'] },
  { nomenclature: 'Command Launch Unit, Javelin CLU',    nsn: '1430-01-570-4233', itemType: 'WEAPON', aliases: ['Javelin CLU', 'CLU', 'Javelin'] },
  { nomenclature: 'Shotgun, 12 Gauge, M1014',           nsn: '1005-01-478-1394', itemType: 'WEAPON', aliases: ['M1014', 'Shotgun', 'Benelli'] },
  { nomenclature: 'Rifle, 7.62mm, M110 SASS',           nsn: '1005-01-553-5196', itemType: 'WEAPON', aliases: ['M110', 'SASS', 'Sniper'] },

  // ---------------------------------------------------------------------------
  // OPTIC
  // ---------------------------------------------------------------------------
  { nomenclature: 'Sight, Reflex, M150 ACOG (TA31RCO)', nsn: '1240-01-412-6608', itemType: 'OPTIC', aliases: ['M150', 'ACOG', 'RCO', 'TA31'] },
  { nomenclature: 'Sight, LPVO, SU-260/P',              nsn: '1240-01-677-2193', itemType: 'OPTIC', aliases: ['SU-260', 'LPVO', 'Squad Variable'] },
  { nomenclature: 'Sight, Rifle Combat Optic, AN/PVQ-31', nsn: '1240-01-411-1265', itemType: 'OPTIC', aliases: ['AN/PVQ-31', 'PVQ-31', 'RCO'] },
  { nomenclature: 'Aiming Light, AN/PEQ-16',            nsn: '5855-01-522-4337', itemType: 'OPTIC', aliases: ['AN/PEQ-16', 'PEQ-16', 'PEQ16', 'Aiming Light'] },
  { nomenclature: 'Aiming Light, AN/PEQ-15',            nsn: '5855-01-398-4276', itemType: 'OPTIC', aliases: ['AN/PEQ-15', 'PEQ-15', 'PEQ15', 'ATPIAL'] },

  // ---------------------------------------------------------------------------
  // NVG
  // ---------------------------------------------------------------------------
  { nomenclature: 'Night Vision Goggle, AN/PVS-31A',    nsn: '5855-01-629-5399', itemType: 'NVG', aliases: ['AN/PVS-31A', 'PVS-31', 'BNVD', 'Binocular NVG'] },
  { nomenclature: 'Night Vision Monocular, AN/PVS-14',  nsn: '5855-01-432-0524', itemType: 'NVG', aliases: ['AN/PVS-14', 'PVS-14', 'PVS14', 'Monocular'] },
  { nomenclature: 'ENVG-B, AN/PSQ-20B',                 nsn: '5855-01-684-4918', itemType: 'NVG', aliases: ['AN/PSQ-20B', 'PSQ-20', 'ENVG-B', 'Enhanced NVG'] },

  // ---------------------------------------------------------------------------
  // CRYPTO
  // ---------------------------------------------------------------------------
  { nomenclature: 'Data Transfer Device, AN/CYZ-10',    nsn: '5810-01-398-5569', itemType: 'CRYPTO', aliases: ['AN/CYZ-10', 'CYZ-10', 'DTD', 'Simple Key Loader'] },
  { nomenclature: 'Inline Network Encryptor, KIV-7M',   nsn: '5810-01-484-6452', itemType: 'CRYPTO', aliases: ['KIV-7M', 'KIV7M', 'Network Encryptor'] },

  // ---------------------------------------------------------------------------
  // RADIO
  // ---------------------------------------------------------------------------
  { nomenclature: 'Radio Set, AN/PRC-117G',             nsn: '5820-01-579-7393', itemType: 'RADIO', aliases: ['AN/PRC-117G', 'PRC-117G', '117G', 'Multiband'] },
  { nomenclature: 'Radio Set, AN/PRC-152A',             nsn: '5820-01-451-8250', itemType: 'RADIO', aliases: ['AN/PRC-152A', 'PRC-152', '152A', 'Harris'] },
  { nomenclature: 'Radio Set, AN/PRC-163',              nsn: '5820-01-666-7363', itemType: 'RADIO', aliases: ['AN/PRC-163', 'PRC-163', '163', 'Rifleman Radio'] },
  { nomenclature: 'Radio Set, Vehicular, AN/VRC-110',   nsn: '5820-01-579-7392', itemType: 'RADIO', aliases: ['AN/VRC-110', 'VRC-110', 'Vehicular Radio'] },

  // ---------------------------------------------------------------------------
  // COMSEC
  // ---------------------------------------------------------------------------
  { nomenclature: 'Secure Terminal Equipment, KY-100',   nsn: '5810-01-380-4063', itemType: 'COMSEC', aliases: ['KY-100', 'KY100', 'STE', 'Secure Phone'] },

  // ---------------------------------------------------------------------------
  // EXPLOSIVE
  // ---------------------------------------------------------------------------
  { nomenclature: 'Mine, Antipersonnel, M18A1 Claymore', nsn: '1345-00-058-3028', itemType: 'EXPLOSIVE', aliases: ['M18A1', 'Claymore', 'Mine'] },
  { nomenclature: 'Charge, Demolition, C4 Block',        nsn: '1375-00-028-5478', itemType: 'EXPLOSIVE', aliases: ['C4', 'C-4', 'Demolition', 'Explosive Block'] },
  { nomenclature: 'Grenade, Fragmentation, M67',         nsn: '1330-01-150-6544', itemType: 'EXPLOSIVE', aliases: ['M67', 'Frag', 'Fragmentation Grenade'] },

  // ---------------------------------------------------------------------------
  // MISSILE
  // ---------------------------------------------------------------------------
  { nomenclature: 'Missile, Stinger, FIM-92',            nsn: '1410-01-407-4955', itemType: 'MISSILE', aliases: ['FIM-92', 'Stinger', 'MANPADS'] },
  { nomenclature: 'Missile, Javelin, FGM-148',           nsn: '1430-01-495-2680', itemType: 'MISSILE', aliases: ['FGM-148', 'Javelin Missile', 'Javelin Round'] },
];

/**
 * Search the catalog for entries matching a query string.
 * Matches against nomenclature, NSN, and aliases (case-insensitive).
 * Returns up to `limit` results.
 */
export function searchCatalog(query: string, limit = 8): CatalogEntry[] {
  if (!query || query.length < 2) return [];

  const term = query.toLowerCase();

  // Score each entry — lower is better
  const scored = SENSITIVE_ITEM_CATALOG.map((entry) => {
    let score = Infinity;

    // Exact alias match (best)
    if (entry.aliases.some((a) => a.toLowerCase() === term)) {
      score = 0;
    }
    // Alias starts-with
    else if (entry.aliases.some((a) => a.toLowerCase().startsWith(term))) {
      score = 1;
    }
    // Nomenclature includes
    else if (entry.nomenclature.toLowerCase().includes(term)) {
      score = 2;
    }
    // NSN starts-with
    else if (entry.nsn.startsWith(term)) {
      score = 3;
    }
    // NSN includes
    else if (entry.nsn.includes(term)) {
      score = 4;
    }
    // Alias includes
    else if (entry.aliases.some((a) => a.toLowerCase().includes(term))) {
      score = 5;
    }

    return { entry, score };
  })
    .filter((s) => s.score < Infinity)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map((s) => s.entry);
}
