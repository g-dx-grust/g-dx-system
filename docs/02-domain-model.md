## 1. Domain Modeling Principles

* **共有マスタと事業別運用データを分離する。**
  `companies` と `contacts` は全社共有のコアマスタにし、事業ごとの営業状態・担当・温度感は `*_business_profiles` に分離します。これにより、同一企業を `LARK_SUPPORT` と `WATER_SAVING` の両方で扱えて、重複登録も抑えられます。

* **事業スコープを第一級概念として扱う。**
  商談、架電、タスク、集計は必ず `business_unit_id` を持つ設計にします。
  逆に、共有マスタには直接 `business_unit_id` を持たせず、共有と事業別状態を意図的に分けます。

* **将来拡張は「固定コア + 制御された拡張」で吸収する。**
  v1 では汎用メタデータ基盤や自由定義フィールド基盤は作りません。
  代わりに、

  1. まず共通項目は通常カラムで持つ
  2. 変動が小さい補助項目だけ `jsonb` で保持する
  3. 業界固有項目が安定したら専用拡張テーブルを追加する
     という方針にします。

* **状態テーブルと履歴テーブルを分ける。**
  例として `deals` は現在状態、`deal_stage_history` は遷移履歴です。
  `call_logs` は通話実績そのものを履歴テーブルとして扱い、`call_targets` は現在の架電対象状態を持ちます。

* **PostgreSQL に素直な論理設計にする。**
  主キーは原則 `uuid`、日時は `timestamptz`、可変補助情報は `jsonb`、メールは `citext` を前提にします。
  状態値は PostgreSQL の enum よりも `text + check` もしくは参照マスタを優先し、将来変更を容易にします。

* **監査列を全体規約にする。**
  主要な可変テーブルには原則として `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id` を持たせ、必要に応じて `deleted_at` によるソフトデリートを採用します。

---

## 2. Core Entities

| Entity                 | 役割              | 共有/事業別   | 主な利用モジュール                                          |
| ---------------------- | --------------- | -------- | -------------------------------------------------- |
| BusinessUnit           | 事業軸マスタ          | 事業定義     | 全体                                                 |
| User                   | 利用者・社内アカウント     | 共有       | 全体                                                 |
| UserBusinessMembership | 利用者がどの事業に所属するか  | 事業別      | 全体                                                 |
| Role                   | RBAC ロール定義      | 共有       | 全体                                                 |
| UserRoleAssignment     | 利用者へのロール付与      | 共有/事業別付与 | 全体                                                 |
| Company                | 共有企業マスタ         | 共有       | customer_management, sales_management              |
| CompanyBusinessProfile | 企業の事業別状態        | 事業別      | customer_management, sales_management              |
| Contact                | 共有担当者マスタ        | 共有       | customer_management, call_system                   |
| ContactBusinessProfile | 担当者の事業別状態・連絡可否  | 事業別      | customer_management, call_system                   |
| CompanyContactLink     | 企業と担当者の関連       | 共有       | customer_management                                |
| Pipeline               | 事業別営業パイプライン     | 事業別      | sales_management                                   |
| PipelineStage          | パイプライン内のステージ    | 事業別      | sales_management                                   |
| Deal                   | 商談・案件           | 事業別      | sales_management                                   |
| DealStageHistory       | 商談ステージ履歴        | 事業別      | sales_management, dashboard                        |
| CallCampaign           | 架電キャンペーン・リスト    | 事業別      | call_system                                        |
| CallTarget             | 架電対象            | 事業別      | call_system                                        |
| CallLog                | 通話実績            | 事業別      | call_system, dashboard                             |
| Task                   | 次アクション・フォローアップ  | 事業別      | sales_management, customer_management, call_system |
| DashboardDailyMetric   | 日次集計 read model | 事業別      | dashboard                                          |
| AuditLog               | 変更証跡            | 横断       | 全体                                                 |
| ExternalRecordLink     | 外部システムとの ID 対応  | 横断       | integration                                        |
| LarkSyncJob            | Lark Base 同期ジョブ | 横断       | integration                                        |

---

## 3. Entity Relationship Overview

