#!/usr/bin/env python3
"""Download map tiles for offline/air-gapped KEYSTONE deployments.

Usage:
    python scripts/download-tiles.py --bbox 33.0,-117.6,33.5,-117.0 --zoom 8-14 --output ./tiles
    python scripts/download-tiles.py --bbox 33.0,-117.6,33.5,-117.0 --zoom 8-14 --output ./tiles --source satellite
"""
import argparse
import math
import os
import sys
import time
import urllib.request

TILE_SOURCES = {
    "osm": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "topo": "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
}

def lat_lon_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    """Convert lat/lon to tile x/y at given zoom level."""
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y

def download_tiles(bbox: tuple, zoom_range: range, source: str, output_dir: str, delay: float = 0.1):
    """Download tiles for the given bounding box and zoom range."""
    url_template = TILE_SOURCES[source]
    min_lat, min_lon, max_lat, max_lon = bbox
    total = 0
    downloaded = 0
    skipped = 0

    for z in zoom_range:
        x_min, y_max = lat_lon_to_tile(min_lat, min_lon, z)
        x_max, y_min = lat_lon_to_tile(max_lat, max_lon, z)
        # Ensure correct order
        if x_min > x_max:
            x_min, x_max = x_max, x_min
        if y_min > y_max:
            y_min, y_max = y_max, y_min

        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                total += 1
                ext = "png" if source != "satellite" else "jpg"
                tile_path = os.path.join(output_dir, source, str(z), str(x), f"{y}.{ext}")

                if os.path.exists(tile_path):
                    skipped += 1
                    continue

                os.makedirs(os.path.dirname(tile_path), exist_ok=True)
                url = url_template.format(z=z, x=x, y=y)

                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "KEYSTONE-TileDownloader/1.0"})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        with open(tile_path, "wb") as f:
                            f.write(resp.read())
                    downloaded += 1
                    if downloaded % 100 == 0:
                        print(f"  Downloaded {downloaded} tiles (z={z})...")
                except Exception as e:
                    print(f"  WARN: Failed to download z={z}/x={x}/y={y}: {e}", file=sys.stderr)

                time.sleep(delay)

    print(f"\nComplete: {downloaded} downloaded, {skipped} skipped (already exist), {total} total")

def main():
    parser = argparse.ArgumentParser(description="Download map tiles for offline KEYSTONE deployment")
    parser.add_argument("--bbox", required=True, help="Bounding box: min_lat,min_lon,max_lat,max_lon")
    parser.add_argument("--zoom", required=True, help="Zoom range: e.g. 8-14")
    parser.add_argument("--output", required=True, help="Output directory for tiles")
    parser.add_argument("--source", default="osm", choices=list(TILE_SOURCES.keys()), help="Tile source")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests in seconds")
    args = parser.parse_args()

    bbox = tuple(float(x) for x in args.bbox.split(","))
    if len(bbox) != 4:
        parser.error("bbox must have 4 values: min_lat,min_lon,max_lat,max_lon")

    zoom_parts = args.zoom.split("-")
    if len(zoom_parts) == 2:
        zoom_range = range(int(zoom_parts[0]), int(zoom_parts[1]) + 1)
    else:
        zoom_range = range(int(zoom_parts[0]), int(zoom_parts[0]) + 1)

    print(f"Downloading {args.source} tiles for bbox={bbox}, zoom={args.zoom}")
    print(f"Output: {args.output}")
    download_tiles(bbox, zoom_range, args.source, args.output, args.delay)

if __name__ == "__main__":
    main()
