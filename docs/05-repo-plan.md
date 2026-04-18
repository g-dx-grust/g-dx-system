# 1. Repository Design Principles

## 1.1 基本方針

G-DX は **単一リポジトリ内のモジュラーモノリス** として構成するのが最適です。
理由は以下です。

* フルリライト初期において、過剰な分散は開発速度を落とす
* Next.js を中心に UI・API・認証を一体で実装しやすい
* worker は別プロセスにしつつ、型・ドメイン知識・契約を共有できる
* AI支援実装では「どこに何を書くか」が明確な構造のほうが破綻しにくい

## 1.2 採用する設計思想

以下の責務分離を明確にします。

* **domain**: 業務ルール、エンティティ、値オブジェクト、ドメインサービス
* **application**: ユースケース、コマンド/クエリ、DTO、認可の実行単位
* **infrastructure**: DB、Redis、外部API、Lark連携、ジョブ実行
* **ui**: App Router、画面、フォーム、テーブル、画面単位の表示ロジック

## 1.3 AI-assisted coding 前提の構造ルール

AI に安定して実装させるため、以下を徹底します。

* フォルダ名は責務ベースで命名する
* 各モジュールで `domain / application / infrastructure / ui` の形を揃える
* API 入出力の型を専用化し、暗黙ルールを減らす
* DBアクセスを UI や route handler に直接書かない
* 「共通」と「業務固有」を分離する
* 1ファイル1責務を原則とする
* import 方向を固定する

  * `ui -> application -> domain`
  * `infrastructure -> domain/application`
  * `domain` は他層に依存しない

## 1.4 スコープ設計

事業軸が2つあるため、以下の分離を前提にします。

* 共有可能: companies / contacts / users
* 事業スコープあり: deals / calls / contracts / dashboard集計
* 権限は `role + businessScope` で制御
* UI と API の両方でスコープチェックを実施

## 1.5 リポジトリ方針の結論

推奨は **軽量モノレポ構成** です。

* `apps/web`: Next.js アプリ
* `apps/worker`: 非同期ジョブ実行
* `packages/*`: 共有ドメイン・共通基盤・UI・設定

これにより、単一デプロイ前提のシンプルさを保ちながら、責務分離も担保できます。

---

# 2. Recommended Folder Structure