```text
business_units
  ├─< user_business_memberships >─ users
  ├─< company_business_profiles >─ companies
  ├─< contact_business_profiles >─ contacts
  ├─< pipelines ─< pipeline_stages
  ├─< deals ─< deal_stage_history
  ├─< call_campaigns ─< call_targets ─< call_logs
  ├─< tasks
  └─< dashboard_daily_metrics

companies ─< company_contact_links >─ contacts

users ─< user_role_assignments >─ roles

companies ─< deals
contacts  ─< deals

companies ─< call_targets
contacts  ─< call_targets

companies ─< call_logs
contacts  ─< call_logs
deals     ─< call_logs

all major entities ─< audit_logs
all major entities ─< external_record_links ─< lark_sync_jobs
```

* **共有企業/共有担当者**が顧客の共通 ID 軸です。
  同じ企業に対して `LARK_SUPPORT` 用と `WATER_SAVING` 用の `company_business_profiles` を別々に持てます。

* **商談と通話は事業単位で独立**します。
  同一企業に対して、別事業で別商談・別架電履歴を持つのが標準です。

* **可視性の基点は business profile** です。
  `companies` 自体は共有でも、実際の運用可視性は `company_business_profiles` / `contact_business_profiles` で制御します。

* **ダッシュボードは source of truth を持たない** 方針です。
  元データは `deals`, `deal_stage_history`, `call_logs`, `tasks` 等で、`dashboard_daily_metrics` は集計結果のみ保持します。

---

## 4. Table List

| Area                  | Tables                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Identity and Access   | `business_units`, `users`, `user_business_memberships`, `roles`, `user_role_assignments`                   |
| Shared Customer Core  | `companies`, `company_business_profiles`, `contacts`, `contact_business_profiles`, `company_contact_links` |
| Sales Management      | `pipelines`, `pipeline_stages`, `deals`, `deal_stage_history`                                              |
| Call System           | `call_campaigns`, `call_targets`, `call_logs`                                                              |
| Workflow              | `tasks`                                                                                                    |
| Dashboard             | `dashboard_daily_metrics`                                                                                  |
| Audit and Integration | `audit_logs`, `external_record_links`, `lark_sync_jobs`                                                    |

---

## 5. Table-by-Table Schema Draft

> 型表記は論理スキーマの目安です。共通監査列は繰り返しを避けるため要点中心で記載しています。

### `business_units`

* **purpose**: 事業軸マスタ。`LARK_SUPPORT` と `WATER_SAVING` を定義する。
* **primary keys**: `id uuid`
* **important columns**:

  * `code text unique`
  * `name text`
  * `is_active boolean`
  * `sort_order integer`
* **foreign keys**: なし
* **business scope behavior**: スコープそのものを表す基底テーブル。
* **notes**: 初期値は 2 件で開始し、将来の業界別バリアント追加にも対応可能。

### `users`

* **purpose**: Lark OAuth 認証済みの社内ユーザーを保持する。
* **primary keys**: `id uuid`
* **important columns**:

  * `lark_open_id text unique`
  * `lark_union_id text null`
  * `lark_tenant_key text`
  * `email citext`
  * `display_name text`
  * `employee_code text null`
  * `status text`
  * `last_login_at timestamptz null`
* **foreign keys**: なし
* **business scope behavior**: ユーザー自体は共有。所属可能事業は `user_business_memberships` で表現する。
* **notes**: ローカルパスワードは持たず、認証ソースは Lark のみ。

### `user_business_memberships`

* **purpose**: ユーザーがどの事業スコープに属するかを表す。
* **primary keys**: `id uuid`
* **important columns**:

  * `user_id uuid`
  * `business_unit_id uuid`
  * `membership_status text`
  * `is_default boolean`
  * `joined_at timestamptz`
* **foreign keys**:

  * `user_id -> users.id`
  * `business_unit_id -> business_units.id`
* **business scope behavior**: 1 ユーザーが 1 つまたは複数事業に所属可能。
* **notes**: `unique(user_id, business_unit_id)` を持つ前提。初期表示事業のため `is_default` を置く。

### `roles`

* **purpose**: RBAC のロール定義を保持する。
* **primary keys**: `id uuid`
* **important columns**:

  * `code text unique`
  * `name text`
  * `module_key text`
  * `description text null`
  * `is_system_role boolean`
  * `sort_order integer`
* **foreign keys**: なし
* **business scope behavior**: ロール定義自体は共有。
* **notes**: 権限定義は seed データまたはアプリ設定を基本とし、v1 では自由編集式のロールビルダーは持たない。

### `user_role_assignments`

