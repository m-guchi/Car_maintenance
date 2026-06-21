#!/usr/bin/env bash
# 開発サーバーを本番 DB に接続して起動（データ確認用）
set -euo pipefail

PORT="${PORT:-3000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "" >&2
echo "⚠️  開発サーバーを本番 DB に接続して起動します。" >&2
echo "   書き込み操作は本番データに影響します。閲覧のみ推奨。" >&2
echo "" >&2

exec bash "$ROOT_DIR/scripts/with-op-prod-db.sh" sh -c \
  "npx tsx scripts/db-check.ts && prisma generate && next dev -H 0.0.0.0 -p ${PORT}"
