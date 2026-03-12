# G-DX 大型リニューアル設計たたき台

## 1. 結論

今回の G-DX リニューアルは、**Lark OAuth 認証は維持しつつ、業務データの主系は PostgreSQL 系DBに移し、Lark Base は連携先・運用補助・一部マスタ管理として使うハイブリッド構成**を推奨します。

理由は以下です。

- 営業管理 / 顧客管理 / 架電 / ダッシュボードを一体運用するため、トランザクション整合性と集計性能が必要
- 2事業（Lark導入支援 / 節水器具販売）を権限で完全分離しつつ、一部ユーザーに両方見せる必要がある
- 今後の「業界別 G-DX」展開を考えると、Base単体よりも共通ドメインをコードで持った方が再利用しやすい
- バイブコーディングを前提にするなら、DBスキーマ / API契約 / 権限定義を明文化した構成の方がAI実装が安定する

---

## 2. 推奨システム方針

### 維持するもの
- Lark OAuth によるログイン
- G-DX デザインシステム
- Lark との親和性（ユーザー情報 / 組織連携 / Base連携）

### 見直すもの
- 「Lark Base = 唯一のDB」という前提
- 画面ごとの個別実装中心の作り方
- 事業別に分断された管理画面

### 新方針
- **共通G-DX基盤**を作る
- その上で**事業別モジュール**を差し込む
- 将来的には**業界別テンプレート**を追加できる構造にする

---

## 3. 推奨アーキテクチャ

## フロント
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- G-DX 共通UIコンポーネント
- TanStack Query もしくは SWR

## バックエンド
- Next.js Route Handlers / Server Actions だけで始めてもよいが、機能増大を考えると **BFF + Domain Service 層** を分離
- サービス層で以下を管理
  - 権限判定
  - 営業ロジック
  - 架電ロジック
  - ダッシュボード集計
  - Lark連携

## データ層
- **主系DB: PostgreSQL**
- ORM: Prisma または Drizzle
- キャッシュ / Queue: Redis
- ファイル: S3互換ストレージ
- 分析用: 集計テーブル / Materialized View / 日次スナップショット

## 外部連携
- Lark OAuth / ユーザー同期
- Lark Base 同期
- 架電システム（CTI）連携
- 将来的に会計・請求・メール配信等も追加可能

---

## 4. なぜ Lark Base 単独運用にしないか

Lark Base は
- 入力・一覧・共有・簡易権限
- 非エンジニア運用
- マスタ・設定・一部集計

には非常に向いています。

ただし、今回必要なのは以下です。
- 高頻度な架電ログ書き込み
- 複数画面にまたがる参照整合性
- 大量データの KPI 集計
- 事業単位の厳密な権限分離
- 将来の業界別テンプレート展開

このため、Base は「現場向け管理・共有・一部編集」に寄せ、**システムの真の正本はアプリ側DB**に持つのが安全です。

---

## 5. 2事業の権限設計

### 事業区分
- `LARK_SUPPORT`
- `WATER_SAVING`

### 表示権限
- 1のみ閲覧
- 2のみ閲覧
- 両方閲覧

### 実装方針
権限は **RBAC + ABAC** にします。

#### RBAC（役割）
例:
- `super_admin`
- `system_admin`
- `business_admin`
- `sales_manager`
- `sales_rep`
- `caller`
- `cs`
- `viewer`

#### ABAC（属性）
ユーザーに以下を持たせます。
- `allowed_businesses: ['LARK_SUPPORT']`
- `allowed_businesses: ['WATER_SAVING']`
- `allowed_businesses: ['LARK_SUPPORT', 'WATER_SAVING']`

### レコードレベルの原則
営業案件・顧客・通話ログ・ダッシュボード元データなど、基本的な業務データには必ず以下のいずれかを持たせます。
- `business_id`
- もしくは `business_scope[]`

これにより、一覧・詳細・API・集計をすべて同じ判定で制御できます。

---

## 6. 機能モジュール案

## 6-1. 共通基盤
- ユーザー管理
- ロール管理
- 事業表示権限管理
- 組織 / チーム管理
- 通知
- 監査ログ
- マスタ設定
- Lark / CTI / 外部サービス接続設定

## 6-2. 営業管理
- リード管理
- 案件管理
- 営業進捗
- タスク / 活動履歴
- 見積 / 受注ステータス
- KPI 進捗

## 6-3. 顧客管理
- 法人 / 個人顧客
- 担当者
- 契約情報
- 対応履歴
- タグ / セグメント
- 添付資料

## 6-4. 架電システム
- 架電対象リスト
- キャンペーン
- オペレーター割当
- 架電結果
- 再架電予約
- 通話履歴
- 録音URL
- スクリプト管理

## 6-5. ダッシュボード
- 全社サマリー
- 事業別KPI
- 個人 / チーム別成果
- 架電効率
- 案件進捗
- 失注 / 解約理由分析

---

## 7. コアDBテーブル案

### 認証・権限
- `users`
- `roles`
- `permissions`
- `user_roles`
- `user_business_scopes`
- `teams`
- `team_members`

### CRM / 営業
- `accounts`
- `contacts`
- `leads`
- `deals`
- `deal_stages`
- `activities`
- `tasks`
- `tags`
- `entity_tags`

