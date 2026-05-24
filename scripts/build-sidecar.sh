#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_PATH="$ROOT_DIR/src-tauri/bin/orchestrator-aarch64-apple-darwin"
TMP_PATH="$OUT_PATH.tmp"

rm -f "$TMP_PATH"
bun build "$ROOT_DIR/server.ts" --compile --outfile "$TMP_PATH"
chmod +x "$TMP_PATH"
mv "$TMP_PATH" "$OUT_PATH"
