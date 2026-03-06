#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"

echo "[rst-preview.nvim] Installing dependencies..."

# Check node
if ! command -v node &>/dev/null; then
  echo "ERROR: node not found. Install Node.js from https://nodejs.org" >&2
  exit 1
fi

# Check python3
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found." >&2
  exit 1
fi

# Check docutils
if ! python3 -c "import docutils" 2>/dev/null; then
  echo "[rst-preview.nvim] Installing docutils..."
  pip3 install docutils
fi

# Install node deps
cd "$APP_DIR"
npm install

# Copy socket.io client from node_modules into _static
SIOJS="$APP_DIR/node_modules/socket.io-client/dist/socket.io.js"
if [ -f "$SIOJS" ]; then
  cp "$SIOJS" "$APP_DIR/_static/socket.io.min.js"
  echo "[rst-preview.nvim] socket.io client copied."
fi

echo "[rst-preview.nvim] Installation complete!"
echo ""
echo "Add to your init.vim / init.lua:"
echo "  Plug 'your-username/rst-preview.nvim'  \" if using vim-plug"
echo "  -- or just add the plugin path to runtimepath"
echo ""
echo "Usage:"
echo "  :RSTPreview        \" open preview"
echo "  :RSTPreviewStop    \" stop preview"  
echo "  :RSTPreviewToggle  \" toggle preview"