### 架電
- `call_campaigns`
- `call_lists`
- `call_targets`
- `call_sessions`
- `call_results`
- `call_recordings`
- `call_callbacks`
- `call_scripts`

### 顧客契約 / 商流
- `products`
- `plans`
- `quotes`
- `orders`
- `contracts`
- `invoices`

### 分析
- `kpi_daily_snapshots`
- `dashboard_widgets`
- `saved_reports`

### 外部連携
- `lark_users`
- `lark_base_mappings`
- `sync_jobs`
- `integration_logs`

---

## 8. Lark Base の位置づけ

### Baseに残すとよいもの
- マスタデータの一部
- 業務部門が直接編集したい設定値
- 一時的なインポート元
- 非エンジニア向けの補助一覧
- 運用部門向けの簡易台帳

### Baseに置かない方がよいもの
- 架電セッションの主ログ
- リアルタイム集計の元データ
- 厳密な権限制御が必要な本番顧客データ
- 複雑なワークフロー状態
- 大量更新が前提のデータ

### 同期方式
- 原則: **App DB → Base 片方向同期**
- 例外: Base を入力起点にしたい一部マスタだけ **Base → App** を許可
- 同期ログを必ず保持
- 冪等なジョブ設計にする

---

## 9. 画面構成案

### 共通
- ダッシュボード
- 通知
- 検索
- マイページ
- 設定

### 営業
- リード一覧
- 顧客一覧
- 案件一覧
- 活動履歴
- 失注分析

### 架電
- 架電ホーム
- 架電リスト
- オペレーター画面
- 結果一覧
- 再架電管理

### 管理
- ユーザー / 権限
- 事業設定
- マスタ管理
- 連携設定
- 監査ログ

---

## 10. UI方針（添付Skillの活かし方）

デザインシステムはそのまま採用して問題ありません。
ただし、今回の大型開発では以下を追加ルールとして持つべきです。

- 画面ごとの独自UIを増やさず、共通コンポーネント比率を高める
- テーブル / フィルタ / 詳細パネル / フォーム / KPIカード を標準化する
- 事業別差分は色ではなく **項目・メニュー・権限** で表現する
- 「AI感のないUI」を守るため、装飾より情報密度と視認性を優先する

---

## 11. バイブコーディング前提の開発体制

AIで大型開発を進める場合、最も重要なのは**曖昧さをコード前に潰すこと**です。

### 必須ドキュメント
- `docs/vision.md`
- `docs/domain-model.md`
- `docs/permissions.md`
- `docs/screen-list.md`
- `docs/api-contracts.md`
- `docs/db-schema.md`
- `docs/integration/lark.md`
- `docs/integration/cti.md`
- `docs/ui-rules.md`

### 実装単位
1機能を以下の1セットで切るとAI実装が安定します。
- 目的
- 入力
- 出力
- 権限
- DB変更
- API
- UI
- 受け入れ条件

### おすすめ進め方
- 1画面ずつではなく **1業務フローずつ** 実装する
- まずは「リード獲得 → 架電 → 商談化 → 受注」など縦切りで通す
- AIには毎回「変更対象ファイル」「禁止変更」「受け入れ条件」を明示する

---

## 12. 推奨リポジトリ構成

```txt
repo/
├─ apps/
│  └─ web/
├─ packages/
│  ├─ ui/
│  ├─ domain/
│  ├─ db/
│  ├─ auth/
│  ├─ permissions/
│  ├─ integrations-lark/
│  └─ integrations-cti/
├─ docs/
├─ scripts/
└─ infra/
```

### packages の責務
- `ui`: G-DX共通UI
- `domain`: 業務ロジック
- `db`: スキーマ / マイグレーション
- `auth`: Larkログイン / セッション
- `permissions`: RBAC + ABAC 判定
- `integrations-lark`: Base / User / Webhook 連携
- `integrations-cti`: 架電連携

---

## 13. 段階的リリース案

### Phase 1
- 認証
- ユーザー / 権限
- 顧客管理
- リード管理
- 最低限ダッシュボード

### Phase 2
- 案件管理
- 活動履歴
- 架電リスト / 架電結果
- 再架電予約

### Phase 3
- CTI本連携
- 高度ダッシュボード
- Base同期の管理画面
- 監査ログ / 運用改善

### Phase 4
- 業界別テンプレート化
- 設定駆動UI
- ワークフロー拡張

---

## 14. まず最初に固定すべきこと

実装前に以下だけは必ず固定してください。

1. 2事業の正式な権限マトリクス
2. 顧客 / リード / 案件 の定義差
3. 架電システムで必要な最小項目
4. Lark Base に残すデータ / 残さないデータ
5. ダッシュボードの最重要KPI
6. CTI連携先
7. マスタの責任部署

---

## 15. 最終推奨

### 推奨結論
- **認証**: Lark OAuth 維持
- **主DB**: PostgreSQL
- **Base**: 補助 / 連携 / マスタ / 一部運用
- **権限**: RBAC + ABAC
- **構成**: 共通G-DX基盤 + 事業別モジュール
- **進め方**: 業務フロー単位の段階実装

### 避けるべきこと
- 最初から完全ノーコード化を狙う
- Baseを本番正本にし続ける
- 画面単位で個別最適を積み上げる
- 権限仕様を後回しにする
- 架電ログをUI都合で直接散在保存する