* **purpose**: ユーザーにロールを付与する。
* **primary keys**: `id uuid`
* **important columns**:

  * `user_id uuid`
  * `role_id uuid`
  * `business_unit_id uuid null`
  * `granted_by_user_id uuid null`
  * `granted_at timestamptz`
  * `expires_at timestamptz null`
* **foreign keys**:

  * `user_id -> users.id`
  * `role_id -> roles.id`
  * `business_unit_id -> business_units.id`
  * `granted_by_user_id -> users.id`
* **business scope behavior**: `business_unit_id` が入る場合は事業限定付与、`null` の場合は全体ロール。
* **notes**: グローバル管理者と事業別管理者を同じ仕組みで扱える。

### `companies`

* **purpose**: 共有企業マスタ。CRM 上の company の正本。
* **primary keys**: `id uuid`
* **important columns**:

  * `legal_name text`
  * `display_name text`
  * `corporate_number text null`
  * `website text null`
  * `main_phone text null`
  * `country_code text null`
  * `postal_code text null`
  * `prefecture text null`
  * `city text null`
  * `address_line1 text null`
  * `address_line2 text null`
  * `normalized_name text`
  * `merged_into_company_id uuid null`
* **foreign keys**:

  * `merged_into_company_id -> companies.id`
* **business scope behavior**: 共有マスタ。直接の事業スコープ列は持たない。
* **notes**: 重複統合のため `merged_into_company_id` を持つ。可視性や担当は `company_business_profiles` 側で管理する。

### `company_business_profiles`

* **purpose**: 企業の事業別営業状態・担当・優先度を持つ。
* **primary keys**: `id uuid`
* **important columns**:

  * `company_id uuid`
  * `business_unit_id uuid`
  * `owner_user_id uuid null`
  * `customer_status text`
  * `lead_source_code text null`
  * `rank_code text null`
  * `last_contact_at timestamptz null`
  * `next_action_at timestamptz null`
  * `profile_attributes jsonb null`
* **foreign keys**:

  * `company_id -> companies.id`
  * `business_unit_id -> business_units.id`
  * `owner_user_id -> users.id`
* **business scope behavior**: `unique(company_id, business_unit_id)` の事業別レコード。
* **notes**: 共有企業に対し、事業ごとに別の担当者・顧客ステータス・温度感を持てる。

### `contacts`

* **purpose**: 共有担当者マスタ。
* **primary keys**: `id uuid`
* **important columns**:

  * `last_name text`
  * `first_name text`
  * `full_name text`
  * `email citext null`
  * `mobile_phone text null`
  * `department text null`
  * `job_title text null`
  * `contact_status text`
* **foreign keys**: なし
* **business scope behavior**: 共有マスタ。事業別の状態は持たない。
* **notes**: PII を含むため、将来的に列単位マスキング対象になりやすいテーブル。

### `contact_business_profiles`

* **purpose**: 担当者の事業別状態、連絡可否、担当者情報を持つ。
* **primary keys**: `id uuid`
* **important columns**:

  * `contact_id uuid`
  * `business_unit_id uuid`
  * `owner_user_id uuid null`
  * `engagement_status text`
  * `do_not_call boolean`
  * `do_not_email boolean`
  * `preferred_contact_time text null`
  * `last_contact_at timestamptz null`
  * `profile_attributes jsonb null`
* **foreign keys**:

  * `contact_id -> contacts.id`
  * `business_unit_id -> business_units.id`
  * `owner_user_id -> users.id`
* **business scope behavior**: `unique(contact_id, business_unit_id)` の事業別レコード。
* **notes**: 同じ担当者でも事業別に連絡可否や温度感を変えられる。

### `company_contact_links`

* **purpose**: 企業と担当者の所属・関係を表す中間テーブル。
* **primary keys**: `id uuid`
* **important columns**:

  * `company_id uuid`
  * `contact_id uuid`
  * `relationship_type text`
  * `is_primary boolean`
  * `department_label text null`
  * `start_date date null`
  * `end_date date null`
* **foreign keys**:

  * `company_id -> companies.id`
  * `contact_id -> contacts.id`
* **business scope behavior**: 共有関係。事業別の営業状態は持たない。
* **notes**: 会社と担当者の実世界の結びつきを表し、事業別状態は別テーブルに逃がす。

### `pipelines`

