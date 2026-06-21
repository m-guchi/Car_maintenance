#!/usr/bin/env bash
# 開発環境から本番 DB に接続するためのラッパー（DB_TARGET=production）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "$*" == *"migrate dev"* ]]; then
  echo "Error: prisma migrate dev は本番 DB では実行できません。" >&2
  echo "  スキーマ変更はローカル DB で行い、本番へは db:migrate (deploy) のみ。" >&2
  exit 1
fi

echo "" >&2
echo "⚠️  本番データベースに接続します（読み取り専用の確認を推奨）" >&2
echo "   DB_TARGET=production" >&2
if [[ "${DB_TUNNEL:-}" == "true" ]]; then
  echo "   DB_TUNNEL=true（127.0.0.1:${PROD_DB_LOCAL_PORT:-3307} 経由）" >&2
fi
echo "" >&2

export DB_TARGET=production
exec bash "$ROOT/scripts/with-op-env.sh" "$@"
