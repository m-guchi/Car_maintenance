# 仕様書 実装進捗（Car Maintenance）

> **他 Agent 向け:** 本ファイルが仕様書（Discord通知機能追加版）に対する実装状況の正本です。  
> 機能追加・デプロイ完了時は **必ず本ファイルを更新** してください。  
> **最終更新:** 2026-06-21

## ステータス凡例

| 記号 | 意味 |
|------|------|
| ✅ | 完了 |
| ⚠️ | 一部のみ / 基盤のみ / 未検証 |
| ❌ | 未実装 |
| 🚫 | 対象外（意図的に未着手） |

## 全体進捗

**約 45%** — 認証・DB スキーマ・車両管理は完了。給油・メンテ UI と本番デプロイは未了。

```
[██████████████████░░░░░░░░░░░░] 45%
```

| レイヤー | 状態 |
|----------|------|
| 認証・Discord・ミドルウェア | ✅ |
| DB スキーマ（Prisma） | ✅ |
| 1Password 開発環境 | ✅ |
| PWA 雛形 | ⚠️ |
| 給油・メンテ・車両 UI | ⚠️ |
| 本番 VPS / CI/CD 運用 | ❌ |

---

## 2. システム要件 & アーキテクチャ

### 2.1 テクニカルスタック

| 項目 | 状態 | 実装場所 / 備考 |
|------|------|----------------|
| Next.js App Router + TypeScript + Tailwind | ✅ | プロジェクト全体 |
| MySQL + Prisma | ✅ | `prisma/schema.prisma`, `prisma/migrations/` |
| NextAuth (Auth.js) | ✅ | `src/auth.ts`, `src/auth.config.ts` |
| Google OAuth | ✅ | `src/auth.ts` |
| メール制限 (`ALLOWED_EMAIL`) | ✅ | `src/auth.config.ts` |
| WebAuthn / Passkey | ✅ | Provider + ログイン (`next-auth/webauthn`) + Google ログイン後の登録導線 (`passkey-register-card.tsx`) |
| Discord Webhook（signup / login 2系統） | ✅ | `src/lib/discord.ts`, `src/auth.ts` events |
| PWA | ⚠️ | `public/manifest.json`, `public/sw.js`, `public/icons/` |
| pm2 | ⚠️ | `ecosystem.config.js`（雛形のみ） |
| GitHub Actions → VPS SSH デプロイ | ⚠️ | `.github/workflows/deploy.yml`（**Secrets・VPS 未設定**） |

### 2.2 データモデル

| テーブル | Prisma | マイグレーション | API/UI |
|----------|--------|------------------|--------|
| `users` | ✅ | ✅ `20250621000000_init` | 認証のみ |
| `accounts` | ✅ | ✅ | 認証のみ |
| `sessions` | ✅ | ✅ | 認証のみ |
| `verification_tokens` | ✅ | ✅ | 認証のみ |
| `authenticators` | ✅ | ✅ | Passkey 登録・ログイン |
| `vehicles` | ✅ | ✅ | ✅ CRUD (`/vehicles`) |
| `maintenance_categories` | ✅ | ✅ | ❌ |
| `maintenance_logs` | ✅ | ✅ | ❌ |
| `fuel_logs` | ✅ | ✅ | ❌ |

---

## 3. 機能要件

### ① 認証・アクセス制限 & Discord 通知

| 要件 | 状態 | 備考 |
|------|------|------|
| Google ログイン | ✅ | |
| 許可外メール拒否 | ✅ | `ALLOWED_EMAIL` |
| パスキー登録 → 2回目以降顔認証ログイン | ✅ | Google 初回ログイン後ホームで登録、2回目以降 `next-auth/webauthn` でログイン |
| Discord 新規登録通知 | ✅ | `events.createUser` → `DISCORD_WEBHOOK_SIGNUP_URL` |
| Discord ログイン通知 | ✅ | `events.signIn`（`!isNewUser`）→ `DISCORD_WEBHOOK_LOGIN_URL` |
| 未ログイン時 middleware ガード | ✅ | `src/middleware.ts` |

### ② 給油・燃費可視化 & ガソリンスタンド検索

| 要件 | 状態 |
|------|------|
| 給油入力フォーム | ❌ |
| ダッシュボード（燃費・月別費用・価格推移グラフ） | ❌ |
| 周辺ガソリンスタンド検索（Geolocation） | ❌ |

現状: `src/app/page.tsx` に「準備中」プレースホルダのみ。

### ③ メンテナンス記録 & カテゴリ動的管理

| 要件 | 状態 |
|------|------|
| カテゴリ CRUD（設定画面） | ❌ |
| メンテナンス記録入力（カテゴリ dropdown） | ❌ |

### ④ 車両管理