* **purpose**: 事業ごとの営業パイプライン定義。
* **primary keys**: `id uuid`
* **important columns**:

  * `business_unit_id uuid`
  * `code text`
  * `name text`
  * `is_default boolean`
  * `is_active boolean`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
* **business scope behavior**: 必ず 1 事業に所属する。
* **notes**: `LARK_SUPPORT` と `WATER_SAVING` で別 pipeline を持てる。`unique(business_unit_id, code)` を前提。

### `pipeline_stages`

* **purpose**: パイプライン内の営業ステージ定義。
* **primary keys**: `id uuid`
* **important columns**:

  * `pipeline_id uuid`
  * `stage_key text`
  * `name text`
  * `stage_order integer`
  * `probability_pct numeric(5,2)`
  * `is_closed_won boolean`
  * `is_closed_lost boolean`
  * `sla_days integer null`
* **foreign keys**:

  * `pipeline_id -> pipelines.id`
* **business scope behavior**: `pipeline` を通じて事業スコープが決まる。
* **notes**: ステージ定義はマスタ扱い。変更時は履歴を必要に応じて seed 管理する。

### `deals`

* **purpose**: 商談・案件の現在状態を保持する中核テーブル。
* **primary keys**: `id uuid`
* **important columns**:

  * `business_unit_id uuid`
  * `company_id uuid`
  * `primary_contact_id uuid null`
  * `owner_user_id uuid`
  * `pipeline_id uuid`
  * `current_stage_id uuid`
  * `title text`
  * `deal_status text`
  * `amount numeric(18,2) null`
  * `currency_code text`
  * `expected_close_date date null`
  * `won_at timestamptz null`
  * `lost_at timestamptz null`
  * `loss_reason_code text null`
  * `source_code text null`
  * `deal_attributes jsonb null`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `company_id -> companies.id`
  * `primary_contact_id -> contacts.id`
  * `owner_user_id -> users.id`
  * `pipeline_id -> pipelines.id`
  * `current_stage_id -> pipeline_stages.id`
* **business scope behavior**: 商談は必ず 1 事業に固定され、事後に別事業へ移動しない前提。
* **notes**: `pipeline_id` と `current_stage_id` は同一事業内で整合させる。業界固有の補助項目だけ `deal_attributes` を使う。

### `deal_stage_history`

* **purpose**: 商談ステージ遷移の履歴を保持する。
* **primary keys**: `id uuid`
* **important columns**:

  * `deal_id uuid`
  * `from_stage_id uuid null`
  * `to_stage_id uuid`
  * `changed_by_user_id uuid null`
  * `changed_at timestamptz`
  * `change_note text null`
  * `snapshot_amount numeric(18,2) null`
* **foreign keys**:

  * `deal_id -> deals.id`
  * `from_stage_id -> pipeline_stages.id`
  * `to_stage_id -> pipeline_stages.id`
  * `changed_by_user_id -> users.id`
* **business scope behavior**: `deal` に従属し、事業スコープを継承する。
* **notes**: append-only を原則とし、ダッシュボードの進捗分析の基礎データになる。

### `call_campaigns`

* **purpose**: 架電対象のまとまりや配信単位を表す。
* **primary keys**: `id uuid`
* **important columns**:

  * `business_unit_id uuid`
  * `name text`
  * `status text`
  * `owner_user_id uuid null`
  * `target_source_type text`
  * `criteria_jsonb jsonb null`
  * `started_at timestamptz null`
  * `ended_at timestamptz null`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `owner_user_id -> users.id`
* **business scope behavior**: 必ず 1 事業に所属する。
* **notes**: 手動作成、CSV 取込、条件抽出など複数ソースを扱える。

### `call_targets`

* **purpose**: 実際に架電すべき対象レコード。
* **primary keys**: `id uuid`
* **important columns**:

  * `campaign_id uuid`
  * `business_unit_id uuid`
  * `company_id uuid`
  * `contact_id uuid null`
  * `assigned_user_id uuid null`
  * `phone_number text`
  * `priority integer`
  * `target_status text`
  * `scheduled_at timestamptz null`
  * `last_call_at timestamptz null`
  * `next_callback_at timestamptz null`
  * `target_attributes jsonb null`
* **foreign keys**:

  * `campaign_id -> call_campaigns.id`
  * `business_unit_id -> business_units.id`
  * `company_id -> companies.id`
  * `contact_id -> contacts.id`
  * `assigned_user_id -> users.id`