```txt
g-dx/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (public)/
│  │  │  │  │  ├─ login/
│  │  │  │  │  └─ auth/
│  │  │  │  ├─ (protected)/
│  │  │  │  │  ├─ dashboard/
│  │  │  │  │  ├─ companies/
│  │  │  │  │  ├─ contacts/
│  │  │  │  │  ├─ deals/
│  │  │  │  │  ├─ calls/
│  │  │  │  │  ├─ settings/
│  │  │  │  │  └─ layout.tsx
│  │  │  │  ├─ api/
│  │  │  │  │  ├─ auth/
│  │  │  │  │  ├─ me/
│  │  │  │  │  ├─ companies/
│  │  │  │  │  ├─ contacts/
│  │  │  │  │  ├─ deals/
│  │  │  │  │  ├─ calls/
│  │  │  │  │  ├─ dashboards/
│  │  │  │  │  └─ lark/
│  │  │  │  ├─ globals.css
│  │  │  │  └─ layout.tsx
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/
│  │  │  │  │  ├─ ui/
│  │  │  │  │  ├─ application/
│  │  │  │  │  └─ infrastructure/
│  │  │  │  ├─ user-permission/
│  │  │  │  │  ├─ domain/
│  │  │  │  │  ├─ application/
│  │  │  │  │  ├─ infrastructure/
│  │  │  │  │  └─ ui/
│  │  │  │  ├─ customer-management/
│  │  │  │  │  ├─ company/
│  │  │  │  │  │  ├─ domain/
│  │  │  │  │  │  ├─ application/
│  │  │  │  │  │  ├─ infrastructure/
│  │  │  │  │  │  └─ ui/
│  │  │  │  │  ├─ contact/
│  │  │  │  │  └─ company/
│  │  │  │  ├─ sales-management/
│  │  │  │  │  ├─ deal/
│  │  │  │  │  ├─ pipeline/
│  │  │  │  │  └─ contract/
│  │  │  │  ├─ call-system/
│  │  │  │  │  ├─ call/
│  │  │  │  │  ├─ campaign/
│  │  │  │  │  └─ outcome/
│  │  │  │  ├─ dashboard/
│  │  │  │  │  ├─ domain/
│  │  │  │  │  ├─ application/
│  │  │  │  │  ├─ infrastructure/
│  │  │  │  │  └─ ui/
│  │  │  │  └─ audit-history/
│  │  │  │     ├─ domain/
│  │  │  │     ├─ application/
│  │  │  │     └─ infrastructure/
│  │  │  ├─ shared/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ permissions/
│  │  │  │  ├─ business-scope/
│  │  │  │  ├─ validation/
│  │  │  │  ├─ errors/
│  │  │  │  ├─ dto/
│  │  │  │  ├─ hooks/
│  │  │  │  ├─ utils/
│  │  │  │  └─ constants/
│  │  │  ├─ server/
│  │  │  │  ├─ db/
│  │  │  │  ├─ redis/
│  │  │  │  ├─ session/
│  │  │  │  ├─ lark/
│  │  │  │  ├─ queue/
│  │  │  │  └─ observability/
│  │  │  └─ middleware.ts
│  │  ├─ public/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ next.config.ts
│  │
│  └─ worker/
│     ├─ src/
│     │  ├─ jobs/
│     │  │  ├─ lark-sync/
│     │  │  ├─ dashboard-aggregation/
│     │  │  ├─ audit-export/
│     │  │  └─ notifications/
│     │  ├─ processors/
│     │  ├─ queues/
│     │  ├─ services/
│     │  ├─ bootstrap/
│     │  └─ index.ts
│     ├─ package.json
│     └─ tsconfig.json
│
├─ packages/
│  ├─ domain/
│  │  ├─ src/
│  │  │  ├─ shared/
│  │  │  ├─ auth/
│  │  │  ├─ user-permission/
│  │  │  ├─ customer-management/
│  │  │  ├─ sales-management/
│  │  │  ├─ call-system/
│  │  │  └─ dashboard/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ application/
│  │  ├─ src/
│  │  │  ├─ shared/
│  │  │  ├─ auth/
│  │  │  ├─ customer-management/
│  │  │  ├─ sales-management/
│  │  │  ├─ call-system/
│  │  │  └─ dashboard/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ infrastructure/
│  │  ├─ src/
│  │  │  ├─ db/
│  │  │  ├─ redis/
│  │  │  ├─ lark/
│  │  │  ├─ queue/
│  │  │  ├─ repositories/
│  │  │  └─ observability/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ ui/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  │  ├─ layout/
│  │  │  │  ├─ forms/
│  │  │  │  ├─ tables/
│  │  │  │  ├─ dialogs/
│  │  │  │  ├─ filters/
│  │  │  │  └─ feedback/
│  │  │  ├─ design-tokens/
│  │  │  └─ styles/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ database/
│  │  ├─ migrations/
│  │  ├─ seeds/
│  │  ├─ schema/
│  │  ├─ scripts/
│  │  └─ package.json
│  │
│  ├─ config/
│  │  ├─ eslint/
│  │  ├─ typescript/
│  │  ├─ tailwind/
│  │  ├─ vitest/
│  │  ├─ playwright/
│  │  └─ package.json
│  │
│  └─ contracts/
│     ├─ src/
│     │  ├─ api/
│     │  ├─ events/
│     │  ├─ jobs/
│     │  └─ permissions/
│     ├─ package.json
│     └─ tsconfig.json
│
├─ docs/
│  ├─ 00-foundation.md
│  ├─ 01-permission-matrix.md
│  ├─ 02-domain-model.md
│  ├─ 03-screens-and-flows.md
│  ├─ 04-api-contracts.md
│  └─ 05-repo-plan.md
│
├─ scripts/
│  ├─ setup-dev.sh
│  ├─ reset-dev-db.sh
│  ├─ seed-dev.ts
│  ├─ create-admin.ts
│  └─ lint-imports.ts
│
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     ├─ preview.yml
│     └─ deploy.yml
│
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ README.md
└─ architecture.md
```

## 2.1 構造の意図

### apps/web

* ユーザーが触る本体
* App Router、route handlers、認証境界、画面実装を持つ

### apps/worker

* Lark同期、集計更新、通知、重い処理を担当
* web と切り離してスケールしやすくする

### packages/domain

* コア業務ルール
* UI や DB への依存禁止

### packages/application

* ユースケース単位の処理
* 認可チェック、トランザクション境界の起点

### packages/infrastructure

* PostgreSQL / Redis / Queue / Lark API 接続
* Repository 実装

### packages/contracts

* APIレスポンス型、ジョブpayload、権限定義
* web と worker の契約ズレを防ぐ

### packages/database

* マイグレーション、seed、DBユーティリティ
* アプリ実装から分離して見通しをよくする

## 2.2 画面ルーティングの考え方