| 要件 | 状態 | 備考 |
|------|------|------|
| 車両登録（名前・メーカー・車種名・型式ほか） | ✅ | `/vehicles` フォーム |
| 車両一覧・編集・削除 | ✅ | `vehicle-list.tsx`, Server Actions |
| 使用中車両の切り替え（`isActive`） | ✅ | 1台のみアクティブ |

### ⑤ スマートフォン PWA 対応

| 要件 | 状態 | 備考 |
|------|------|------|
| `manifest.json`（standalone, theme） | ✅ | `public/manifest.json` |
| Service Worker | ⚠️ | `public/sw.js`。**開発中は登録しない** (`service-worker-register.tsx`) |
| モバイルファースト UI | ⚠️ | ログイン・ホームのみ。アプリ全体は未整備 |

---

## 4. 開発・運用フロー、インフラ

### ⑥ Git & GitHub / CI/CD

| 要件 | 状態 | 備考 |
|------|------|------|
| Git ユーザー名 `Cursor AI` | ⚠️ | 機能コミットは `Cursor AI`。Initial commit は別作者 |
| `develop` で開発 → `main` で安定版 | ✅ | `develop` push 済み (`origin/develop`) |
| `main` マージ時 GitHub Actions デプロイ | ❌ | workflow 雛形のみ。未実行・未検証 |

デプロイ手順（workflow 定義）: `git pull` → `npm ci` → `prisma migrate deploy` → `npm run build` → `pm2 reload`

### ⑦ 1Password & 機密情報

| 要件 | 状態 | 備考 |
|------|------|------|
| 秘密情報をリポジトリに含めない | ✅ | `.gitignore`, `.env.example` |
| 1Password CLI 開発注入 | ✅ | `.env.op`, `scripts/with-op-env.sh` |
| 開発 DB | ✅ | `127.0.0.1:3306` 固定。`npm run db:setup` |
| 本番 Secrets → GitHub Actions / pm2 | ❌ | 未設定 |

### 環境変数（1Password / 本番）

| 変数 | 用途 | 開発 | 本番 |
|------|------|------|------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | DB 認証 | ✅ | 要設定 |
| `DB_HOST`, `DB_PORT` | 本番 DB | — | 要設定 |
| `AUTH_SECRET` | NextAuth | ✅ | 要設定 |
| `AUTH_URL` / `AUTH_URL_DEV` | 公開 URL | ✅ | 要設定 |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth | ✅ | 要設定 |
| `ALLOWED_EMAIL` | アクセス制限 | ✅ | 要設定 |
| `DISCORD_WEBHOOK_SIGNUP_URL` | 通知 | ✅ | 要設定 |
| `DISCORD_WEBHOOK_LOGIN_URL` | 通知 | ✅ | 要設定 |
| `VPS_*` (GitHub Secrets) | デプロイ | — | ❌ |

---

## 5. ファーストプロンプト優先項目

| # | 項目 | 状態 |
|---|------|------|
| 1 | PWA `manifest.json` 雛形 | ✅ |
| 2 | Prisma スキーマ（MySQL + NextAuth + WebAuthn） | ✅ |
| 3 | Discord Webhook 通知基盤 | ✅ |
| 4 | `ecosystem.config.js` | ✅ |
| — | `develop` ブランチで開発 | ✅ |

---

## 主要ファイル索引（Agent 用）

```
認証:     src/auth.ts, src/auth.config.ts, src/middleware.ts, src/app/login/, src/components/passkey-register-card.tsx, src/lib/passkey.ts
車両:     src/app/vehicles/, src/components/vehicle-form.tsx, src/components/vehicle-list.tsx, src/lib/vehicles.ts
Discord:  src/lib/discord.ts
DB:       prisma/schema.prisma, src/lib/prisma.ts, src/lib/database-url.ts
1Password: .env.op.example, scripts/with-op-env.sh, scripts/setup-db.sh
PWA:      public/manifest.json, public/sw.js
DevOps:   ecosystem.config.js, .github/workflows/deploy.yml
進捗正本: docs/SPEC_PROGRESS.md  ← このファイル
```

## npm スクリプト（開発）

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー（1Password 経由） |
| `npm run db:setup` | ローカル MySQL に DB/ユーザー作成 |
| `npm run db:migrate` | マイグレーション適用 (`migrate deploy`) |
| `npm run db:migrate:dev` | 新規マイグレーション作成 (`migrate dev`) |
| `npm run db:check` | DB 接続確認 |

---

## 次の推奨タスク（優先順）

1. **給油記録** → **メンテ記録 + カテゴリ管理**
2. **本番デプロイ**（GitHub Secrets, VPS, `main` マージ）

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-06-21 | 車両詳細項目追加（車種名・型式・燃料種別・車検満了日・任意項目） |
| 2026-06-21 | 車両 CRUD（登録・一覧・編集・削除、`/vehicles`） |
| 2026-06-21 | Passkey 初回登録導線・顔認証ログイン実装 |
| 2026-06-21 | 初版作成（基盤実装完了時点の進捗） |
