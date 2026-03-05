// =============================================================================
// Catalog API — Equipment, Supply, and Ammunition master data search
// Includes inline mock data for demo mode
// =============================================================================

import type {
  EquipmentCatalogItem,
  SupplyCatalogItem,
  AmmunitionCatalogItem,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock Equipment Catalog — 30+ items across major USMC categories
// ---------------------------------------------------------------------------

const MOCK_EQUIPMENT: EquipmentCatalogItem[] = [
  // Tactical Vehicles
  { id: 1, tamcn: 'B0001', niin: '012345678', nsn: '2320-01-234-5678', nomenclature: 'TRUCK, UTILITY, ENHANCED CAPACITY', commonName: 'HMMWV M1151', category: 'Tactical Vehicle', subcategory: 'Light Tactical', supplyClass: 'VII', manufacturer: 'AM General', weightLbs: 12100, crewSize: 2, paxCapacity: 4, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 2, tamcn: 'B0002', niin: '012345679', nsn: '2320-01-234-5679', nomenclature: 'TRUCK, UTILITY TACTICAL, 1-1/4T', commonName: 'HMMWV M998', category: 'Tactical Vehicle', subcategory: 'Light Tactical', supplyClass: 'VII', manufacturer: 'AM General', weightLbs: 10300, crewSize: 2, paxCapacity: 4, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 3, tamcn: 'B0154', niin: '014289456', nsn: '2320-01-428-9456', nomenclature: 'TRUCK, CARGO, 7T, MTVR', commonName: 'MTVR MK23', category: 'Tactical Vehicle', subcategory: 'Medium Tactical', supplyClass: 'VII', manufacturer: 'Oshkosh Defense', weightLbs: 30000, crewSize: 2, paxCapacity: 2, isSerialized: true, echelonTypical: 'BATTALION', notes: 'Medium Tactical Vehicle Replacement' },
  { id: 4, tamcn: 'B0155', niin: '014289457', nsn: '2320-01-428-9457', nomenclature: 'TRUCK, WRECKER, 7T, MTVR', commonName: 'MTVR MK36', category: 'Tactical Vehicle', subcategory: 'Medium Tactical', supplyClass: 'VII', manufacturer: 'Oshkosh Defense', weightLbs: 37000, crewSize: 2, paxCapacity: 2, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 5, tamcn: 'B0186', niin: '015672345', nsn: '2320-01-567-2345', nomenclature: 'TRUCK, LOGISTICS VEHICLE SYSTEM', commonName: 'LVSR MK48', category: 'Tactical Vehicle', subcategory: 'Heavy Tactical', supplyClass: 'VII', manufacturer: 'Oshkosh Defense', weightLbs: 48000, crewSize: 2, paxCapacity: 2, isSerialized: true, echelonTypical: 'BATTALION', notes: 'Logistics Vehicle System Replacement' },
  { id: 6, tamcn: 'E1271', niin: '015891200', nsn: '2320-01-589-1200', nomenclature: 'JOINT LIGHT TACTICAL VEHICLE', commonName: 'JLTV M1280', category: 'Tactical Vehicle', subcategory: 'Light Tactical', supplyClass: 'VII', manufacturer: 'Oshkosh Defense', weightLbs: 14000, crewSize: 2, paxCapacity: 4, isSerialized: true, echelonTypical: 'COMPANY', notes: 'HMMWV replacement program' },

  // Combat Vehicles
  { id: 7, tamcn: 'A0800', niin: '011123456', nsn: '2350-01-112-3456', nomenclature: 'ASSAULT AMPHIBIOUS VEHICLE, PERSONNEL', commonName: 'AAV-P7/A1', category: 'Combat Vehicle', subcategory: 'Amphibious', supplyClass: 'VII', manufacturer: 'BAE Systems', weightLbs: 50350, crewSize: 3, paxCapacity: 21, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 8, tamcn: 'A0801', niin: '011123457', nsn: '2350-01-112-3457', nomenclature: 'ASSAULT AMPHIBIOUS VEHICLE, COMMAND', commonName: 'AAV-C7/A1', category: 'Combat Vehicle', subcategory: 'Amphibious', supplyClass: 'VII', manufacturer: 'BAE Systems', weightLbs: 50800, crewSize: 5, paxCapacity: 12, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 9, tamcn: 'A1203', niin: '016782100', nsn: '2350-01-678-2100', nomenclature: 'AMPHIBIOUS COMBAT VEHICLE', commonName: 'ACV-30', category: 'Combat Vehicle', subcategory: 'Amphibious', supplyClass: 'VII', manufacturer: 'BAE Systems', weightLbs: 70000, crewSize: 3, paxCapacity: 13, isSerialized: true, echelonTypical: 'COMPANY', notes: 'AAV replacement program' },
  { id: 10, tamcn: 'D1000', niin: '013456789', nsn: '2350-01-345-6789', nomenclature: 'TANK, COMBAT, FULL TRACKED', commonName: 'M1A1 ABRAMS', category: 'Combat Vehicle', subcategory: 'Armor', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 136000, crewSize: 4, paxCapacity: 0, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 11, tamcn: 'D1100', niin: '014567890', nsn: '2350-01-456-7890', nomenclature: 'LIGHT ARMORED VEHICLE', commonName: 'LAV-25', category: 'Combat Vehicle', subcategory: 'Wheeled Armor', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 28200, crewSize: 3, paxCapacity: 6, isSerialized: true, echelonTypical: 'COMPANY', notes: null },

  // Small Arms
  { id: 12, tamcn: 'C6710', niin: '009876543', nsn: '1005-01-987-6543', nomenclature: 'RIFLE, 5.56MM, M4A1', commonName: 'M4A1 CARBINE', category: 'Small Arms', subcategory: 'Rifle', supplyClass: 'VII', manufacturer: 'Colt/FN', weightLbs: 7, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'INDIVIDUAL', notes: null },
  { id: 13, tamcn: 'C6715', niin: '016234567', nsn: '1005-01-623-4567', nomenclature: 'RIFLE, 5.56MM, M27 IAR', commonName: 'M27 IAR', category: 'Small Arms', subcategory: 'Rifle', supplyClass: 'VII', manufacturer: 'H&K', weightLbs: 8, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'INDIVIDUAL', notes: 'Infantry Automatic Rifle' },
  { id: 14, tamcn: 'C6755', niin: '008765432', nsn: '1005-01-876-5432', nomenclature: 'MACHINE GUN, 7.62MM, M240B', commonName: 'M240B', category: 'Small Arms', subcategory: 'Machine Gun', supplyClass: 'VII', manufacturer: 'FN Herstal', weightLbs: 27, crewSize: 2, paxCapacity: null, isSerialized: true, echelonTypical: 'SQUAD', notes: null },
  { id: 15, tamcn: 'C6780', niin: '007654321', nsn: '1005-01-765-4321', nomenclature: 'MACHINE GUN, CAL .50, M2A1', commonName: 'M2A1 HMG', category: 'Small Arms', subcategory: 'Machine Gun', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 84, crewSize: 2, paxCapacity: null, isSerialized: true, echelonTypical: 'PLATOON', notes: null },
  { id: 16, tamcn: 'C6800', niin: '006543210', nsn: '1010-01-654-3210', nomenclature: 'PISTOL, CALIBER .45, M45A1', commonName: 'M45A1 MEUSOC', category: 'Small Arms', subcategory: 'Pistol', supplyClass: 'VII', manufacturer: 'Colt', weightLbs: 3, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'INDIVIDUAL', notes: null },
  { id: 17, tamcn: 'C6802', niin: '017345678', nsn: '1005-01-734-5678', nomenclature: 'PISTOL, 9MM, M18', commonName: 'M18 MHS', category: 'Small Arms', subcategory: 'Pistol', supplyClass: 'VII', manufacturer: 'SIG Sauer', weightLbs: 2, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'INDIVIDUAL', notes: 'Modular Handgun System' },

  // Artillery
  { id: 18, tamcn: 'D0940', niin: '010234567', nsn: '1025-01-023-4567', nomenclature: 'HOWITZER, LIGHT TOWED, 155MM', commonName: 'M777A2', category: 'Artillery', subcategory: 'Towed', supplyClass: 'VII', manufacturer: 'BAE Systems', weightLbs: 9300, crewSize: 8, paxCapacity: null, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 19, tamcn: 'D0950', niin: '010234568', nsn: '1025-01-023-4568', nomenclature: 'MORTAR, 81MM, M252A1', commonName: '81MM MORTAR', category: 'Artillery', subcategory: 'Mortar', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 90, crewSize: 4, paxCapacity: null, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 20, tamcn: 'D0960', niin: '010234569', nsn: '1025-01-023-4569', nomenclature: 'MORTAR, 60MM, M224A1', commonName: '60MM MORTAR', category: 'Artillery', subcategory: 'Mortar', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 47, crewSize: 3, paxCapacity: null, isSerialized: true, echelonTypical: 'PLATOON', notes: null },

  // Communications
  { id: 21, tamcn: 'E0854', niin: '013456001', nsn: '5820-01-345-6001', nomenclature: 'RADIO SET, AN/PRC-117G', commonName: 'PRC-117G', category: 'Communications', subcategory: 'Manpack Radio', supplyClass: 'VII', manufacturer: 'L3Harris', weightLbs: 12, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'PLATOON', notes: 'Multiband manpack radio' },
  { id: 22, tamcn: 'E0856', niin: '013456002', nsn: '5820-01-345-6002', nomenclature: 'RADIO SET, AN/PRC-152A', commonName: 'PRC-152A', category: 'Communications', subcategory: 'Handheld Radio', supplyClass: 'VII', manufacturer: 'L3Harris', weightLbs: 3, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'SQUAD', notes: 'Multiband handheld radio' },
  { id: 23, tamcn: 'E0900', niin: '015678901', nsn: '5820-01-567-8901', nomenclature: 'RADIO SET, VEHICULAR, AN/VRC-110', commonName: 'VRC-110', category: 'Communications', subcategory: 'Vehicular Radio', supplyClass: 'VII', manufacturer: 'L3Harris', weightLbs: 35, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 24, tamcn: 'E0920', niin: '016789012', nsn: '5895-01-678-9012', nomenclature: 'COMMAND POST SYSTEM, NETWORKED', commonName: 'CPCE BLOCK II', category: 'Communications', subcategory: 'C2 System', supplyClass: 'VII', manufacturer: 'General Dynamics', weightLbs: 250, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'BATTALION', notes: 'Command Post Computing Environment' },

  // Aviation
  { id: 25, tamcn: 'A2100', niin: '011234001', nsn: '1520-01-123-4001', nomenclature: 'HELICOPTER, ATTACK', commonName: 'AH-1Z VIPER', category: 'Aviation', subcategory: 'Rotary Wing', supplyClass: 'VII', manufacturer: 'Bell', weightLbs: 12300, crewSize: 2, paxCapacity: 0, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 26, tamcn: 'A2200', niin: '011234002', nsn: '1520-01-123-4002', nomenclature: 'HELICOPTER, UTILITY', commonName: 'UH-1Y VENOM', category: 'Aviation', subcategory: 'Rotary Wing', supplyClass: 'VII', manufacturer: 'Bell', weightLbs: 11900, crewSize: 4, paxCapacity: 8, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 27, tamcn: 'A2300', niin: '011234003', nsn: '1520-01-123-4003', nomenclature: 'HELICOPTER, HEAVY LIFT', commonName: 'CH-53K KING STALLION', category: 'Aviation', subcategory: 'Rotary Wing', supplyClass: 'VII', manufacturer: 'Sikorsky', weightLbs: 33200, crewSize: 5, paxCapacity: 30, isSerialized: true, echelonTypical: 'BATTALION', notes: null },
  { id: 28, tamcn: 'A2400', niin: '011234004', nsn: '1560-01-123-4004', nomenclature: 'AIRCRAFT, TILTROTOR', commonName: 'MV-22B OSPREY', category: 'Aviation', subcategory: 'Tiltrotor', supplyClass: 'VII', manufacturer: 'Bell-Boeing', weightLbs: 33140, crewSize: 4, paxCapacity: 24, isSerialized: true, echelonTypical: 'BATTALION', notes: null },

  // Engineering / Support
  { id: 29, tamcn: 'F1200', niin: '012345100', nsn: '3805-01-234-5100', nomenclature: 'TRACTOR, RUBBER TIRED, SMALL', commonName: 'TRAM', category: 'Engineering', subcategory: 'Construction', supplyClass: 'VII', manufacturer: 'JCB', weightLbs: 14000, crewSize: 1, paxCapacity: 0, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 30, tamcn: 'G0100', niin: '012345200', nsn: '4240-01-234-5200', nomenclature: 'GENERATOR SET, 60KW, MEP-806B', commonName: '60KW GENERATOR', category: 'Support', subcategory: 'Power Generation', supplyClass: 'VII', manufacturer: 'Cummins', weightLbs: 4400, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'COMPANY', notes: null },
  { id: 31, tamcn: 'G0150', niin: '012345300', nsn: '4240-01-234-5300', nomenclature: 'GENERATOR SET, 10KW, MEP-803A', commonName: '10KW GENERATOR', category: 'Support', subcategory: 'Power Generation', supplyClass: 'VII', manufacturer: 'Cummins', weightLbs: 900, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'PLATOON', notes: null },
  { id: 32, tamcn: 'B0310', niin: '012345400', nsn: '2540-01-234-5400', nomenclature: 'TRAILER, CARGO, 3/4T, M1102', commonName: 'HMMWV TRAILER', category: 'Tactical Vehicle', subcategory: 'Trailer', supplyClass: 'VII', manufacturer: 'Stewart & Stevenson', weightLbs: 1120, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'COMPANY', notes: null },

  // Optics / ISR
  { id: 33, tamcn: 'E2500', niin: '017891234', nsn: '5855-01-789-1234', nomenclature: 'SIGHT, THERMAL, AN/PAS-28', commonName: 'LTWS', category: 'Optics', subcategory: 'Thermal', supplyClass: 'VII', manufacturer: 'DRS Technologies', weightLbs: 5, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'SQUAD', notes: 'Lightweight Thermal Weapon Sight' },
  { id: 34, tamcn: 'E2600', niin: '017891235', nsn: '5855-01-789-1235', nomenclature: 'NIGHT VISION GOGGLES, AN/PVS-31A', commonName: 'BNVD', category: 'Optics', subcategory: 'Night Vision', supplyClass: 'VII', manufacturer: 'L3Harris', weightLbs: 1, crewSize: null, paxCapacity: null, isSerialized: true, echelonTypical: 'INDIVIDUAL', notes: 'Binocular NVD' },
];

// ---------------------------------------------------------------------------
// Mock Supply Catalog — 15 items
// ---------------------------------------------------------------------------

const MOCK_SUPPLY: SupplyCatalogItem[] = [
  { id: 1, nsn: '9130-01-456-7890', niin: '014567890', lin: 'F76000', dodic: null, nomenclature: 'FUEL, DIESEL, JP-8', commonName: 'JP-8 FUEL', supplyClass: 'III', supplySubclass: 'IIIA', unitOfIssue: 'GL', unitOfIssueDesc: 'Gallon', category: 'POL', subcategory: 'Aviation/Ground Fuel', isControlled: false, isHazmat: true, shelfLifeDays: null, notes: null },
  { id: 2, nsn: '9130-01-456-7891', niin: '014567891', lin: 'M85000', dodic: null, nomenclature: 'FUEL, MOTOR GASOLINE, UNLEADED', commonName: 'MOGAS', supplyClass: 'III', supplySubclass: null, unitOfIssue: 'GL', unitOfIssueDesc: 'Gallon', category: 'POL', subcategory: 'Ground Fuel', isControlled: false, isHazmat: true, shelfLifeDays: null, notes: null },
  { id: 3, nsn: '9150-01-567-8901', niin: '015678901', lin: null, dodic: null, nomenclature: 'OIL, LUBRICATING, ENGINE, 15W40', commonName: 'ENGINE OIL 15W40', supplyClass: 'III', supplySubclass: null, unitOfIssue: 'QT', unitOfIssueDesc: 'Quart', category: 'POL', subcategory: 'Lubricant', isControlled: false, isHazmat: false, shelfLifeDays: 1825, notes: null },
  { id: 4, nsn: '8945-01-234-5678', niin: '012345678', lin: null, dodic: null, nomenclature: 'MEAL, READY TO EAT, INDIVIDUAL', commonName: 'MRE', supplyClass: 'I', supplySubclass: null, unitOfIssue: 'CS', unitOfIssueDesc: 'Case (12 meals)', category: 'Subsistence', subcategory: 'Combat Ration', isControlled: false, isHazmat: false, shelfLifeDays: 1095, notes: '12 meals per case' },
  { id: 5, nsn: '8945-01-234-5679', niin: '012345679', lin: null, dodic: null, nomenclature: 'UNITIZED GROUP RATION, HEAT & SERVE', commonName: 'UGR-H&S', supplyClass: 'I', supplySubclass: null, unitOfIssue: 'CS', unitOfIssueDesc: 'Case (50 servings)', category: 'Subsistence', subcategory: 'Group Ration', isControlled: false, isHazmat: false, shelfLifeDays: 365, notes: null },
  { id: 6, nsn: '6515-01-345-6789', niin: '013456789', lin: null, dodic: null, nomenclature: 'COMBAT LIFESAVER BAG, COMPLETE', commonName: 'CLS BAG', supplyClass: 'VIII', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Medical', subcategory: 'Trauma Kit', isControlled: true, isHazmat: false, shelfLifeDays: 730, notes: 'Contains controlled medications' },
  { id: 7, nsn: '6510-01-234-0001', niin: '012340001', lin: null, dodic: null, nomenclature: 'TOURNIQUET, COMBAT APPLICATION', commonName: 'CAT TOURNIQUET', supplyClass: 'VIII', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Medical', subcategory: 'Trauma', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: null },
  { id: 8, nsn: '5180-01-456-0001', niin: '014560001', lin: null, dodic: null, nomenclature: 'TOOL KIT, GENERAL MECHANICS', commonName: 'MECH TOOL KIT', supplyClass: 'IX', supplySubclass: null, unitOfIssue: 'KT', unitOfIssueDesc: 'Kit', category: 'Repair Parts', subcategory: 'Tools', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: null },
  { id: 9, nsn: '2590-01-567-0001', niin: '015670001', lin: null, dodic: null, nomenclature: 'TIRE, PNEUMATIC, MTVR', commonName: 'MTVR TIRE', supplyClass: 'IX', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Repair Parts', subcategory: 'Vehicular', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: '16.00R20 XZL' },
  { id: 10, nsn: '2520-01-678-0001', niin: '016780001', lin: null, dodic: null, nomenclature: 'FILTER, OIL, ENGINE', commonName: 'OIL FILTER - HMMWV', supplyClass: 'IX', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Repair Parts', subcategory: 'Vehicular', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: 'Fits HMMWV 6.5L diesel' },
  { id: 11, nsn: '5340-01-789-0001', niin: '017890001', lin: null, dodic: null, nomenclature: 'SANDBAG, EMPTY, POLYPROPYLENE', commonName: 'SANDBAG', supplyClass: 'IV', supplySubclass: null, unitOfIssue: 'BD', unitOfIssueDesc: 'Bundle (100)', category: 'Barrier Material', subcategory: 'Fortification', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: '100 per bundle' },
  { id: 12, nsn: '5660-01-890-0001', niin: '018900001', lin: null, dodic: null, nomenclature: 'CONCERTINA WIRE, TRIPLE STANDARD', commonName: 'C-WIRE', supplyClass: 'IV', supplySubclass: null, unitOfIssue: 'CO', unitOfIssueDesc: 'Coil', category: 'Barrier Material', subcategory: 'Obstacle', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: null },
  { id: 13, nsn: '6850-01-234-0010', niin: '012340010', lin: null, dodic: null, nomenclature: 'WATER, PURIFICATION TABLETS, IODINE', commonName: 'WATER PURIFICATION TABS', supplyClass: 'VI', supplySubclass: null, unitOfIssue: 'BX', unitOfIssueDesc: 'Box (50 tablets)', category: 'Personal Demand', subcategory: 'Hygiene', isControlled: false, isHazmat: false, shelfLifeDays: 1460, notes: null },
  { id: 14, nsn: '8340-01-456-0010', niin: '014560010', lin: null, dodic: null, nomenclature: 'TENT, GENERAL PURPOSE, MEDIUM', commonName: 'GP MEDIUM TENT', supplyClass: 'II', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Clothing/Equipment', subcategory: 'Shelter', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: '16x32 foot, sleeps 10' },
  { id: 15, nsn: '2910-01-567-0010', niin: '015670010', lin: null, dodic: null, nomenclature: 'FUEL INJECTOR, DIESEL ENGINE', commonName: 'INJECTOR - MTVR', supplyClass: 'IX', supplySubclass: null, unitOfIssue: 'EA', unitOfIssueDesc: 'Each', category: 'Repair Parts', subcategory: 'Engine', isControlled: false, isHazmat: false, shelfLifeDays: null, notes: 'Caterpillar C12 engine' },
];

// ---------------------------------------------------------------------------
// Mock Ammunition Catalog — 10 items
// ---------------------------------------------------------------------------

const MOCK_AMMO: AmmunitionCatalogItem[] = [
  { id: 1, dodic: 'A059', nsn: '1305-01-234-5001', nomenclature: 'CARTRIDGE, 5.56MM, BALL, M855A1', commonName: '5.56 BALL', caliber: '5.56x45mm', weaponSystem: 'M4A1/M27 IAR', unitOfIssue: 'RD', roundsPerUnit: 1, weightPerRoundLbs: 0.027, isControlled: true, hazardClass: '1.4S', notes: 'Enhanced Performance Round' },
  { id: 2, dodic: 'A064', nsn: '1305-01-234-5002', nomenclature: 'CARTRIDGE, 5.56MM, TRACER, M856A1', commonName: '5.56 TRACER', caliber: '5.56x45mm', weaponSystem: 'M4A1/M27 IAR', unitOfIssue: 'RD', roundsPerUnit: 1, weightPerRoundLbs: 0.027, isControlled: true, hazardClass: '1.4S', notes: null },
  { id: 3, dodic: 'A131', nsn: '1305-01-345-6001', nomenclature: 'CARTRIDGE, 7.62MM, BALL, M80A1', commonName: '7.62 BALL', caliber: '7.62x51mm', weaponSystem: 'M240B', unitOfIssue: 'RD', roundsPerUnit: 1, weightPerRoundLbs: 0.058, isControlled: true, hazardClass: '1.4S', notes: null },
  { id: 4, dodic: 'A557', nsn: '1305-01-456-7001', nomenclature: 'CARTRIDGE, CAL .50, BALL, M33', commonName: '.50 CAL BALL', caliber: '.50 BMG', weaponSystem: 'M2A1', unitOfIssue: 'RD', roundsPerUnit: 1, weightPerRoundLbs: 0.25, isControlled: true, hazardClass: '1.4S', notes: null },
  { id: 5, dodic: 'A363', nsn: '1305-01-234-5010', nomenclature: 'CARTRIDGE, 9MM, BALL, M882', commonName: '9MM BALL', caliber: '9x19mm', weaponSystem: 'M18', unitOfIssue: 'RD', roundsPerUnit: 1, weightPerRoundLbs: 0.018, isControlled: true, hazardClass: '1.4S', notes: null },
  { id: 6, dodic: 'B519', nsn: '1310-01-567-8001', nomenclature: 'GRENADE, HAND, FRAGMENTATION, M67', commonName: 'FRAG GRENADE', caliber: null, weaponSystem: null, unitOfIssue: 'EA', roundsPerUnit: 1, weightPerRoundLbs: 0.875, isControlled: true, hazardClass: '1.2G', notes: null },
  { id: 7, dodic: 'G878', nsn: '1310-01-678-9001', nomenclature: 'GRENADE, SMOKE, GREEN, M18', commonName: 'GREEN SMOKE', caliber: null, weaponSystem: null, unitOfIssue: 'EA', roundsPerUnit: 1, weightPerRoundLbs: 1.19, isControlled: true, hazardClass: '1.4G', notes: null },
  { id: 8, dodic: 'C445', nsn: '1315-01-345-6010', nomenclature: 'PROJECTILE, 155MM, HE, M795', commonName: '155 HE', caliber: '155mm', weaponSystem: 'M777A2', unitOfIssue: 'EA', roundsPerUnit: 1, weightPerRoundLbs: 95, isControlled: true, hazardClass: '1.1D', notes: null },
  { id: 9, dodic: 'B568', nsn: '1315-01-456-7010', nomenclature: 'CARTRIDGE, 81MM, HE, M821A2', commonName: '81MM HE', caliber: '81mm', weaponSystem: 'M252A1', unitOfIssue: 'EA', roundsPerUnit: 1, weightPerRoundLbs: 9.7, isControlled: true, hazardClass: '1.1D', notes: null },
  { id: 10, dodic: 'B611', nsn: '1315-01-567-8010', nomenclature: 'CARTRIDGE, 60MM, HE, M720A1', commonName: '60MM HE', caliber: '60mm', weaponSystem: 'M224A1', unitOfIssue: 'EA', roundsPerUnit: 1, weightPerRoundLbs: 3.7, isControlled: true, hazardClass: '1.1D', notes: null },
];

// ---------------------------------------------------------------------------
// Equipment Categories reference
// ---------------------------------------------------------------------------

const EQUIPMENT_CATEGORIES: { category: string; subcategories: string[] }[] = [
  { category: 'Tactical Vehicle', subcategories: ['Light Tactical', 'Medium Tactical', 'Heavy Tactical', 'Trailer'] },
  { category: 'Combat Vehicle', subcategories: ['Amphibious', 'Armor', 'Wheeled Armor'] },
  { category: 'Small Arms', subcategories: ['Rifle', 'Machine Gun', 'Pistol'] },
  { category: 'Artillery', subcategories: ['Towed', 'Mortar'] },
  { category: 'Communications', subcategories: ['Manpack Radio', 'Handheld Radio', 'Vehicular Radio', 'C2 System'] },
  { category: 'Aviation', subcategories: ['Rotary Wing', 'Tiltrotor'] },
  { category: 'Engineering', subcategories: ['Construction'] },
  { category: 'Support', subcategories: ['Power Generation'] },
  { category: 'Optics', subcategories: ['Thermal', 'Night Vision'] },
];

// ---------------------------------------------------------------------------
// Supply Classes reference
// ---------------------------------------------------------------------------

const SUPPLY_CLASSES: { code: string; name: string }[] = [
  { code: 'I', name: 'Subsistence' },
  { code: 'II', name: 'Clothing & Equipment' },
  { code: 'III', name: 'POL (Petroleum, Oils, Lubricants)' },
  { code: 'IIIA', name: 'Aviation Fuel' },
  { code: 'IV', name: 'Construction Materials' },
  { code: 'V', name: 'Ammunition' },
  { code: 'VI', name: 'Personal Demand Items' },
  { code: 'VII', name: 'Major End Items' },
  { code: 'VIII', name: 'Medical Material' },
  { code: 'IX', name: 'Repair Parts' },
  { code: 'X', name: 'Non-Military Programs' },
];

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function matchesQuery(q: string, ...fields: (string | null | undefined)[]): boolean {
  const lower = q.toLowerCase();
  return fields.some((f) => f != null && f.toLowerCase().includes(lower));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchEquipmentCatalog(
  q?: string,
  category?: string,
  limit?: number,
): Promise<EquipmentCatalogItem[]> {
  await delay(80 + Math.random() * 120);
  let results = [...MOCK_EQUIPMENT];
  if (category) {
    results = results.filter((item) => item.category === category);
  }
  if (q && q.trim().length > 0) {
    results = results.filter((item) =>
      matchesQuery(q, item.nomenclature, item.commonName, item.tamcn, item.nsn, item.manufacturer),
    );
  }
  return results.slice(0, limit ?? 20);
}

export async function searchSupplyCatalog(
  q?: string,
  supplyClass?: string,
  limit?: number,
): Promise<SupplyCatalogItem[]> {
  await delay(80 + Math.random() * 120);
  let results = [...MOCK_SUPPLY];
  if (supplyClass) {
    results = results.filter((item) => item.supplyClass === supplyClass);
  }
  if (q && q.trim().length > 0) {
    results = results.filter((item) =>
      matchesQuery(q, item.nomenclature, item.commonName, item.nsn, item.lin, item.dodic),
    );
  }
  return results.slice(0, limit ?? 20);
}

export async function searchAmmunitionCatalog(
  q?: string,
  caliber?: string,
  limit?: number,
): Promise<AmmunitionCatalogItem[]> {
  await delay(80 + Math.random() * 120);
  let results = [...MOCK_AMMO];
  if (caliber) {
    results = results.filter((item) => item.caliber === caliber);
  }
  if (q && q.trim().length > 0) {
    results = results.filter((item) =>
      matchesQuery(q, item.nomenclature, item.commonName, item.dodic, item.nsn, item.caliber, item.weaponSystem),
    );
  }
  return results.slice(0, limit ?? 20);
}

export async function getEquipmentCategories(): Promise<{ category: string; subcategories: string[] }[]> {
  await delay(40);
  return [...EQUIPMENT_CATEGORIES];
}

export async function getSupplyClasses(): Promise<{ code: string; name: string }[]> {
  await delay(40);
  return [...SUPPLY_CLASSES];
}
