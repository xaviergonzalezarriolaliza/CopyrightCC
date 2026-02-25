#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/aggregate_playwright_reports_from_zips.sh <zip1> [zip2 ...]

OUT_BASE=${1:-report-outputs}
shift || true
if [ $# -lt 1 ]; then
  echo "Usage: $0 <zip1> [zip2 ...]"
  exit 2
fi

OUT_DIR=report-outputs
mkdir -p "$OUT_DIR"

for ZIP in "$@"; do
  if [ ! -f "$ZIP" ]; then
    echo "Skipping missing file: $ZIP" >&2
    continue
  fi
  ZIP_BASENAME=$(basename "$ZIP" .zip)
  TARGET_DIR="$OUT_DIR/$ZIP_BASENAME"
  rm -rf "$TARGET_DIR"
  mkdir -p "$TARGET_DIR"
  echo "Extracting $ZIP -> $TARGET_DIR"
  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$ZIP" -d "$TARGET_DIR"
  else
    python - <<PY
import zipfile, sys
zipfile.ZipFile(r"$ZIP").extractall(r"$TARGET_DIR")
PY
  fi

  if [ -d "$TARGET_DIR/playwright-report" ]; then
    echo "Found playwright-report in $ZIP_BASENAME"
  else
    echo "No playwright-report directory in $ZIP_BASENAME; listing files:" >&2
    ls -la "$TARGET_DIR" || true
  fi
done

INDEX="$OUT_DIR/index.html"
echo "<html><body><h1>Aggregated Playwright Reports</h1><ul>" >"$INDEX"
for d in "$OUT_DIR"/*; do
  if [ -d "$d/playwright-report" ]; then
    name=$(basename "$d")
    # copy the report dir into a single path so relative links work
    cp -a "$d/playwright-report" "$OUT_DIR/$name-playwright-report"
    echo "<li><a href='$name-playwright-report/index.html'>$name</a></li>" >>"$INDEX"
  fi
done
echo "</ul></body></html>" >>"$INDEX"
echo "Aggregate index created at $INDEX"
