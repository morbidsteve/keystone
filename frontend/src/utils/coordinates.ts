import mgrs from 'mgrs';

export function latLonToMGRS(lat: number, lon: number): string {
  return mgrs.forward([lon, lat], 5);
}

export function mgrsToLatLon(mgrsStr: string): { lat: number; lon: number } {
  const [lon, lat] = mgrs.toPoint(mgrsStr.trim().replace(/\s/g, ''));
  return { lat, lon };
}

export function isValidMGRS(str: string): boolean {
  try {
    mgrs.toPoint(str.trim().replace(/\s/g, ''));
    return true;
  } catch {
    return false;
  }
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export function formatMGRS(lat: number, lon: number): string {
  return latLonToMGRS(lat, lon);
}

export function isValidGPS(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Detect if a string looks like GPS coords (e.g. "33.3012, -117.3542")
export function isGPSString(str: string): boolean {
  const gpsPattern = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/;
  return gpsPattern.test(str.trim());
}

// Parse GPS string into lat/lon
export function parseGPSString(str: string): { lat: number; lon: number } | null {
  const match = str.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (!isValidGPS(lat, lon)) return null;
  return { lat, lon };
}