* **business scope behavior**: 必ず 1 事業に所属する。共有企業を参照していても運用上は事業別。
* **notes**: `business_unit_id` は `campaign` から導出可能だが、検索効率と整合性確認のため冗長保持してよい。

### `call_logs`

* **purpose**: 通話実績を保持する。
* **primary keys**: `id uuid`
* **important columns**:

  * `business_unit_id uuid`
  * `call_target_id uuid null`
  * `company_id uuid`
  * `contact_id uuid null`
  * `deal_id uuid null`
  * `user_id uuid`
  * `provider_call_id text null`
  * `direction text`
  * `started_at timestamptz`
  * `answered_at timestamptz null`
  * `ended_at timestamptz null`
  * `duration_sec integer null`
  * `result_code text`
  * `recording_url text null`
  * `summary text null`
  * `provider_payload jsonb null`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `call_target_id -> call_targets.id`
  * `company_id -> companies.id`
  * `contact_id -> contacts.id`
  * `deal_id -> deals.id`
  * `user_id -> users.id`
* **business scope behavior**: 必ず 1 事業に所属する。
* **notes**: 通話ログ自体を履歴の正本として扱う。件数が増えやすいため月次パーティション候補。

### `tasks`

* **purpose**: フォローアップや次アクションを横断的に管理する。
* **primary keys**: `id uuid`
* **important columns**:

  * `business_unit_id uuid`
  * `company_id uuid null`
  * `contact_id uuid null`
  * `deal_id uuid null`
  * `call_target_id uuid null`
  * `assigned_user_id uuid`
  * `created_by_user_id uuid`
  * `task_type text`
  * `status text`
  * `title text`
  * `description text null`
  * `due_at timestamptz null`
  * `completed_at timestamptz null`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `company_id -> companies.id`
  * `contact_id -> contacts.id`
  * `deal_id -> deals.id`
  * `call_target_id -> call_targets.id`
  * `assigned_user_id -> users.id`
  * `created_by_user_id -> users.id`
* **business scope behavior**: 必ず 1 事業に所属する。
* **notes**: 関連先は複数 nullable FK で表現し、少なくとも 1 つは非 null である制約を置く設計が現実的。

### `dashboard_daily_metrics`

* **purpose**: ダッシュボード用の日次集計結果を保持する read model。
* **primary keys**: `id uuid`
* **important columns**:

  * `metric_date date`
  * `business_unit_id uuid`
  * `module_key text`
  * `metric_key text`
  * `owner_user_id uuid null`
  * `pipeline_id uuid null`
  * `stage_id uuid null`
  * `campaign_id uuid null`
  * `metric_value numeric(18,2)`
  * `dimensions jsonb null`
  * `aggregated_at timestamptz`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `owner_user_id -> users.id`
  * `pipeline_id -> pipelines.id`
  * `stage_id -> pipeline_stages.id`
  * `campaign_id -> call_campaigns.id`
* **business scope behavior**: 事業単位で保持し、全社ビューは集約クエリで実現する。
* **notes**: source of truth ではない。日次確定値と近リアルタイム表示を分けたい場合は materialized view を併用する。

### `audit_logs`

* **purpose**: 主要テーブルの変更証跡を横断的に保持する。
* **primary keys**: `id bigint`
* **important columns**:

  * `table_name text`
  * `record_pk text`
  * `action text`
  * `business_unit_id uuid null`
  * `actor_user_id uuid null`
  * `source_type text`
  * `request_id text null`
  * `before_data jsonb null`
  * `after_data jsonb null`
  * `occurred_at timestamptz`
* **foreign keys**:

  * `business_unit_id -> business_units.id`
  * `actor_user_id -> users.id`
* **business scope behavior**: 共有テーブルと事業別テーブルの両方を対象にするため、`business_unit_id` は nullable。
* **notes**: append-only を原則とする。高ボリューム化しやすいため `bigint` 主キーが向く。

### `external_record_links`

* **purpose**: 内部レコードと Lark Base 等の外部レコード ID を対応付ける。
* **primary keys**: `id uuid`
* **important columns**:

  * `entity_type text`
  * `entity_id uuid`
  * `external_system text`
  * `external_table_key text`
  * `external_record_id text`
  * `sync_direction text`
  * `last_synced_at timestamptz null`
  * `last_sync_hash text null`
