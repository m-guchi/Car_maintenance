#!/usr/bin/env bash
# VPS 初回セットアップ用（デプロイ先サーバーで 1 回だけ実行）
#
# target-dir / port は 1Password（apps / Car Maintenance）から読み込みます。
# 手動で上書きする場合のみ環境変数 TARGET_DIR / PORT を指定してください。
#
# 使い方:
#   op signin
#   bash scripts/vps-bootstrap.sh
#
# 前提: Node.js 20+, 1Password CLI (op), pm2, MySQL（本番 DB）
set -euo pipefail

OP_TARGET_DIR="op://apps/Car Maintenance/target-dir"
OP_PORT="op://apps/Car Maintenance/port"
NODE_VERSION="${NODE_VERSION:-20}"

read_op() {
  local ref="$1"
  if ! command -v op >/dev/null 2>&1; then
    echo "Error: 1Password CLI (op) が見つかりません。" >&2
    echo "  TARGET_DIR / PORT を export するか、op をインストールしてください。" >&2
    exit 1
  fi
  op read "$ref"
}

if [[ -z "${TARGET_DIR:-}" ]]; then
  TARGET_DIR="$(read_op "$OP_TARGET_DIR")"
fi
if [[ -z "${PORT:-}" ]]; then
  PORT="$(read_op "$OP_PORT")"
fi

if [[ -z "$TARGET_DIR" || -z "$PORT" ]]; then
  echo "Error: target-dir と port を 1Password（Car Maintenance）に登録してください。" >&2
  exit 1
fi

echo "==> Car Maintenance VPS bootstrap"
echo "    TARGET_DIR=${TARGET_DIR}  (1Password: target-dir)"
echo "    PORT=${PORT}              (1Password: port)"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js が見つかりません。Node ${NODE_VERSION} をインストールしてください。" >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2..."
  npm install -g pm2
fi

mkdir -p "${TARGET_DIR}"
cd "${TARGET_DIR}"

if [[ ! -f ecosystem.config.js ]]; then
  echo "==> Creating placeholder ecosystem.config.js (first deploy will replace it)"
  cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: "car-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: ${PORT},
      },
    },
  ],
};
EOF
fi

touch .env
echo "==> Bootstrap complete."
echo "    Next: merge to main to trigger GitHub Actions deploy."
