#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/public/geopolitical"
RAW_DIR="$ROOT_DIR/data/raw/geopolitical"
mkdir -p "$DATA_DIR" "$RAW_DIR"

# Natural Earth base URLs
NE_BASE="https://naturalearth.s3.amazonaws.com"
# Files (50m scale for performance baseline)
COUNTRIES_ZIP="50m_cultural/ne_50m_admin_0_countries.zip"
BOUNDARIES_ZIP="50m_cultural/ne_50m_admin_0_boundary_lines_land.zip"

fetch_zip(){
  local rel=$1
  local target_zip="$RAW_DIR/$(basename "$rel")"
  if [[ -f "$target_zip" ]]; then
    echo "Already downloaded $rel"; return; fi
  echo "Downloading $rel";
  curl -L "$NE_BASE/$rel" -o "$target_zip"
}

extract_shp(){
  local zipfile=$1
  unzip -o -d "$RAW_DIR" "$zipfile" >/dev/null
}

convert_and_simplify(){
  local shp=$1
  local out_geojson=$2
  local simplify_pct=$3
  npx mapshaper -i "$shp" -simplify ${simplify_pct}% keep-shapes -clean -o format=geojson "$out_geojson"
}

# 1. Fetch zips
fetch_zip "$COUNTRIES_ZIP"
fetch_zip "$BOUNDARIES_ZIP"

# 2. Extract
extract_shp "$RAW_DIR/$(basename "$COUNTRIES_ZIP")"
extract_shp "$RAW_DIR/$(basename "$BOUNDARIES_ZIP")"

# 3. Convert + Simplify to three LODs (5%, 10%, 20% of original retained)
COUNTRIES_SHP=$(find "$RAW_DIR" -name 'ne_50m_admin_0_countries.shp' | head -n1)
BOUNDARIES_SHP=$(find "$RAW_DIR" -name 'ne_50m_admin_0_boundary_lines_land.shp' | head -n1)

if [[ -z "$COUNTRIES_SHP" || -z "$BOUNDARIES_SHP" ]]; then
  echo "Missing shapefiles after extraction" >&2; exit 1; fi

convert_and_simplify "$BOUNDARIES_SHP" "$DATA_DIR/world-borders-lod0.geojson" 5
convert_and_simplify "$BOUNDARIES_SHP" "$DATA_DIR/world-borders-lod1.geojson" 10
convert_and_simplify "$BOUNDARIES_SHP" "$DATA_DIR/world-borders-lod2.geojson" 20

convert_and_simplify "$COUNTRIES_SHP" "$DATA_DIR/world-territories-lod0.geojson" 5
convert_and_simplify "$COUNTRIES_SHP" "$DATA_DIR/world-territories-lod1.geojson" 10
convert_and_simplify "$COUNTRIES_SHP" "$DATA_DIR/world-territories-lod2.geojson" 20

# 4. Create canonical (medium) symlinks or copies
cp "$DATA_DIR/world-borders-lod1.geojson" "$DATA_DIR/world-borders.geojson"
cp "$DATA_DIR/world-territories-lod1.geojson" "$DATA_DIR/world-territories.geojson"

echo "Geopolitical datasets fetched & simplified."
