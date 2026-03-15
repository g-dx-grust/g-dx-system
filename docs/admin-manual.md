# G-DX 管理者用マニュアル

**対象バージョン:** G-DX v1.0
**対象ユーザー:** SUPER_ADMIN / ADMIN
**最終更新:** 2026年3月

---

## 目次

1. [管理者の役割と責務](#1-管理者の役割と責務)
2. [ロールと権限の仕組み](#2-ロールと権限の仕組み)
3. [ユーザー管理](#3-ユーザー管理)
4. [事業部管理](#4-事業部管理)
5. [マスターデータ管理](#5-マスターデータ管理)
6. [Lark連携の設定と管理](#6-lark連携の設定と管理)
7. [データのインポート・エクスポート](#7-データのインポートエクスポート)
8. [監査ログの確認](#8-監査ログの確認)
9. [システム構成・技術情報](#9-システム構成技術情報)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 管理者の役割と責務

G-DX には2段階の管理者ロールがあります。

| ロール | 日本語名 | 主な責務 |
|---|---|---|
| **SUPER_ADMIN** | スーパー管理者 | システム全体の管理。全権限を保有。 |
| **ADMIN** | 管理者 | 日常的なユーザー管理・データ管理。一部の重要操作は制限あり。 |

### SUPER_ADMIN と ADMIN の差異

| 操作 | SUPER_ADMIN | ADMIN |
|---|---|---|
| ユーザー作成・ロール割り当て | ✅ | ✅ |
| 案件の事業部スコープ変更 | ✅ | ❌ |
| エクスポート（詳細データ） | ✅ | 条件付き |
| 監査ログ閲覧 | ✅ | ✅ |
| Lark同期管理 | ✅ | ✅ |

---

## 2. ロールと権限の仕組み

### 2.1 ロール一覧

| ロール | 名称 | 主な用途 |
|---|---|---|
| SUPER_ADMIN | スーパー管理者 | システム全体管理者 |
| ADMIN | 管理者 | 事業部管理者 |
| MANAGER | マネージャー | チームリーダー・マネジメント担当 |
| OPERATOR | オペレーター | 一般営業担当者 |
| VIEWER | ビューワー | 閲覧専用ユーザー |

### 2.2 権限マトリクス詳細

#### 顧客管理（customer.*）

| 権限キー | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| customer.company.read | Y | Y | Y | Y | Y |
| customer.company.create | Y | Y | Y | Y | N |
| customer.company.update | Y | Y | Y | C | N |
| customer.company.delete | Y | Y | N | N | N |
| customer.contact.read | Y | Y | Y | Y | Y |
| customer.contact.create | Y | Y | Y | Y | N |
| customer.contact.update | Y | Y | Y | C | N |
| customer.contact.delete | Y | Y | N | N | N |

#### 営業管理（sales.*）

| 権限キー | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| sales.deal.read | Y | Y | Y | Y | Y |
| sales.deal.create | Y | Y | Y | Y | N |
| sales.deal.update.basic | Y | Y | Y | C | N |
| sales.deal.update.critical | Y | Y | C | N | N |
| sales.deal.reassign | Y | Y | C | N | N |
| sales.deal.changeBusinessScope | Y | N | N | N | N |
| sales.deal.delete | Y | Y | N | N | N |
| sales.contract.read | Y | Y | Y | C | Y |
| sales.contract.create | Y | Y | C | C | N |
| sales.contract.update.basic | Y | Y | Y | C | N |
| sales.contract.manage | Y | Y | C | N | N |
| sales.contract.delete | Y | Y | N | N | N |

#### コール管理（call.*）

| 権限キー | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| call.task.read | Y | Y | Y | Y | Y |
| call.task.create | Y | Y | Y | Y | N |
| call.task.update | Y | Y | Y | C | N |
| call.task.delete | Y | Y | N | N | N |
| call.log.read | Y | Y | Y | Y | Y |
| call.log.create | Y | Y | Y | Y | N |
| call.log.update | Y | Y | Y | C | N |
| call.log.delete | Y | Y | N | N | N |

#### ダッシュボード（dashboard.*）

| 権限キー | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| dashboard.team.view | Y | Y | Y | N | C |
| dashboard.business.view | Y | Y | Y | N | C |
| dashboard.personal.view | Y | Y | Y | Y | Y |
| dashboard.kpi.view | Y | Y | Y | Y | Y |

#### システム管理（auth.* / audit.* / integration.*）

| 権限キー | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| auth.user.manage | Y | Y | N | N | N |
| auth.role.manage | Y | Y | N | N | N |
| audit.read | Y | Y | N | N | N |
| integration.sync.manage | Y | Y | N | N | N |
| import.basic | Y | Y | Y | Y | N |
| import.detail | Y | Y | N | N | N |
| export.basic | Y | Y | Y | C | N |
| export.detail | Y | C | N | N | N |

**凡例:** Y = 常に許可 / C = 条件付き（主に本人データのみ等） / N = 禁止

---

## 3. ユーザー管理

### 3.1 ユーザー一覧の確認

管理者パネル（`/admin/`）からユーザー一覧にアクセスします。

**表示項目**

| 列名 | 内容 |
|---|---|
| ユーザー名 | 表示名 |
| メールアドレス | Larkに紐づくメール |
| ステータス | active / inactive / suspended |
| 最終ログイン | 最後にログインした日時 |
| 割り当てロール | 付与されているロール |
| 所属事業部 | 参照・操作できる事業部 |

### 3.2 ユーザーへのロール割り当て

1. ユーザー一覧から対象ユーザーの「**編集**」をクリックします。
2. ロール編集フォームで、付与するロールをチェックボックスで選択します。
3. 「**保存**」をクリックします。

> **注意事項**
> - 1人のユーザーに複数のロールを割り当てることができます。
> - ロールが重複した場合、より強い権限が適用されます（最大権限ルール）。
> - SUPER_ADMIN ロールの付与は慎重に行ってください。

### 3.3 ユーザーへの事業部割り当て

1. ユーザー一覧から対象ユーザーの「**編集**」をクリックします。
2. 事業部メンバーシップ設定で、所属させる事業部を選択します。

| 事業部 | 説明 |
|---|---|
| LARK_SUPPORT | Lark導入支援事業の案件・契約・コールにアクセス可能 |
| WATER_SAVING | 節水器具販売（JET）の案件・契約・施設にアクセス可能 |

3. 「**保存**」をクリックします。

> - 事業部に所属していないユーザーは、その事業部のデータを閲覧できません。
> - 両方の事業部に所属させることも可能です。

### 3.4 ユーザーステータスの変更

| ステータス | 意味 | ログイン可否 |
|---|---|---|
| active | 有効 | 可能 |
| inactive | 無効 | 不可 |
| suspended | 停止中 | 不可 |

退職・異動したユーザーは `inactive` または `suspended` に変更してください。
物理削除は行わず、ステータス変更によって論理的に無効化します。

---

## 4. 事業部管理

### 4.1 事業部の構成

G-DX は以下の2事業部で稼働しています。

| 事業部コード | 表示名 | 主な機能 |
|---|---|---|
| LARK_SUPPORT | Lark導入支援 | 案件・契約・コール管理 |
| WATER_SAVING | 節水器具販売（JET） | 案件・契約・コール・施設管理・JET契約 |

### 4.2 事業部スコープのルール

- 案件・契約・コールログなどのトランザクションデータには必ず `businessUnitId` が設定されます。
- 「両方の事業部」をまたぐトランザクションデータは作成できません。
- 会社・コンタクト情報は両事業部で共有されます（`businessUnitId` なし）。

---

## 5. マスターデータ管理

マスターデータはデータベースに直接シードで投入されます。
CSVファイルを修正してシードスクリプトを実行することで更新できます。

### 5.1 マスターテーブル一覧

| テーブル名 | 内容 |
|---|---|
| master_industry | 業種マスター |
| master_acquisition_method | 獲得方法マスター |
| master_jet_deal_status | JET案件ステータス |
| master_jet_credit_status | JETクレジットステータス |
| master_jet_status2 | JETステータス2 |
| master_call_result | コール結果マスター |
| master_pipeline_stage | パイプラインステージ |

### 5.2 マスターデータの更新手順

1. `packages/database/src/seeds/masters/` 配下の対象CSVファイルを編集します。
2. 以下のコマンドでシードを実行します。

```bash
pnpm --filter @g-dx/database exec tsx src/seeds/seed-masters.ts
```

3. 実行後、画面を更新してデータが反映されていることを確認します。

> マスターデータの変更は本番環境に即時反映されます。変更前にバックアップを取得することを推奨します。

---

## 6. Lark連携の設定と管理

### 6.1 Lark OAuthの設定

G-DX はLark OAuthを認証基盤として使用しています。

**必要な設定（環境変数）**

| 環境変数 | 説明 |
|---|---|
| `LARK_APP_ID` | Larkアプリのアプリケーションキー |
| `LARK_APP_SECRET` | Larkアプリのシークレット |
| `LARK_OAUTH_REDIRECT_URI` | OAuth認証後のリダイレクトURL |

これらは `apps/web/.env` または本番環境の環境変数に設定します。

### 6.2 案件レベルのLark連携

各案件にLarkグループチャットやカレンダーを紐づけることができます。

| 項目 | 形式 | 説明 |
|---|---|---|
| グループチャットID | `oc_xxxxxxxxxx` | 案件専用Larkグループチャット |
| カレンダーID | — | Larkカレンダー（活動のシンクに使用） |

連携ステータスは案件詳細画面の「Lark連携設定」に「接続済み」バッジとして表示されます。

### 6.3 Lark同期管理

`integration.sync.manage` 権限を持つ管理者は、Larkとのデータ同期を管理できます。
同期設定や実行は管理者パネルから行います。

---

## 7. データのインポート・エクスポート

### 7.1 CSVインポート（会社データ）

会社データのCSVインポートはオペレーター以上の権限で利用できます。
詳細データのインポートはADMIN以上が必要です。

**インポート手順**

1. 「**顧客管理 > 会社**」一覧ページへ移動します。
2. 「**CSVインポート**」ボタンをクリックします。
3. CSVファイルをアップロードします。
4. マッピング確認後、「**インポート実行**」をクリックします。

**CSVフォーマット（会社）**

| 列名 | 必須 | 説明 |
|---|---|---|
| company_name | ✅ | 会社名 |
| industry | — | 業種（マスター値に一致させること） |
| phone | — | 電話番号 |
| website | — | ウェブサイトURL |
| address | — | 住所 |
| tags | — | カンマ区切りのタグ |

### 7.2 データエクスポート

ADMIN以上は詳細データのエクスポートが可能です。
各一覧画面の「**エクスポート**」ボタンから実行します。

---

## 8. 監査ログの確認

### 8.1 監査ログへのアクセス

`audit.read` 権限（ADMIN以上）で監査ログを閲覧できます。
管理者パネルの「**監査ログ**」セクションへアクセスします。

### 8.2 記録される操作

監査ログには以下の操作が記録されます。

- ユーザーのロール変更・事業部割り当て変更
- 案件・契約・顧客データの作成・更新・削除
- ステージ変更
- コールログの記録

### 8.3 監査ログの表示項目

| 項目 | 内容 |
|---|---|
| 操作日時 | UTC表示（JST換算: +9時間） |
| 操作ユーザー | 操作を行ったユーザー名 |
| 操作種別 | CREATE / UPDATE / DELETE |
| 対象リソース | 操作したデータの種別とID |
| 変更内容 | 変更前後の値（JSON形式） |

---

## 9. システム構成・技術情報

### 9.1 システムアーキテクチャ

```
apps/
  web/          — Next.js 14 (App Router) フロントエンド + サーバーサイド
  worker/       — バックグラウンドジョブワーカー

packages/
  database/     — Drizzle ORM スキーマ・マイグレーション
  contracts/    — TypeScript型定義・権限マトリクス
  domain/       — ドメインロジック
  application/  — アプリケーション層
  infrastructure/ — インフラ層
  ui/           — 共有UIコンポーネント
  config/       — ランタイム設定
```

### 9.2 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| スタイリング | Tailwind CSS |
| データベース | PostgreSQL |
| ORM | Drizzle ORM |
| 認証 | Lark OAuth |
| セッション | Cookie（`gdx_session`） |
| モノレポ | Turborepo + pnpm workspaces |

### 9.3 セッション管理

- セッションはCookieベースです（Cookie名: `gdx_session`）。
- CookieにはユーザーIDが格納されます。
- セッション有効期限はサーバー設定に依存します。

### 9.4 データベースマイグレーション

```bash
# マイグレーションの実行
pnpm --filter @g-dx/database migrate

# マイグレーションファイルの生成
pnpm --filter @g-dx/database generate
```

マイグレーションファイルは `packages/database/migrations/` に格納されています。

### 9.5 ソフトデリート

案件・会社・コンタクト・契約などの主要データは物理削除ではなく、
`deletedAt` タイムスタンプを設定するソフトデリートで管理されます。
通常の一覧には `deletedAt IS NULL` のデータのみ表示されます。

---

## 10. トラブルシューティング

### ログインできないユーザーがいる

1. 対象ユーザーのステータスを確認します（`active` 以外は不可）。
2. 対象ユーザーがLarkワークスペースのメンバーか確認します。
3. Lark OAuthのリダイレクトURLが正しく設定されているか確認します（環境変数 `LARK_OAUTH_REDIRECT_URI`）。
4. ブラウザのCookieをクリアさせてから再試行します。

### ユーザーに特定のメニューが表示されない

1. 対象ユーザーに適切なロールが割り当てられているか確認します。
2. 表示したい事業部に所属メンバーとして登録されているか確認します。
3. ロール・メンバーシップの変更後はユーザーに再ログインを促します（セッションの更新が必要な場合があります）。

### 案件・契約データが表示されない

1. ユーザーが正しい事業部に切り替えているか確認します。
2. 検索フィルターがかかっていないか確認します。
3. ユーザーが対象事業部のメンバーとして登録されているか確認します。

### Lark OAuthエラー

1. `LARK_APP_ID` / `LARK_APP_SECRET` が正しいか確認します。
2. Larkアプリのリダイレクト許可URLにシステムURLが追加されているか確認します。
3. Lark Developer ConsoleでアプリのステータスがActiveであることを確認します。

### データベース接続エラー

1. `DATABASE_URL` 環境変数が正しく設定されているか確認します。
2. PostgreSQLサーバーが起動中であることを確認します。
3. ファイアウォール・セキュリティグループの設定でDBへの接続が許可されているか確認します。

### マイグレーションエラー

```bash
# マイグレーション状態の確認
pnpm --filter @g-dx/database migrate:status

# 問題が発生した場合はマイグレーションファイルを確認
ls packages/database/migrations/
```

最新のマイグレーションファイル（`0006_lark_deal_fields.sql` 等）が適用済みか確認します。

---

## 付録：環境変数一覧

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL接続文字列 |
| `LARK_APP_ID` | ✅ | LarkアプリのApp ID |
| `LARK_APP_SECRET` | ✅ | LarkアプリのApp Secret |
| `LARK_OAUTH_REDIRECT_URI` | ✅ | OAuth認証後のリダイレクトURL |
| `SESSION_SECRET` | ✅ | セッション暗号化キー（ランダムな長い文字列） |
| `NEXT_PUBLIC_APP_URL` | ✅ | アプリケーションの公開URL |

---

*本マニュアルに関するご質問・ご要望はシステム開発チームにお問い合わせください。*
