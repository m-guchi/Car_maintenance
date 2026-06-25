#!/usr/bin/env bash
# 1Password から DB_NAME / DB_USER / DB_PASSWORD を取得して MySQL をセットアップ
#
# 使い方:
#   op signin
#   npm run db:setup
#
# 前提: sudo mysql で root 接続できること（MySQL 起動済み）
# migrate dev はシャドウ DB 上で DDL を実行するため、*.* への ALTER 等が必要（下記 GRANT 参照）

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.op"

escape_sql_string() {
  printf "%s" "$1" | sed "s/'/''/g"
}

validate_identifier() {
  local name="$1"
  local value="$2"
  if [[ ! "$value" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: ${name} に使えない文字が含まれています（英数字・_・- のみ）: ${value}" >&2
    exit 1
  fi
}

run_setup() {
  for var in DB_NAME DB_USER DB_PASSWORD; do
    if [[ -z "${!var:-}" ]]; then
      echo "Error: ${var} が 1Password から取得できません。.env.op を確認してください。" >&2
      exit 1
    fi
  done

  validate_identifier "DB_NAME" "$DB_NAME"
  validate_identifier "DB_USER" "$DB_USER"

  local db_password_esc
  db_password_esc=$(escape_sql_string "$DB_PASSWORD")

  echo "セットアップ対象:"
  echo "  DB_NAME: ${DB_NAME}"
  echo "  DB_USER: ${DB_USER}"
  echo "  DB_PASSWORD: ***"

  if ! command -v mysql >/dev/null 2>&1; then
    echo "Error: mysql コマンドが見つかりません。" >&2
    exit 1
  fi

  bash "$ROOT/scripts/ensure-mysql.sh"

  sudo mysql <<EOSQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${db_password_esc}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${db_password_esc}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES, SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES ON *.* TO '${DB_USER}'@'localhost';

CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${db_password_esc}';
ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${db_password_esc}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES, SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES ON *.* TO '${DB_USER}'@'127.0.0.1';

FLUSH PRIVILEGES;
EOSQL

  echo "接続確認中..."
  local socket="/var/run/mysqld/mysqld.sock"
  [[ -S /run/mysqld/mysqld.sock ]] && socket="/run/mysqld/mysqld.sock"

  if mysql -u "$DB_USER" -p"$DB_PASSWORD" --socket="$socket" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
    echo "OK: データベース・ユーザー作成完了（1Password の認証情報と一致）"
  else
    echo "Error: MySQL ユーザーは作成しましたが、1Password の db-password で接続できません。" >&2
    echo "  → 1Password の db-user / db-password / db-name を確認" >&2
    echo "  → 修正後、再度 npm run db:setup を実行" >&2
    exit 1
  fi

  echo "次: npm run db:migrate"
}

if [[ "${1:-}" == "--run" ]]; then
  run_setup
  exit 0
fi

if ! command -v op >/dev/null 2>&1; then
  echo "Error: 1Password CLI (op) が見つかりません。" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE がありません。npm run env:init" >&2
  exit 1
fi

exec op run --env-file="$ENV_FILE" -- bash "$0" --run
