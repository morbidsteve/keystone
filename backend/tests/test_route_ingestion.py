"""Comprehensive tests for route ingestion, route deletion, and tile settings.

Covers:
  1. Route parser unit tests (parse_geojson, parse_kml, parse_gpx, parse_route_csv, parse_kmz)
  2. Route upload endpoint integration tests (POST /api/v1/ingestion/routes)
  3. Route delete endpoint tests (DELETE /api/v1/map/routes/{route_id})
  4. Tile settings endpoint tests (GET/PUT /api/v1/settings/tile-layers)
"""

import io
import json
import zipfile

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token, hash_password
from app.ingestion.route_parser import (
    parse_geojson,
    parse_gpx,
    parse_kml,
    parse_kmz,
    parse_route_csv,
)
from app.models.location import Route, RouteStatus, RouteType
from app.models.system_settings import SystemSetting
from app.models.unit import Unit
from app.models.user import Role, User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_kmz(kml_content: bytes) -> bytes:
    """Create a KMZ file (ZIP with a .kml inside) from raw KML bytes."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("doc.kml", kml_content)
    return buf.getvalue()


# Reusable test data
_VALID_GEOJSON_FC = json.dumps(
    {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "MSR Tampa"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [-117.1611, 32.7157],
                        [-117.2000, 32.7500],
                        [-117.2500, 32.7800],
                    ],
                },
            }
        ],
    }
)

_VALID_KML = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>ASR Dodge</name>
      <description>Alternate supply route</description>
      <LineString>
        <coordinates>
          -117.16,32.71,0
          -117.20,32.75,0
          -117.25,32.78,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""

_VALID_GPX = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk>
    <name>Convoy Route Alpha</name>
    <desc>Main logistics corridor</desc>
    <trkseg>
      <trkpt lat="32.7157" lon="-117.1611">
        <name>SP</name>
      </trkpt>
      <trkpt lat="32.7500" lon="-117.2000"/>
      <trkpt lat="32.7800" lon="-117.2500">
        <name>RP</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
"""

_VALID_CSV = "route_name,lat,lon,label\nMSR Tampa,32.7157,-117.1611,Start\nMSR Tampa,32.7500,-117.2000,\nMSR Tampa,32.7800,-117.2500,End\n"