App Router では URL と画面を担当し、業務ロジックは modules/packages 側へ逃がします。

* `app/` は「ルート定義」
* `modules/*/ui` は「画面を組み立てる部品」
* `application` は「何を実行するか」
* `infrastructure` は「どう保存・取得するか」

これにより route handler が巨大化しにくくなります。

---

# 3. Environment Strategy

## 3.1 環境区分

最低限、以下の環境を定義します。

* local
* development
* staging
* production
* test

## 3.2 環境ごとの役割

### local

* 開発者ローカル
* Docker 等で PostgreSQL / Redis を起動
* Lark は開発用アプリ資格情報を使用

### development

* 共有開発環境
* API結合や worker 疎通を確認
* seed データを投入しやすくする

### staging

* 本番相当の検証
* migration と worker 実行を含めて確認
* リリース候補の受け入れ確認

### production

* 本番運用
* secrets の厳密管理
* 監査ログ、障害監視、バックアップ必須

### test

* unit / integration / E2E 専用
* 実運用データと完全分離
* migration を毎回クリーンに適用できる構成にする

## 3.3 環境変数ファイル方針

```txt
.env.example
.env.local
.env.test
.env.development
.env.staging
.env.production
```

## 3.4 環境変数の責務分類

環境変数は以下のカテゴリで整理します。

* app
* database
* redis
* auth
* lark
* queue
* logging
* feature flags

例:

```txt
APP_ENV=
APP_URL=

DATABASE_URL=
DATABASE_POOL_MAX=

REDIS_URL=

SESSION_SECRET=
LARK_CLIENT_ID=
LARK_CLIENT_SECRET=
LARK_REDIRECT_URI=

QUEUE_PREFIX=
QUEUE_CONCURRENCY=

LOG_LEVEL=
SENTRY_DSN=

FEATURE_ENABLE_DASHBOARD_V2=
```

## 3.5 バリデーション

起動時に env を型付きで検証します。

* 不足時は起動失敗
* 文字列のまま使わず、専用 `env.ts` から参照
* web / worker で必要な変数セットを分離する

---

# 4. Config and Secret Strategy

## 4.1 Config の原則

設定と秘密情報を混在させません。

* **Config**: リポジトリ管理可能
* **Secret**: リポジトリ管理禁止

## 4.2 Config に含めるもの

* ESLint / TypeScript / Tailwind / Vitest / Playwright 設定
* business type enum
* permission code enum
* queue名
* dashboard集計単位
* feature flag の既定値

## 4.3 Secret に含めるもの

* Lark OAuth client secret
* session secret
* DB 接続情報
* Redis 接続情報
* Sentry token 等の運用秘密情報

## 4.4 Secret 管理方針

* `.env.example` はキー名だけを保持
* 実値はクラウド secret manager または CI secret store で管理
* ローカル配布は安全な社内手段に限定
* シークレットをログ出力しない
* AI に与えるプロンプトへ実値を貼らない

## 4.5 Feature Flag 方針

大型リニューアルでは feature flag を導入します。

対象例:

* 新ダッシュボード
* 架電一覧改善
* 新権限モデル
* Lark同期の新実装

ルール:

* UI フラグ
* API フラグ
* worker フラグ
  を分ける

## 4.6 設定ファイルの推奨

```txt
packages/config/
apps/web/src/shared/constants/
apps/web/src/shared/feature-flags/
packages/contracts/src/permissions/
```

---

# 5. Testing Strategy

## 5.1 テスト方針

G-DX は業務システムのため、見た目よりも **認可・事業スコープ・集計整合性** の事故防止を優先します。

## 5.2 テスト階層

### Unit Test

対象:

* domain
* value object
* pure functions
* validation
* permission calculators

重点例:

* business scope 判定
* role 判定
* pipeline stage 遷移制約
* call outcome ルール

### Integration Test

対象:

* repository
* use case
* API route handler
* DB transaction
* Redis / queue 接続境界

重点例:

* company/contact 作成
* deal 作成時の business scope チェック
* call 登録
* dashboard 集計更新
* Lark同期結果保存

### E2E Test

対象:

* 重要画面の実利用フロー

重点例:

* Larkログイン
* 事業切替
* 顧客検索
* 商談登録
* 架電結果登録
* ダッシュボード確認

## 5.3 テストツール推奨

* unit / integration: Vitest
* E2E: Playwright
* API schema test: Zod + contract assertion
* UI regression: 初期は最小限、必要画面のみ

## 5.4 優先すべきテスト観点

最優先は以下です。