* **foreign keys**: 論理上は `entity_id` が各内部エンティティを参照するが、実装上は polymorphic link とする想定。
* **business scope behavior**: 対象エンティティに依存。共有/事業別どちらにも紐づきうる。
* **notes**: 外部 ID を本体テーブルに直接持たせず、この対応表に隔離することで同期仕様変更に強くする。

### `lark_sync_jobs`

* **purpose**: Lark Base との同期ジョブを管理する。
* **primary keys**: `id uuid`
* **important columns**:

  * `job_type text`
  * `direction text`
  * `status text`
  * `entity_type text null`
  * `entity_id uuid null`
  * `payload jsonb null`
  * `error_message text null`
  * `retry_count integer`
  * `run_after timestamptz null`
  * `started_at timestamptz null`
  * `finished_at timestamptz null`
* **foreign keys**: なし
* **business scope behavior**: 対象エンティティに依存。ジョブ自体は横断管理。
* **notes**: 同期失敗を業務データから分離するための制御テーブル。再試行と死活監視の基礎になる。

---

## 6. Business Scope Handling Strategy

* **テーブルを 3 類型に分ける。**

  1. **共有マスタ**

     * `users`
     * `roles`
     * `companies`
     * `contacts`
     * `company_contact_links`

  2. **共有マスタに対する事業別プロファイル**

     * `user_business_memberships`
     * `user_role_assignments`（事業限定付与時）
     * `company_business_profiles`
     * `contact_business_profiles`

  3. **厳格な事業別トランザクション**

     * `pipelines`
     * `pipeline_stages`
     * `deals`
     * `deal_stage_history`
     * `call_campaigns`
     * `call_targets`
     * `call_logs`
     * `tasks`
     * `dashboard_daily_metrics`

* **可視性は shared table ではなく business profile で制御する。**
  たとえば `companies` は全社共有でも、ユーザーが一覧で見える企業は、原則として自分が所属する `business_unit_id` に対する `company_business_profiles` が存在する企業だけにします。

* **商談と架電のスコープは immutable に寄せる。**
  `deals.business_unit_id` と `call_logs.business_unit_id` は、通常運用では作成後に変更しない前提にします。
  別事業へ実質移管したい場合は、原則「旧事業で終了 + 新事業で新規作成」に寄せたほうが履歴が明確です。

* **同一企業・同一担当者に対して別事業で別運用を許可する。**
  1 社の `companies` に対し、

  * `LARK_SUPPORT` 側の `company_business_profiles`
  * `WATER_SAVING` 側の `company_business_profiles`
    を共存させる設計にします。
    商談や通話も事業別に並行存在できます。

* **親子の事業整合性を DB またはアプリで強制する。**
  例として `deals.business_unit_id` と `pipelines.business_unit_id`、`call_logs.business_unit_id` と `call_targets.business_unit_id` は一致させます。
  実装では複合ユニークキー + 複合 FK、または trigger / service 層で担保します。

* **将来の業界別拡張は profile/transaction ごとの専用拡張で吸収する。**
  たとえば将来 `WATER_SAVING` に固有項目が増えた場合、
  `water_saving_company_ext(company_business_profile_id, ...)`
  `water_saving_deal_ext(deal_id, ...)`
  のような専用テーブルを追加し、共通コアは崩さない方針がよいです。

---

## 7. Audit and History Strategy

* **2 層構造にする。**

  * **意味のある業務履歴**: `deal_stage_history`, `call_logs`
  * **横断的な変更証跡**: `audit_logs`

* **可変テーブルには標準監査列を持たせる。**
  少なくとも `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id` を採用します。
  ユーザーが削除したいデータは、原則 `deleted_at` によるソフトデリートにします。

* **履歴は append-only を基本にする。**
  `deal_stage_history` は更新・削除せず、遷移イベントを積み上げます。
  `call_logs` も通話結果の正本として追記型にします。

* **監査ログには before/after を持たせる。**
  `audit_logs` の `before_data`, `after_data` により、誰が何をどう変えたかを復元可能にします。

* **API リクエストや同期処理と紐づける。**
  `request_id` と `source_type` を持たせて、

  * 画面操作
  * バッチ更新
  * Lark 同期
    を区別できるようにします。

* **統合・マージも監査対象にする。**
  `companies.merged_into_company_id` のような統合操作は監査ログへ必ず出し、後から統合経緯を追えるようにします。