# ---------------------------------------------------------------------------
# Fixtures local to this module
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def s3_user(db_session: AsyncSession, test_unit: Unit) -> User:
    """Create an S3 (Operations) user for route upload tests."""
    user = User(
        username="tests3ops",
        email="tests3@test.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test S3",
        role=Role.S3,
        unit_id=test_unit.id,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def s3_token(s3_user: User) -> str:
    """JWT for the S3 user."""
    return create_access_token(
        data={
            "sub": s3_user.username,
            "role": s3_user.role.value,
            "unit_id": s3_user.unit_id,
        }
    )


@pytest_asyncio.fixture
async def commander_user(db_session: AsyncSession, test_unit: Unit) -> User:
    """Create a COMMANDER user."""
    user = User(
        username="testcdr",
        email="testcdr@test.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Commander",
        role=Role.COMMANDER,
        unit_id=test_unit.id,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def commander_token(commander_user: User) -> str:
    """JWT for the COMMANDER user."""
    return create_access_token(
        data={
            "sub": commander_user.username,
            "role": commander_user.role.value,
            "unit_id": commander_user.unit_id,
        }
    )


# ============================================================================
# 1. Route Parser Unit Tests (no DB needed)
# ============================================================================


@pytest.mark.asyncio
class TestParseGeoJSON:
    """Unit tests for parse_geojson."""

    async def test_feature_collection_with_linestring(self):
        """A FeatureCollection with a single LineString Feature yields one route."""
        routes = parse_geojson(_VALID_GEOJSON_FC)
        assert len(routes) == 1
        r = routes[0]
        assert r["name"] == "MSR Tampa"
        assert len(r["waypoints"]) == 3
        # GeoJSON is [lon, lat], parser should flip to {lat, lon}
        assert r["waypoints"][0]["lat"] == pytest.approx(32.7157, abs=1e-4)
        assert r["waypoints"][0]["lon"] == pytest.approx(-117.1611, abs=1e-4)

    async def test_single_feature(self):
        """A bare Feature (not wrapped in FeatureCollection) should still parse."""
        geojson = json.dumps(
            {
                "type": "Feature",
                "properties": {"name": "Route Bravo"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-117.1, 32.7], [-117.2, 32.8]],
                },
            }
        )
        routes = parse_geojson(geojson)
        assert len(routes) == 1
        assert routes[0]["name"] == "Route Bravo"
        assert len(routes[0]["waypoints"]) == 2

    async def test_bare_linestring_geometry(self):
        """A bare LineString geometry (no Feature wrapper) should parse."""
        geojson = json.dumps(
            {
                "type": "LineString",
                "coordinates": [[-117.1, 32.7], [-117.2, 32.8], [-117.3, 32.9]],
            }
        )
        routes = parse_geojson(geojson)
        assert len(routes) == 1
        # Default name when no properties exist
        assert "Route" in routes[0]["name"]
        assert len(routes[0]["waypoints"]) == 3

    async def test_multilinestring(self):
        """A MultiLineString should produce multiple routes with indexed names."""
        geojson = json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Split Route"},
                        "geometry": {
                            "type": "MultiLineString",
                            "coordinates": [
                                [[-117.1, 32.7], [-117.2, 32.8]],
                                [[-117.3, 32.9], [-117.4, 33.0]],
                            ],
                        },
                    }
                ],
            }
        )
        routes = parse_geojson(geojson)
        assert len(routes) == 2
        assert routes[0]["name"] == "Split Route (1)"
        assert routes[1]["name"] == "Split Route (2)"
        assert len(routes[0]["waypoints"]) == 2
        assert len(routes[1]["waypoints"]) == 2

    async def test_empty_feature_collection(self):
        """An empty FeatureCollection returns no routes."""
        geojson = json.dumps({"type": "FeatureCollection", "features": []})
        routes = parse_geojson(geojson)
        assert routes == []

    async def test_point_geometry_skipped(self):
        """Non-line geometries (Point, Polygon) are silently skipped."""
        geojson = json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "A Point"},
                        "geometry": {"type": "Point", "coordinates": [-117.1, 32.7]},
                    }
                ],
            }
        )
        routes = parse_geojson(geojson)
        assert routes == []

    async def test_properties_extraction(self):
        """route_type and description are extracted from properties."""
        geojson = json.dumps(
            {
                "type": "Feature",
                "properties": {
                    "name": "MSR Gold",
                    "route_type": "MSR",
                    "description": "Main highway",
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-117.1, 32.7], [-117.2, 32.8]],
                },
            }
        )
        routes = parse_geojson(geojson)
        assert len(routes) == 1
        assert routes[0]["route_type"] == "MSR"
        assert routes[0]["description"] == "Main highway"

    async def test_feature_without_geometry_skipped(self):
        """A Feature with no geometry key should be skipped."""
        geojson = json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Broken"},
                        "geometry": None,
                    },
                ],
            }
        )
        routes = parse_geojson(geojson)
        assert routes == []

    async def test_default_name_when_missing(self):
        """If properties has no name, a default 'Route N' is generated."""
        geojson = json.dumps(
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-117.1, 32.7], [-117.2, 32.8]],
                },
            }
        )
        routes = parse_geojson(geojson)
        assert len(routes) == 1
        assert routes[0]["name"] == "Route 1"