1. 認証できるか
2. 権限外アクセスを防げるか
3. 事業スコープ混線が起きないか
4. DB更新が監査ログに残るか
5. dashboard集計が正しいか
6. worker 再実行で壊れないか

## 5.5 テストデータ戦略

* seed は最小・標準・権限差分の3種を持つ
* `LARK_SUPPORT only / WATER_SAVING only / both` のユーザーを用意
* 共有 company/contact と事業別 deal/call を用意
* E2E は毎回 deterministic に再現可能にする

## 5.6 AI実装向けの補助

* 各ユースケースに `happy path + forbidden path + invalid input path` を揃える
* PR 作成時はテスト観点テンプレートを必須化
* バグ再現コードを `tests/regression/` に残す

---

# 6. Migration Strategy

## 6.1 基本方針

DB スキーマ変更は **常に migration ファースト** で管理します。

* 手動SQL直変更を禁止
* すべての変更を履歴化
* web と worker の両方が同じ schema 前提で動けるようにする

## 6.2 推奨運用

* migration は `packages/database/migrations` に集約
* 1 PR に 1 論理変更単位を原則とする
* schema 変更とアプリ変更を同PRに含める
* rollout 時は migration 完了後に web/worker を切り替える

## 6.3 migration の分類

### Expand

新カラム/新テーブル追加など、既存コードを壊さない変更

### Migrate

データ移行、バックフィル、worker 再集計

### Contract

旧カラム/旧テーブル削除

この 3 段階で進めると安全です。

## 6.4 seed 戦略

* `base seed`: 権限・初期マスタ
* `dev seed`: 画面確認用データ
* `test seed`: 自動テスト専用
* `demo seed`: ステークホルダー確認用

## 6.5 注意点

* dashboard は集計テーブルがある場合、migration 後に再集計ジョブを流す
* business scope 導入カラムは not null 化を急がず段階的に進める
* Lark同期対象テーブルは idempotent 更新前提で設計する

## 6.6 必須スクリプト

```txt
pnpm db:migrate
pnpm db:rollback
pnpm db:seed
pnpm db:reset
pnpm db:check
```

---

# 7. Worker Job Structure

## 7.1 worker 分離の理由

以下は web リクエスト同期処理に置かない方が安全です。

* Larkデータ同期
* dashboard 再集計
* 大量監査ログエクスポート
* 通知
* 将来のバッチ整形処理

## 7.2 ジョブの分類

### integration jobs

* Lark user sync
* Lark base/import sync
* 外部連携再試行

### aggregation jobs

* dashboard daily summary
* KPI recalc
* pipeline metrics refresh

### maintenance jobs

* old session cleanup
* job retry cleanup
* audit archive

### notification jobs

* 同期待ち警告
* 異常終了通知
* 期限接近通知

## 7.3 推奨構造

```txt
apps/worker/src/
├─ jobs/
│  ├─ lark-sync/
│  │  ├─ enqueue.ts
│  │  ├─ processor.ts
│  │  ├─ payload.ts
│  │  └─ retry-policy.ts
│  ├─ dashboard-aggregation/
│  ├─ notifications/
│  └─ maintenance/
├─ processors/
├─ queues/
├─ services/
└─ bootstrap/
```

## 7.4 ジョブ設計ルール

* payload 型は `packages/contracts` に置く
* idempotent に実行できること
* retry policy をジョブごとに定義
* dead letter 的な失敗保管を持つ
* ログには `jobName / entityId / businessScope / traceId` を含める

## 7.5 実装上の注意

* DB更新とジョブ投入の整合性に注意する
* 重要ジョブは outbox パターン寄りで扱う
* dashboard 集計は再実行可能にする
* Lark同期は「最後に成功した同期時刻」を記録する

## 7.6 最初に作るべきジョブ

1. dashboard 集計更新
2. Lark user sync
3. Lark base/import sync
4. 通知基盤
5. 保守系 cleanup

---

# 8. CI/CD Baseline

## 8.1 CI の最低ライン

Pull Request ごとに以下を必須化します。

* install
* lint
* typecheck
* unit test
* integration test
* build web
* build worker
* migration dry-run
* dependency audit の軽量チェック

## 8.2 PR チェック項目

### static checks

* ESLint
* TypeScript
* import rule
* circular dependency check

### test checks

* unit
* integration
* 重要フローの最小 E2E

### schema checks

* migration ファイル存在確認
* schema 差分確認
* seed 実行確認

## 8.3 CD の基本

### staging

* main マージで自動デプロイ
* migration 適用
* web デプロイ
* worker デプロイ
* smoke test 実行

### production

