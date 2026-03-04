"""Route file parsers for GeoJSON, KML/KMZ, GPX, and CSV formats.

Each parse function returns a list of dicts:
  [{name: str, waypoints: [{lat: float, lon: float, label?: str}],
    route_type?: str, description?: str}]
"""

import csv
import io
import json
import zipfile
from typing import Any

from defusedxml import ElementTree as ET


def parse_geojson(content: str) -> list[dict[str, Any]]:
    """Parse GeoJSON FeatureCollection with LineString/MultiLineString geometries."""
    data = json.loads(content)
    routes: list[dict[str, Any]] = []

    features = []
    if data.get("type") == "FeatureCollection":
        features = data.get("features", [])
    elif data.get("type") == "Feature":
        features = [data]
    elif data.get("type") in ("LineString", "MultiLineString"):
        # Bare geometry — wrap it
        features = [{"type": "Feature", "geometry": data, "properties": {}}]

    for idx, feature in enumerate(features):
        geom = feature.get("geometry")
        if not geom:
            continue

        props = feature.get("properties") or {}
        name = props.get("name") or props.get("Name") or f"Route {idx + 1}"
        description = props.get("description") or props.get("Description")
        route_type = props.get("route_type") or props.get("routeType")

        geom_type = geom.get("type")
        coord_sets: list[list] = []

        if geom_type == "LineString":
            coord_sets.append(geom.get("coordinates", []))
        elif geom_type == "MultiLineString":
            coord_sets.extend(geom.get("coordinates", []))
        else:
            # Skip non-line geometries (Point, Polygon, etc.)
            continue

        for ci, coords in enumerate(coord_sets):
            waypoints = []
            for coord in coords:
                # GeoJSON coordinates are [lon, lat, alt?]
                if len(coord) >= 2:
                    waypoints.append({"lat": float(coord[1]), "lon": float(coord[0])})

            if waypoints:
                route_name = name if len(coord_sets) == 1 else f"{name} ({ci + 1})"
                route: dict[str, Any] = {
                    "name": route_name,
                    "waypoints": waypoints,
                }
                if route_type:
                    route["route_type"] = route_type
                if description:
                    route["description"] = description
                routes.append(route)

    return routes


# KML namespace
_KML_NS = "http://www.opengis.net/kml/2.2"


def _parse_kml_coordinates(coord_text: str) -> list[dict[str, float]]:
    """Parse a KML <coordinates> element text into waypoints."""
    waypoints = []
    for token in coord_text.strip().split():
        parts = token.split(",")
        if len(parts) >= 2:
            try:
                lon = float(parts[0])
                lat = float(parts[1])
                waypoints.append({"lat": lat, "lon": lon})
            except ValueError:
                continue
    return waypoints


def parse_kml(content: bytes) -> list[dict[str, Any]]:
    """Parse KML content, extracting Placemark/LineString coordinates.

    Uses defusedxml.ElementTree for safe XML parsing.
    """
    root = ET.fromstring(content)
    routes: list[dict[str, Any]] = []

    # KML can have namespace or not; search for both
    # Try with namespace first, then without
    placemarks = root.iter(f"{{{_KML_NS}}}Placemark")
    placemark_list = list(placemarks)

    if not placemark_list:
        # Try without namespace
        placemark_list = list(root.iter("Placemark"))

    ns = f"{{{_KML_NS}}}" if placemark_list and placemark_list[0].tag.startswith("{") else ""

    for idx, pm in enumerate(placemark_list):
        # Extract name
        name_el = pm.find(f"{ns}name")
        name = name_el.text.strip() if name_el is not None and name_el.text else f"Route {idx + 1}"

        # Extract description
        desc_el = pm.find(f"{ns}description")
        description = desc_el.text.strip() if desc_el is not None and desc_el.text else None

        # Look for LineString coordinates (directly or nested in MultiGeometry)
        all_waypoints: list[dict[str, float]] = []

        for line_string in pm.iter(f"{ns}LineString"):
            coord_el = line_string.find(f"{ns}coordinates")
            if coord_el is not None and coord_el.text:
                all_waypoints.extend(_parse_kml_coordinates(coord_el.text))

        if all_waypoints:
            route: dict[str, Any] = {
                "name": name,
                "waypoints": all_waypoints,
            }
            if description:
                route["description"] = description
            routes.append(route)

    return routes


# KMZ safety limits
_MAX_KMZ_FILES = 10  # Maximum number of KML files in a KMZ archive
_MAX_KMZ_DECOMPRESSED = 50 * 1024 * 1024  # 50 MB decompressed limit


def parse_kmz(content: bytes) -> list[dict[str, Any]]:
    """Parse a KMZ file (ZIP containing .kml) and return routes.

    Includes zip bomb and path traversal protections.
    """
    with zipfile.ZipFile(io.BytesIO(content)) as zf:
        kml_names = [
            n for n in zf.namelist()
            if n.lower().endswith(".kml")
            and ".." not in n  # Reject path traversal
            and not n.startswith("/")  # Reject absolute paths
        ]
        if not kml_names:
            raise ValueError("KMZ archive does not contain a .kml file")

        if len(kml_names) > _MAX_KMZ_FILES:
            raise ValueError(
                f"KMZ archive contains {len(kml_names)} KML files, "
                f"exceeding the limit of {_MAX_KMZ_FILES}"
            )

        all_routes: list[dict[str, Any]] = []
        for kml_name in kml_names:
            # Check decompressed size before reading
            info = zf.getinfo(kml_name)
            if info.file_size > _MAX_KMZ_DECOMPRESSED:
                raise ValueError(
                    f"KML file '{kml_name}' decompressed size "
                    f"({info.file_size} bytes) exceeds limit"
                )
            kml_bytes = zf.read(kml_name)
            all_routes.extend(parse_kml(kml_bytes))

    return all_routes