@pytest.mark.asyncio
class TestParseKML:
    """Unit tests for parse_kml."""

    async def test_valid_kml_with_namespace(self):
        """Standard KML with namespace should parse Placemark/LineString."""
        routes = parse_kml(_VALID_KML)
        assert len(routes) == 1
        r = routes[0]
        assert r["name"] == "ASR Dodge"
        assert r["description"] == "Alternate supply route"
        assert len(r["waypoints"]) == 3
        # KML coordinates are lon,lat,alt
        assert r["waypoints"][0]["lon"] == pytest.approx(-117.16, abs=0.01)
        assert r["waypoints"][0]["lat"] == pytest.approx(32.71, abs=0.01)

    async def test_kml_without_namespace(self):
        """KML without an xmlns should still parse."""
        kml_no_ns = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml>
  <Document>
    <Placemark>
      <name>No NS Route</name>
      <LineString>
        <coordinates>-117.16,32.71,0 -117.20,32.75,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""
        routes = parse_kml(kml_no_ns)
        assert len(routes) == 1
        assert routes[0]["name"] == "No NS Route"
        assert len(routes[0]["waypoints"]) == 2

    async def test_multiple_placemarks(self):
        """Multiple Placemarks yield multiple routes."""
        kml = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Route A</name>
      <LineString>
        <coordinates>-117.16,32.71,0 -117.20,32.75,0</coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Route B</name>
      <LineString>
        <coordinates>-117.30,32.80,0 -117.35,32.85,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""
        routes = parse_kml(kml)
        assert len(routes) == 2
        assert routes[0]["name"] == "Route A"
        assert routes[1]["name"] == "Route B"

    async def test_placemark_without_linestring_skipped(self):
        """Placemarks with only Point geometry produce no routes."""
        kml = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Just a Point</name>
      <Point><coordinates>-117.16,32.71,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>
"""
        routes = parse_kml(kml)
        assert routes == []

    async def test_default_name_when_missing(self):
        """Placemark without <name> gets 'Route N' default."""
        kml = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>-117.16,32.71,0 -117.20,32.75,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""
        routes = parse_kml(kml)
        assert len(routes) == 1
        assert routes[0]["name"] == "Route 1"


@pytest.mark.asyncio
class TestParseGPX:
    """Unit tests for parse_gpx."""

    async def test_valid_gpx_track(self):
        """A GPX file with a <trk> containing <trkseg> and <trkpt> elements."""
        routes = parse_gpx(_VALID_GPX)
        assert len(routes) == 1
        r = routes[0]
        assert r["name"] == "Convoy Route Alpha"
        assert r["description"] == "Main logistics corridor"
        assert len(r["waypoints"]) == 3
        assert r["waypoints"][0]["lat"] == pytest.approx(32.7157, abs=1e-4)
        assert r["waypoints"][0]["lon"] == pytest.approx(-117.1611, abs=1e-4)

    async def test_gpx_waypoint_labels(self):
        """Waypoints with <name> sub-elements get 'label' in the result."""
        routes = parse_gpx(_VALID_GPX)
        wps = routes[0]["waypoints"]
        # First and last have <name>
        assert wps[0]["label"] == "SP"
        assert "label" not in wps[1]
        assert wps[2]["label"] == "RP"

    async def test_gpx_route_elements(self):
        """GPX <rte>/<rtept> elements parse as routes."""
        gpx = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <rte>
    <name>Supply Corridor</name>
    <desc>Ammo resupply path</desc>
    <rtept lat="33.0" lon="-117.0">
      <name>WP1</name>
    </rtept>
    <rtept lat="33.1" lon="-117.1"/>
  </rte>
</gpx>
"""
        routes = parse_gpx(gpx)
        assert len(routes) == 1
        r = routes[0]
        assert r["name"] == "Supply Corridor"
        assert r["description"] == "Ammo resupply path"
        assert len(r["waypoints"]) == 2
        assert r["waypoints"][0]["label"] == "WP1"
        assert "label" not in r["waypoints"][1]

    async def test_gpx_multiple_segments(self):
        """Multiple track segments produce indexed route names."""
        gpx = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk>
    <name>Multi Seg</name>
    <trkseg>
      <trkpt lat="32.0" lon="-117.0"/>
      <trkpt lat="32.1" lon="-117.1"/>
    </trkseg>
    <trkseg>
      <trkpt lat="33.0" lon="-118.0"/>
      <trkpt lat="33.1" lon="-118.1"/>
    </trkseg>
  </trk>
