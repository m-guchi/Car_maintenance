#!/usr/bin/env bash
# 開発サーバーを本番 DB に接続して起動（データ確認用）
set -euo pipefail

PORT="${PORT:-3000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=scripts/dev-wsl-lan.sh
source "$ROOT_DIR/scripts/dev-wsl-lan.sh"
# shellcheck source=scripts/pick-dev-bundler.sh
source "$ROOT_DIR/scripts/pick-dev-bundler.sh"

setup_wsl_lan_dev_access "$PORT" "$ROOT_DIR"
maybe_enable_watchpack_polling
DEV_BUNDLER_FLAG="$(pick_dev_bundler)"

export DEV_ALLOWED_ORIGINS="${DEV_ALLOWED_ORIGINS:-}"

echo "" >&2
echo "⚠️  開発サーバーを本番 DB に接続して起動します。" >&2
echo "   書き込み操作は本番データに影響します。閲覧のみ推奨。" >&2
echo "   ローカル DB でログイン済みの場合は一度ログアウトし、本番 DB 接続中に再ログインしてください。" >&2
echo "" >&2

exec bash "$ROOT_DIR/scripts/with-op-prod-db.sh" sh -c \
  "bash scripts/tsx.sh scripts/db-check.ts && prisma generate && next dev -H 0.0.0.0 -p ${PORT} ${DEV_BUNDLER_FLAG}"