# GPX namespace
_GPX_NS = "http://www.topografix.com/GPX/1/1"


def parse_gpx(content: bytes) -> list[dict[str, Any]]:
    """Parse GPX content, extracting tracks (trk/trkseg/trkpt) and routes (rte/rtept).

    Uses defusedxml.ElementTree for safe XML parsing.
    """
    root = ET.fromstring(content)
    routes: list[dict[str, Any]] = []

    # Determine namespace
    ns = f"{{{_GPX_NS}}}" if root.tag.startswith("{") else ""

    # Parse tracks (trk -> trkseg -> trkpt)
    for trk_idx, trk in enumerate(root.iter(f"{ns}trk")):
        name_el = trk.find(f"{ns}name")
        name = name_el.text.strip() if name_el is not None and name_el.text else f"Track {trk_idx + 1}"

        desc_el = trk.find(f"{ns}desc")
        description = desc_el.text.strip() if desc_el is not None and desc_el.text else None

        for seg_idx, trkseg in enumerate(trk.iter(f"{ns}trkseg")):
            waypoints = []
            for trkpt in trkseg.iter(f"{ns}trkpt"):
                lat_str = trkpt.get("lat")
                lon_str = trkpt.get("lon")
                if lat_str and lon_str:
                    wp: dict[str, Any] = {
                        "lat": float(lat_str),
                        "lon": float(lon_str),
                    }
                    # Check for name sub-element as label
                    wp_name = trkpt.find(f"{ns}name")
                    if wp_name is not None and wp_name.text:
                        wp["label"] = wp_name.text.strip()
                    waypoints.append(wp)

            if waypoints:
                seg_name = name if seg_idx == 0 else f"{name} (seg {seg_idx + 1})"
                route: dict[str, Any] = {
                    "name": seg_name,
                    "waypoints": waypoints,
                }
                if description:
                    route["description"] = description
                routes.append(route)

    # Parse routes (rte -> rtept)
    for rte_idx, rte in enumerate(root.iter(f"{ns}rte")):
        name_el = rte.find(f"{ns}name")
        name = name_el.text.strip() if name_el is not None and name_el.text else f"Route {rte_idx + 1}"

        desc_el = rte.find(f"{ns}desc")
        description = desc_el.text.strip() if desc_el is not None and desc_el.text else None

        waypoints = []
        for rtept in rte.iter(f"{ns}rtept"):
            lat_str = rtept.get("lat")
            lon_str = rtept.get("lon")
            if lat_str and lon_str:
                wp = {
                    "lat": float(lat_str),
                    "lon": float(lon_str),
                }
                wp_name = rtept.find(f"{ns}name")
                if wp_name is not None and wp_name.text:
                    wp["label"] = wp_name.text.strip()
                waypoints.append(wp)

        if waypoints:
            route = {
                "name": name,
                "waypoints": waypoints,
            }
            if description:
                route["description"] = description
            routes.append(route)

    return routes


def parse_route_csv(content: str) -> list[dict[str, Any]]:
    """Parse CSV with columns: route_name, lat, lon, label (optional).

    Groups rows by route_name to produce one route per unique name.
    """
    reader = csv.DictReader(io.StringIO(content))

    # Normalize header names (strip whitespace, lowercase)
    if reader.fieldnames is None:
        raise ValueError("CSV file has no header row")

    # Build a mapping from normalized header to actual header
    header_map: dict[str, str] = {}
    for h in reader.fieldnames:
        normalized = h.strip().lower().replace(" ", "_")
        header_map[normalized] = h

    # Verify required columns exist
    if "route_name" not in header_map:
        raise ValueError(
            "CSV must contain a 'route_name' column. "
            f"Found columns: {list(reader.fieldnames)}"
        )
    if "lat" not in header_map:
        raise ValueError(
            "CSV must contain a 'lat' column. "
            f"Found columns: {list(reader.fieldnames)}"
        )
    if "lon" not in header_map:
        raise ValueError(
            "CSV must contain a 'lon' column. "
            f"Found columns: {list(reader.fieldnames)}"
        )

    route_name_col = header_map["route_name"]
    lat_col = header_map["lat"]
    lon_col = header_map["lon"]
    label_col = header_map.get("label")

    # Group waypoints by route_name, preserving order
    from collections import OrderedDict

    grouped: OrderedDict[str, list[dict[str, Any]]] = OrderedDict()

    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        route_name = row.get(route_name_col, "").strip()
        if not route_name:
            continue

        lat_str = row.get(lat_col, "").strip()
        lon_str = row.get(lon_col, "").strip()
        if not lat_str or not lon_str:
            continue

        try:
            lat = float(lat_str)
            lon = float(lon_str)
        except ValueError:
            continue  # Skip rows with non-numeric coordinates

        wp: dict[str, Any] = {"lat": lat, "lon": lon}

        if label_col:
            label_val = row.get(label_col, "").strip()
            if label_val:
                wp["label"] = label_val

        if route_name not in grouped:
            grouped[route_name] = []
        grouped[route_name].append(wp)

    routes: list[dict[str, Any]] = []
    for name, waypoints in grouped.items():
        if waypoints:
            routes.append({
                "name": name,
                "waypoints": waypoints,
            })

    return routes
