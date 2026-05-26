#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Build orchestrator sidecar
OUT_PATH="$ROOT_DIR/src-tauri/bin/orchestrator-aarch64-apple-darwin"
TMP_PATH="$OUT_PATH.tmp"

rm -f "$TMP_PATH"
bun build "$ROOT_DIR/server.ts" --compile --outfile "$TMP_PATH"
chmod +x "$TMP_PATH"
mv "$TMP_PATH" "$OUT_PATH"

# 2. Build alchm-mcp sidecar
OUT_MCP_PATH="$ROOT_DIR/src-tauri/bin/alchm-mcp-aarch64-apple-darwin"
TMP_MCP_PATH="$OUT_MCP_PATH.tmp"

rm -f "$TMP_MCP_PATH"
bun build "$ROOT_DIR/../WhatToEatNext-master/mcp-server/src/index.ts" --compile --outfile "$TMP_MCP_PATH"
chmod +x "$TMP_MCP_PATH"
mv "$TMP_MCP_PATH" "$OUT_MCP_PATH"