* 手動承認付き
* migration 実行順序を固定
* デプロイ後の health check 実施
* 失敗時ロールバック手順を事前定義

## 8.4 監視の最低ライン

* アプリケーションエラー監視
* API レイテンシ
* queue backlog
* failed jobs 数
* DB 接続異常
* Lark OAuth 失敗率
* dashboard 集計失敗率

## 8.5 ブランチ戦略

* `main`: 常にデプロイ可能
* `feature/*`: 個別機能
* `fix/*`: 不具合修正
* `chore/*`: 雑務

## 8.6 AI支援前提の運用ルール

* PR テンプレートに「対象モジュール」「影響権限」「影響事業スコープ」を書かせる
* AI生成コードでも必ず typecheck と test を通す
* 大きな変更は vertical slice 単位で分割マージする

---

# 9. Recommended Implementation Sequence

## 9.1 実装順序の原則

G-DX は画面から作るのではなく、**基盤 → 権限 → 共通マスタ → 業務機能 → 集計** の順で進めます。

## 9.2 推奨実装順

### Phase 0: Repository bootstrap

* monorepo 初期化
* Next.js / worker / shared packages 作成
* lint / typecheck / test 基盤
* env validation
* DB / Redis 接続
* CI 初期構築

### Phase 1: Auth and session foundation

* Lark OAuth
* session 管理
* current user 取得
* route protection
* middleware
* logout

### Phase 2: Permission and business scope foundation

* role model
* business scope model
* permission evaluator
* API 側認可ミドルウェア
* UI 側ガード
* forbidden 応答共通化

### Phase 3: Shared master and customer base

* users
* companies
* companies
* contacts
* company/contact 一覧・詳細・作成・更新
* 監査ログ記録

### Phase 4: Sales management MVP

* pipeline master
* deals
* deal stage update
* business-scoped visibility
* deal 一覧・詳細・作成・更新

### Phase 5: Call system MVP

* call result master
* calls
* call registration
* company/contact 紐付け
* business-scoped visibility

### Phase 6: Dashboard MVP

* KPI 定義
* 集計ジョブ
* dashboard API
* 日次/週次/月次表示

### Phase 7: Lark integration

* user sync
* base/import sync
* sync log
* retry / failure handling

### Phase 8: Operational hardening

* E2E 拡充
* observability
* rate limit / retry tuning
* performance tuning
* audit export
* feature flags 運用

## 9.3 なぜこの順番か

* 認証と認可がないと全機能が不安定になる
* 顧客基盤がないと商談・架電の参照先がない
* dashboard は元データ機能の後でないと正しく作れない
* Lark連携は早すぎると本体が固まっていないため手戻りが増える

---

# 10. First Vertical Slice Recommendation

## 10.1 推奨する最初の縦切り

最初の vertical slice は以下を推奨します。

**「Larkログイン → ユーザー判定 → 事業スコープ適用 → 顧客アカウント一覧表示 → 顧客新規作成 → 監査ログ記録」**

## 10.2 この slice を最初に選ぶ理由

この slice だけで、基盤の重要要素をまとめて検証できます。

* Lark OAuth
* session
* route protection
* role + business scope
* API route
* DB 読み書き
* 共通UI部品
* form validation
* audit log
* CI での最低品質確認

つまり、今後の全機能の土台になります。

## 10.3 含めるべき実装範囲

### UI

* ログイン画面
* 顧客アカウント一覧画面
* 顧客新規作成ダイアログまたは画面
* 権限不足表示
* 事業スコープ表示

### API

* auth callback
* me
* companies list
* companies create

### domain/application

* Company entity
* company create use case
* company list query
* permission check
* business scope resolution

### infrastructure

* company repository
* session store
* audit repository
* DB migration
* seed

## 10.4 完了条件

この slice の Done 条件は以下です。

* Lark OAuth でログインできる
* ログイン後に自分の事業スコープが判定される
* 権限に応じて companies 一覧が見える
* companies を新規作成できる
* 作成操作が監査ログに残る
* unit / integration / 最小 E2E が通る
* staging へデプロイできる

## 10.5 次の slice

この後は以下の順が自然です。

1. contacts 管理
2. deals 管理
3. calls 管理
4. dashboard 集計
5. Lark同期強化

## 10.6 実装開始時の運用ルール

最初の vertical slice から以下を固定してください。

* 新機能は必ず use case 単位で作る
* route handler 直書きで業務ルールを増やさない
* 権限判定を共通化する
* DB モデル名と画面用 DTO を分ける
* 監査ログを後回しにしない

このルールを最初に定着させると、後半での崩壊をかなり防げます。