</gpx>
"""
        routes = parse_gpx(gpx)
        assert len(routes) == 2
        assert routes[0]["name"] == "Multi Seg"
        assert routes[1]["name"] == "Multi Seg (seg 2)"

    async def test_gpx_without_namespace(self):
        """GPX without xmlns should still parse."""
        gpx = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>No NS Track</name>
    <trkseg>
      <trkpt lat="32.7" lon="-117.1"/>
      <trkpt lat="32.8" lon="-117.2"/>
    </trkseg>
  </trk>
</gpx>
"""
        routes = parse_gpx(gpx)
        assert len(routes) == 1
        assert routes[0]["name"] == "No NS Track"

    async def test_gpx_combined_tracks_and_routes(self):
        """Both <trk> and <rte> elements are parsed from the same file."""
        gpx = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk>
    <name>Track One</name>
    <trkseg>
      <trkpt lat="32.0" lon="-117.0"/>
      <trkpt lat="32.1" lon="-117.1"/>
    </trkseg>
  </trk>
  <rte>
    <name>Route One</name>
    <rtept lat="33.0" lon="-118.0"/>
    <rtept lat="33.1" lon="-118.1"/>
  </rte>
</gpx>
"""
        routes = parse_gpx(gpx)
        assert len(routes) == 2
        names = {r["name"] for r in routes}
        assert "Track One" in names
        assert "Route One" in names


@pytest.mark.asyncio
class TestParseRouteCSV:
    """Unit tests for parse_route_csv."""

    async def test_valid_csv(self):
        """Standard CSV with route_name, lat, lon, label columns."""
        routes = parse_route_csv(_VALID_CSV)
        assert len(routes) == 1
        r = routes[0]
        assert r["name"] == "MSR Tampa"
        assert len(r["waypoints"]) == 3
        assert r["waypoints"][0]["lat"] == pytest.approx(32.7157, abs=1e-4)
        assert r["waypoints"][0]["label"] == "Start"
        assert r["waypoints"][2]["label"] == "End"
        # Middle waypoint has no label since the CSV field is empty
        assert "label" not in r["waypoints"][1]

    async def test_multiple_routes_in_csv(self):
        """Multiple route_name values produce multiple routes."""
        csv_content = (
            "route_name,lat,lon\n"
            "Alpha,32.0,-117.0\n"
            "Alpha,32.1,-117.1\n"
            "Bravo,33.0,-118.0\n"
            "Bravo,33.1,-118.1\n"
        )
        routes = parse_route_csv(csv_content)
        assert len(routes) == 2
        names = [r["name"] for r in routes]
        assert "Alpha" in names
        assert "Bravo" in names

    async def test_missing_route_name_column(self):
        """CSV without 'route_name' column raises ValueError."""
        csv_content = "name,lat,lon\nTest,32.0,-117.0\n"
        with pytest.raises(ValueError, match="route_name"):
            parse_route_csv(csv_content)

    async def test_missing_lat_column(self):
        """CSV without 'lat' column raises ValueError."""
        csv_content = "route_name,latitude,lon\nTest,32.0,-117.0\n"
        with pytest.raises(ValueError, match="lat"):
            parse_route_csv(csv_content)

    async def test_missing_lon_column(self):
        """CSV without 'lon' column raises ValueError."""
        csv_content = "route_name,lat,longitude\nTest,32.0,-117.0\n"
        with pytest.raises(ValueError, match="lon"):
            parse_route_csv(csv_content)

    async def test_empty_csv(self):
        """CSV with header but no data rows returns empty list."""
        csv_content = "route_name,lat,lon\n"
        routes = parse_route_csv(csv_content)
        assert routes == []

    async def test_non_numeric_coords_skipped(self):
        """Rows with non-numeric lat/lon are silently skipped."""
        csv_content = "route_name,lat,lon\nTest,abc,-117.0\nTest,32.0,-117.0\n"
        routes = parse_route_csv(csv_content)
        assert len(routes) == 1
        assert len(routes[0]["waypoints"]) == 1

    async def test_whitespace_in_headers_tolerated(self):
        """Headers with leading/trailing spaces are normalized."""
        csv_content = " route_name , lat , lon \nTest,32.0,-117.0\n"
        routes = parse_route_csv(csv_content)
        assert len(routes) == 1

    async def test_blank_route_name_rows_skipped(self):
        """Rows where route_name is blank are skipped."""
        csv_content = "route_name,lat,lon\n,32.0,-117.0\nReal,33.0,-118.0\n"
        routes = parse_route_csv(csv_content)
        assert len(routes) == 1
        assert routes[0]["name"] == "Real"


@pytest.mark.asyncio
class TestParseKMZ:
    """Unit tests for parse_kmz."""

    async def test_valid_kmz(self):
        """A well-formed KMZ (ZIP with a .kml) should parse routes."""
        kmz_bytes = _make_kmz(_VALID_KML)
        routes = parse_kmz(kmz_bytes)
        assert len(routes) == 1
        assert routes[0]["name"] == "ASR Dodge"
        assert len(routes[0]["waypoints"]) == 3

    async def test_kmz_without_kml_raises(self):
        """A ZIP without any .kml file raises ValueError."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("readme.txt", "No KML here")
        with pytest.raises(ValueError, match="does not contain a .kml file"):
            parse_kmz(buf.getvalue())

    async def test_kmz_multiple_kml_files(self):
        """A KMZ with multiple .kml files merges all routes."""
        kml2 = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Second Route</name>
      <LineString>
        <coordinates>-118.0,33.0,0 -118.1,33.1,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("doc.kml", _VALID_KML)
            zf.writestr("extra.kml", kml2)
        routes = parse_kmz(buf.getvalue())
        assert len(routes) == 2
        names = {r["name"] for r in routes}
        assert "ASR Dodge" in names
        assert "Second Route" in names

    async def test_invalid_zip_raises(self):
        """Non-ZIP bytes raise BadZipFile."""
        with pytest.raises(zipfile.BadZipFile):
            parse_kmz(b"not a zip file")


