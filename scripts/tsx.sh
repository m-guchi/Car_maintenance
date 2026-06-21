#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSX="$ROOT/node_modules/.bin/tsx"

if [[ ! -x "$TSX" ]]; then
  echo "Error: tsx が見つかりません。npm install を実行してください。" >&2
  exit 1
fi

exec "$TSX" "$@"