* **保持期間は履歴の種類で分ける。**

  * 業務履歴: 原則長期保持
  * 監査ログ: コンプライアンス要件に応じてアーカイブ
  * 生の外部連携ペイロード: 必要最低限のみ保持

---

## 8. Dashboard Aggregation Strategy

* **トランザクション DB を正本、ダッシュボードを read model にする。**
  `dashboard_daily_metrics` は業務更新先ではなく、`deals`, `deal_stage_history`, `call_logs`, `tasks`, `company_business_profiles` 等から生成します。

* **指標を 2 種類に分けて集計する。**

  1. **イベント系メトリクス**

     * 当日架電件数
     * 接続件数
     * アポ獲得件数
     * 商談作成件数
     * ステージ遷移件数

  2. **スナップショット系メトリクス**

     * 当日時点の進行中案件数
     * ステージ別パイプライン金額
     * 担当者別保有案件数
     * 事業別アクティブ顧客数

* **日次確定と近リアルタイムを分ける。**
  正式レポートは `dashboard_daily_metrics` に日次バッチで確定させ、
  当日進捗は materialized view か集約 SQL で補完するのが現実的です。

* **集計粒度を固定しすぎない。**
  最低でも以下の粒度を持てるようにします。

  * `metric_date`
  * `business_unit_id`
  * `module_key`
  * `metric_key`
  * 任意の次元（担当者、ステージ、キャンペーン等）

* **共通でよく使う次元は列で持つ。**
  `owner_user_id`, `pipeline_id`, `stage_id`, `campaign_id` は列で持ち、追加的な軽微次元だけ `dimensions jsonb` に寄せるのがよいです。

* **ダッシュボードの計算責務を業務画面から分離する。**
  画面ごとに生 SQL を乱立させず、集計ジョブまたは集約ビューで責務を一本化します。

---

## 9. Lark Integration Boundary

* **認証は Lark OAuth のみ。**
  `users` の正本となる ID は Lark の識別子で、ローカル認証は持ちません。

* **業務データの正本は PostgreSQL。**
  `companies`, `contacts`, `deals`, `call_logs` などの業務エンティティは PostgreSQL を source of truth とし、Lark Base は補助的な同期先に留めます。

* **Lark Base との接続は `external_record_links` と `lark_sync_jobs` に隔離する。**
  本体テーブルに Lark 固有の結合ロジックを直接埋め込まず、外部対応表と同期ジョブで境界を明確にします。

* **同期対象は絞る。**

  * `users`: Lark から取り込む
  * `companies`, `contacts`, `deals`: 要約情報の同期候補
  * `call_logs`: すべてを同期せず、必要なサマリのみを同期候補にする

* **双方向同期は allowlist 前提にする。**
  すべての列を双方向同期するのではなく、同期可能列を明示的に限定します。
  競合時は PostgreSQL 優先に寄せる方が事故が少ないです。

* **Lark Base をワークフローエンジンにしない。**
  承認、権限制御、営業進行の正規ルールは G-DX 本体で持ち、Lark Base は入力補助・閲覧補助・外部共有に留めます。

---

## 10. Recommended First Migration Order

1. **PostgreSQL 基盤拡張を有効化する。**
   `pgcrypto` または UUID 生成手段、`citext` を先に有効化する。

2. **`business_units`, `roles` を作成して seed を投入する。**
   事業軸とロール定義を最初に固定する。

3. **`users`, `user_business_memberships`, `user_role_assignments` を作成する。**
   Lark OAuth 後の受け皿と事業所属・権限付与を先に作る。

4. **共有顧客コア `companies`, `contacts`, `company_contact_links` を作成する。**
   全モジュールの参照基盤になるため早めに確定する。

5. **`company_business_profiles`, `contact_business_profiles` を作成する。**
   共有マスタに事業運用の意味を与える。

6. **`pipelines`, `pipeline_stages` を作成する。**
   商談の進行定義を先に作る。

7. **`deals`, `deal_stage_history` を作成する。**
   sales_management の中核を構築する。

8. **`call_campaigns`, `call_targets`, `call_logs` を作成する。**
   call_system を独立した事業別トランザクションとして構築する。

9. **`tasks`, `audit_logs` を作成する。**
   運用アクションと監査証跡を加えて、実務利用に耐える形にする。

10. **`external_record_links`, `lark_sync_jobs`, `dashboard_daily_metrics` を作成する。**
    外部同期とダッシュボード read model は、コア業務データ確定後に載せる。