# ============================================================================
# 2. Route Upload Endpoint Integration Tests
# ============================================================================


@pytest.mark.asyncio
class TestRouteUploadEndpoint:
    """Integration tests for POST /api/v1/ingestion/routes."""

    async def test_upload_geojson(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload a .geojson file with a valid FeatureCollection."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["routes_created"] == 1
        assert len(data["route_ids"]) == 1
        assert data["file_name"] == "test.geojson"

    async def test_upload_json_extension(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload with .json extension also triggers geojson parsing."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": ("routes.json", _VALID_GEOJSON_FC.encode(), "application/json")
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["routes_created"] == 1

    async def test_upload_csv(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload a .csv route file."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("routes.csv", _VALID_CSV.encode(), "text/csv")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["routes_created"] == 1

    async def test_upload_gpx(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload a .gpx route file."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("track.gpx", _VALID_GPX, "application/gpx+xml")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["routes_created"] == 1

    async def test_upload_kml(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload a .kml route file."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "route.kml",
                    _VALID_KML,
                    "application/vnd.google-earth.kml+xml",
                )
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["routes_created"] == 1

    async def test_upload_kmz(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Upload a .kmz route file."""
        kmz_bytes = _make_kmz(_VALID_KML)
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": ("route.kmz", kmz_bytes, "application/vnd.google-earth.kmz")
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["routes_created"] == 1

    async def test_upload_unsupported_extension(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """Unsupported file extension returns 400."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("data.xlsx", b"fakedata", "application/octet-stream")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "Unsupported file format" in response.json()["detail"]

    async def test_upload_without_auth(
        self,
        client: AsyncClient,
        test_unit: Unit,
    ):
        """Upload without Authorization header returns 401 or 403."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
        )
        assert response.status_code in (401, 403)

    async def test_upload_with_operator_role_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        test_unit: Unit,
    ):
        """OPERATOR role should be forbidden from uploading routes."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert response.status_code == 403

    async def test_upload_with_s3_role_allowed(
        self,
        client: AsyncClient,
        s3_token: str,
        test_unit: Unit,
    ):
        """S3 role should be allowed to upload routes."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
            headers={"Authorization": f"Bearer {s3_token}"},
        )
        assert response.status_code == 200
        assert response.json()["routes_created"] == 1

    async def test_upload_with_commander_role_allowed(
        self,
        client: AsyncClient,
        commander_token: str,
        test_unit: Unit,
    ):
        """COMMANDER role should be allowed to upload routes."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
            headers={"Authorization": f"Bearer {commander_token}"},
        )
        assert response.status_code == 200

    async def test_upload_oversized_file(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """A file exceeding the 10 MB limit returns 400."""
        # Create content just over the 10 MB limit
        oversized = b"x" * (10 * 1024 * 1024 + 2)
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("huge.geojson", oversized, "application/geo+json")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "maximum size" in response.json()["detail"].lower()

    async def test_upload_empty_geojson_no_routes(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """An empty FeatureCollection returns 400 (no routes found)."""
        empty_fc = json.dumps({"type": "FeatureCollection", "features": []})
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": ("empty.geojson", empty_fc.encode(), "application/geo+json")
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "No routes found" in response.json()["detail"]

    async def test_upload_malformed_csv(
        self,
        client: AsyncClient,
        admin_token: str,
        test_unit: Unit,
    ):
        """A CSV missing required columns returns 400."""
        bad_csv = "name,latitude,longitude\nTest,32.0,-117.0\n"
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={"file": ("bad.csv", bad_csv.encode(), "text/csv")},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400

    async def test_upload_creates_route_in_db(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession,
        test_unit: Unit,
    ):
        """Verify the uploaded route actually persists in the database."""
        response = await client.post(
            "/api/v1/ingestion/routes",
            files={
                "file": (
                    "test.geojson",
                    _VALID_GEOJSON_FC.encode(),
                    "application/geo+json",
                )
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        route_id = response.json()["route_ids"][0]

        result = await db_session.execute(select(Route).where(Route.id == route_id))
        route = result.scalar_one_or_none()
        assert route is not None
        assert route.name == "MSR Tampa"
        assert route.status == RouteStatus.OPEN
        assert route.route_type == RouteType.SUPPLY_ROUTE
        assert len(route.waypoints) == 3


# ============================================================================
# 3. Route Delete Endpoint Tests
# ============================================================================


@pytest.mark.asyncio
class TestRouteDeleteEndpoint:
    """Integration tests for DELETE /api/v1/map/routes/{route_id}."""

    async def _create_route(
        self, db_session: AsyncSession, admin_user_id: int
    ) -> Route:
        """Helper to insert a route directly into the database."""
        route = Route(
            name="Deletable Route",
            route_type=RouteType.MSR,
            status=RouteStatus.OPEN,
            waypoints=[
                {"lat": 32.7, "lon": -117.1},
                {"lat": 32.8, "lon": -117.2},
            ],
            description="Route to be deleted",
            created_by_id=admin_user_id,
        )
        db_session.add(route)
        await db_session.flush()
        await db_session.refresh(route)
        return route

    async def test_delete_existing_route(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """Admin can soft-delete a route; status becomes CLOSED."""
        route = await self._create_route(db_session, admin_user.id)
        route_id = route.id

        response = await client.delete(
            f"/api/v1/map/routes/{route_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["detail"] == "Route closed"
        assert data["id"] == route_id

    async def test_delete_route_is_soft_delete(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """After deletion, the route still exists with status CLOSED (soft delete)."""
        route = await self._create_route(db_session, admin_user.id)
        route_id = route.id

        response = await client.delete(
            f"/api/v1/map/routes/{route_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

        # Verify the route still exists in DB
        result = await db_session.execute(select(Route).where(Route.id == route_id))
        soft_deleted = result.scalar_one_or_none()
        assert soft_deleted is not None
        assert soft_deleted.status == RouteStatus.CLOSED
        # Name and waypoints are preserved
        assert soft_deleted.name == "Deletable Route"
        assert len(soft_deleted.waypoints) == 2

    async def test_delete_nonexistent_route(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Deleting a route that doesn't exist returns 404."""
        response = await client.delete(
            "/api/v1/map/routes/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    async def test_delete_without_admin_role_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """Non-admin roles (OPERATOR) are forbidden from deleting routes."""
        route = await self._create_route(db_session, admin_user.id)

        response = await client.delete(
            f"/api/v1/map/routes/{route.id}",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert response.status_code == 403

    async def test_delete_with_s3_role_forbidden(
        self,
        client: AsyncClient,
        s3_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """S3 role is forbidden from deleting routes (admin-only operation)."""
        route = await self._create_route(db_session, admin_user.id)

        response = await client.delete(
            f"/api/v1/map/routes/{route.id}",
            headers={"Authorization": f"Bearer {s3_token}"},
        )
        assert response.status_code == 403

    async def test_delete_without_auth(
        self,
        client: AsyncClient,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """Delete without auth returns 401 or 403."""
        route = await self._create_route(db_session, admin_user.id)

        response = await client.delete(
            f"/api/v1/map/routes/{route.id}",
        )
        assert response.status_code in (401, 403)


# ============================================================================
# 4. Tile Settings Endpoint Tests
# ============================================================================


@pytest.mark.asyncio
class TestTileLayersGetEndpoint:
    """Integration tests for GET /api/v1/settings/tile-layers."""

    async def test_default_layers_when_no_setting(
        self,
        client: AsyncClient,
    ):
        """When no tile_layers setting exists, return the built-in defaults."""
        response = await client.get("/api/v1/settings/tile-layers")
        assert response.status_code == 200
        data = response.json()
        assert "layers" in data
        layers = data["layers"]
        assert len(layers) >= 3
        names = [layer["name"] for layer in layers]
        assert "osm" in names
        assert "satellite" in names
        assert "topo" in names

    async def test_default_layer_structure(
        self,
        client: AsyncClient,
    ):
        """Each default layer has the expected keys."""
        response = await client.get("/api/v1/settings/tile-layers")
        assert response.status_code == 200
        for layer in response.json()["layers"]:
            assert "name" in layer
            assert "label" in layer
            assert "url_template" in layer
            assert "attribution" in layer
            assert "max_zoom" in layer
            assert "enabled" in layer
            assert "order" in layer

    async def test_returns_stored_layers(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """When a tile_layers setting exists in DB, that is returned."""
        custom_layers = {
            "layers": [
                {
                    "name": "custom",
                    "label": "Custom Layer",
                    "url_template": "/tiles/custom/{z}/{x}/{y}.png",
                    "attribution": "Test",
                    "max_zoom": 20,
                    "enabled": True,
                    "order": 0,
                },
            ]
        }
        setting = SystemSetting(
            key="tile_layers",
            value=json.dumps(custom_layers),
            updated_by="test",
        )
        db_session.add(setting)
        await db_session.flush()

        response = await client.get("/api/v1/settings/tile-layers")
        assert response.status_code == 200
        data = response.json()
        assert len(data["layers"]) == 1
        assert data["layers"][0]["name"] == "custom"
        assert data["layers"][0]["label"] == "Custom Layer"
        assert data["layers"][0]["max_zoom"] == 20

    async def test_malformed_stored_value_returns_defaults(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """If the stored JSON is corrupt, defaults are returned."""
        setting = SystemSetting(
            key="tile_layers",
            value="not valid json{{{",
            updated_by="test",
        )
        db_session.add(setting)
        await db_session.flush()

        response = await client.get("/api/v1/settings/tile-layers")
        assert response.status_code == 200
        data = response.json()
        # Should fall back to defaults
        assert len(data["layers"]) >= 3


@pytest.mark.asyncio
class TestTileLayersPutEndpoint:
    """Integration tests for PUT /api/v1/settings/tile-layers."""

    async def test_admin_can_update(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Admin can update tile layers."""
        payload = {
            "layers": [
                {
                    "name": "dark",
                    "label": "Dark Mode",
                    "url_template": "/tiles/dark/{z}/{x}/{y}.png",
                    "attribution": "MapBox",
                    "max_zoom": 18,
                    "enabled": True,
                    "order": 0,
                },
                {
                    "name": "light",
                    "label": "Light Mode",
                    "url_template": "/tiles/light/{z}/{x}/{y}.png",
                    "attribution": "MapBox",
                    "max_zoom": 18,
                    "enabled": False,
                    "order": 1,
                },
            ]
        }
        response = await client.put(
            "/api/v1/settings/tile-layers",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["layers"]) == 2
        assert data["layers"][0]["name"] == "dark"
        assert data["layers"][1]["name"] == "light"
        assert data["layers"][1]["enabled"] is False

    async def test_operator_cannot_update(
        self,
        client: AsyncClient,
        operator_token: str,
    ):
        """OPERATOR role is forbidden from updating tile layers."""
        payload = {
            "layers": [
                {
                    "name": "x",
                    "label": "X",
                    "url_template": "/tiles/x/{z}/{x}/{y}.png",
                },
            ]
        }
        response = await client.put(
            "/api/v1/settings/tile-layers",
            json=payload,
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert response.status_code == 403

    async def test_updated_config_persisted(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """After PUT, a subsequent GET returns the new configuration."""
        payload = {
            "layers": [
                {
                    "name": "persisted",
                    "label": "Persisted Layer",
                    "url_template": "/tiles/persisted/{z}/{x}/{y}.png",
                    "attribution": "Test",
                    "max_zoom": 15,
                    "enabled": True,
                    "order": 0,
                },
            ]
        }

        put_resp = await client.put(
            "/api/v1/settings/tile-layers",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert put_resp.status_code == 200

        get_resp = await client.get("/api/v1/settings/tile-layers")
        assert get_resp.status_code == 200
        layers = get_resp.json()["layers"]
        assert len(layers) == 1
        assert layers[0]["name"] == "persisted"
        assert layers[0]["max_zoom"] == 15

    async def test_update_replaces_previous(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """A second PUT fully replaces the tile configuration."""
        headers = {"Authorization": f"Bearer {admin_token}"}

        # First update
        await client.put(
            "/api/v1/settings/tile-layers",
            json={
                "layers": [
                    {
                        "name": "first",
                        "label": "First",
                        "url_template": "/tiles/first/{z}/{x}/{y}.png",
                    }
                ]
            },
            headers=headers,
        )

        # Second update replaces
        await client.put(
            "/api/v1/settings/tile-layers",
            json={
                "layers": [
                    {
                        "name": "second",
                        "label": "Second",
                        "url_template": "/tiles/second/{z}/{x}/{y}.png",
                    }
                ]
            },
            headers=headers,
        )

        get_resp = await client.get("/api/v1/settings/tile-layers")
        layers = get_resp.json()["layers"]
        assert len(layers) == 1
        assert layers[0]["name"] == "second"

    async def test_update_without_auth_fails(
        self,
        client: AsyncClient,
    ):
        """PUT without auth returns 401 or 403."""
        payload = {
            "layers": [{"name": "x", "label": "X", "url_template": "/x/{z}/{x}/{y}"}]
        }
        response = await client.put(
            "/api/v1/settings/tile-layers",
            json=payload,
        )
        assert response.status_code in (401, 403)

    async def test_s3_cannot_update_tile_layers(
        self,
        client: AsyncClient,
        s3_token: str,
    ):
        """S3 role is forbidden from updating tile settings (admin-only)."""
        payload = {
            "layers": [{"name": "x", "label": "X", "url_template": "/x/{z}/{x}/{y}"}]
        }
        response = await client.put(
            "/api/v1/settings/tile-layers",
            json=payload,
            headers={"Authorization": f"Bearer {s3_token}"},
        )
        assert response.status_code == 403

    async def test_empty_layers_list_accepted(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Admin can set an empty layers list (to disable all tile layers)."""
        response = await client.put(
            "/api/v1/settings/tile-layers",
            json={"layers": []},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["layers"] == []

        # Verify GET reflects the change
        get_resp = await client.get("/api/v1/settings/tile-layers")
        assert get_resp.json()["layers"] == []
