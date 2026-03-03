"""Coordinate conversion utilities: lat/lon <-> MGRS."""

import mgrs

_converter = mgrs.MGRS()


def latlon_to_mgrs(lat: float, lon: float, precision: int = 5) -> str:
    """Convert decimal lat/lon to MGRS string. Precision 5 = 1m accuracy."""
    return _converter.toMGRS(lat, lon, MGRSPrecision=precision)


def mgrs_to_latlon(mgrs_string: str) -> tuple[float, float]:
    """Convert MGRS string to (lat, lon) tuple."""
    lat, lon = _converter.toLatLon(mgrs_string.strip().replace(" ", ""))
    return float(lat), float(lon)


def validate_and_normalize(
    lat: float | None = None,
    lon: float | None = None,
    mgrs_str: str | None = None,
) -> tuple[float, float, str]:
    """Accept either GPS or MGRS, return (lat, lon, mgrs). Auto-converts."""
    if mgrs_str and mgrs_str.strip():
        lat, lon = mgrs_to_latlon(mgrs_str)
        return lat, lon, mgrs_str.strip().replace(" ", "")
    elif lat is not None and lon is not None:
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates: lat={lat}, lon={lon}")
        return lat, lon, latlon_to_mgrs(lat, lon)
    else:
        raise ValueError("Provide either lat/lon or MGRS")
