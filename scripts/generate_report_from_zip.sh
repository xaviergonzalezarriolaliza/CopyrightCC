#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/generate_report_from_zip.sh <zip-path> [out-dir]
# Example: ./scripts/generate_report_from_zip.sh "C:/Users/xavie/Downloads/playwright-artifacts-chromium-run22389242847-test.zip"

ZIP_PATH=${1:-}
OUT_BASE=${2:-report-outputs}

if [ -z "$ZIP_PATH" ]; then
  echo "Usage: $0 <zip-path> [out-dir]"
  exit 2
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "Zip file not found: $ZIP_PATH" >&2
  exit 1
fi

mkdir -p "$OUT_BASE"
ZIP_BASENAME=$(basename "$ZIP_PATH" .zip)
TARGET_DIR="$OUT_BASE/$ZIP_BASENAME"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

echo "Extracting $ZIP_PATH -> $TARGET_DIR"
if command -v unzip >/dev/null 2>&1; then
  unzip -q "$ZIP_PATH" -d "$TARGET_DIR"
else
  # Use python to unzip if unzip isn't available
  python - <<PY
import sys, zipfile
zf=zipfile.ZipFile(r"$ZIP_PATH")
zf.extractall(r"$TARGET_DIR")
zf.close()
PY
fi

echo "Searching for XML/JUnit files in $TARGET_DIR"
mapfile -t XML_FILES < <(find "$TARGET_DIR" -type f \( -iname '*.xml' -o -iname '*.junit' -o -iname '*junit*.xml' \) || true)

if [ ${#XML_FILES[@]} -eq 0 ]; then
  echo "No XML files found in $TARGET_DIR" >&2
  exit 1
fi

REPORT_DIR="$TARGET_DIR/report"
mkdir -p "$REPORT_DIR"

echo "Found ${#XML_FILES[@]} XML file(s). Generating HTML report..."

if command -v npx >/dev/null 2>&1; then
  IFS=','; FILES_JOINED="${XML_FILES[*]}"; unset IFS
  npx junit-viewer --results "$FILES_JOINED" --save "$REPORT_DIR/report.html"
  echo "Generated: $REPORT_DIR/report.html"
  exit 0
fi

# Python fallback: convert each XML to HTML with junit2html and create index
PYEXEC=python
if ! command -v "$PYEXEC" >/dev/null 2>&1; then
  PYEXEC=python3
fi
if command -v "$PYEXEC" >/dev/null 2>&1; then
  if ! "$PYEXEC" -m junit2html --help >/dev/null 2>&1; then
    echo "Installing junit2html in a temporary venv..."
    TMPVENV=$(mktemp -d)
    "$PYEXEC" -m venv "$TMPVENV"
    # shellcheck disable=SC1090
    source "$TMPVENV/bin/activate"
    pip install --quiet junit2html
  fi
  INDEX="$REPORT_DIR/index.html"
  echo "<html><body><h1>Reports for $ZIP_BASENAME</h1><ul>" >"$INDEX"
  for f in "${XML_FILES[@]}"; do
    base=$(basename "$f" .xml)
    out="$REPORT_DIR/${base}.html"
    echo "Converting $f -> $out"
    "$PYEXEC" -m junit2html "$f" "$out" || echo "failed converting $f" >&2
    echo "<li><a href='${base}.html'>${base}</a></li>" >>"$INDEX"
  done
  echo "</ul></body></html>" >>"$INDEX"
  echo "Generated index: $INDEX"
  exit 0
fi

echo "No generator available (install Node for junit-viewer or Python+junit2html)." >&2
exit 1
