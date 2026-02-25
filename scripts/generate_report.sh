#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/generate_report.sh <run-id> [artifact-name]
# Example: ./scripts/generate_report.sh 22389242847 "playwright-artifacts-chromium*"

RUN_ID=${1:-}
ARTIFACT_NAME=${2:-}
OUT_DIR=${3:-artifacts}

if [ -z "$RUN_ID" ]; then
  echo "Usage: $0 <run-id> [artifact-name] [out-dir]"
  exit 2
fi

echo "Downloading artifacts for run $RUN_ID into $OUT_DIR/..."
mkdir -p "$OUT_DIR"

if command -v gh >/dev/null 2>&1; then
  if [ -n "$ARTIFACT_NAME" ]; then
    gh run download "$RUN_ID" --name "$ARTIFACT_NAME" -D "$OUT_DIR" || true
  fi
  # download any remaining artifacts
  gh run download "$RUN_ID" -D "$OUT_DIR" || true
else
  echo "gh CLI not found. Please install GitHub CLI and authenticate (gh auth login)." >&2
  exit 1
fi

echo "Searching for XML/JUnit files in $OUT_DIR"
mapfile -t XML_FILES < <(find "$OUT_DIR" -type f \( -iname '*.xml' -o -iname '*.junit' -o -iname '*junit*.xml' \))

if [ ${#XML_FILES[@]} -eq 0 ]; then
  echo "No XML files found in $OUT_DIR. Look in the downloaded artifacts and try again." >&2
  exit 1
fi

REPORT_DIR=report
mkdir -p "$REPORT_DIR"

echo "Found ${#XML_FILES[@]} XML file(s)."

# Try Node junit-viewer first (produces a single aggregated HTML)
if command -v npx >/dev/null 2>&1; then
  echo "Using npx junit-viewer to generate aggregated report..."
  # join file list with commas
  IFS=','; FILES_JOINED="${XML_FILES[*]}"; unset IFS
  npx junit-viewer --results "$FILES_JOINED" --save "$REPORT_DIR/report.html"
  echo "Report generated: $REPORT_DIR/report.html"
  exit 0
fi

# Fallback: python junit2html (may need installation)
if command -v python >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1; then
  PY=python
  if ! command -v "$PY" >/dev/null 2>&1; then
    PY=python3
  fi
  if ! "$PY" -m junit2html --help >/dev/null 2>&1; then
    echo "python junit2html not installed; installing into a temp venv..."
    TMPVENV="$(mktemp -d)"
    "$PY" -m venv "$TMPVENV"
    # shellcheck disable=SC1090
    source "$TMPVENV/bin/activate"
    pip install --quiet junit2html
    WHICH_PY="$PY"
  fi

  INDEX="$REPORT_DIR/index.html"
  echo "<html><body><h1>JUnit Reports</h1><ul>" >"$INDEX"
  for f in "${XML_FILES[@]}"; do
    base=$(basename "$f" .xml)
    out="$REPORT_DIR/${base}.html"
    echo "Generating $out from $f"
    "$PY" -m junit2html "$f" "$out" || echo "failed to convert $f" >&2
    echo "<li><a href='${base}.html'>${base}</a></li>" >>"$INDEX"
  done
  echo "</ul></body></html>" >>"$INDEX"
  echo "Reports generated in $REPORT_DIR. Open $REPORT_DIR/index.html"
  exit 0
fi

echo "No suitable generator found. Install Node (npx junit-viewer) or Python with junit2html." >&2
exit 1
