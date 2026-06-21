#!/usr/bin/env bash
set -euo pipefail

MIN_MAJOR=20
MIN_MINOR=19
MIN_PATCH=0

version="$(node -p "process.versions.node" 2>/dev/null || true)"

if [[ -z "$version" ]]; then
  echo "NG: Node.js が見つかりません。"
  echo "   Prisma 7 には Node.js ${MIN_MAJOR}.${MIN_MINOR}.${MIN_PATCH} 以上が必要です。"
  exit 1
fi

IFS=. read -r major minor patch <<<"$version"

if (( major < MIN_MAJOR )) || (( major == MIN_MAJOR && minor < MIN_MINOR )); then
  echo "NG: Node.js v${version} は古すぎます（現在: $(which node)）。"
  echo "   Prisma 7 には Node.js ${MIN_MAJOR}.${MIN_MINOR}.${MIN_PATCH} 以上が必要です。"
  echo ""
  echo "   例（nvm）:"
  echo "     nvm install 20"
  echo "     nvm use 20"
  echo ""
  echo "   例（公式バイナリ）:"
  echo "     curl -fsSL https://nodejs.org/dist/v20.20.2/node-v20.20.2-linux-x64.tar.xz -o /tmp/node.tar.xz"
  echo "     tar -xJf /tmp/node.tar.xz -C \"\$HOME/.nodejs\" --strip-components=1"
  exit 1
fi
