# G-DX 実行ランブック

## 先に固定する前提

- プロジェクト種別: G-DXの大型リニューアル / 実質フルスクラッチ
- 会社: 株式会社グラスト
- サービス名: G-DX
- 事業: `LARK_SUPPORT`, `WATER_SAVING`
- 主機能: 営業管理 / 顧客管理 / 架電システム / ダッシュボード
- ログイン: Lark OAuthのみ
- UIルール: `g-dx-design-system` に準拠
- 重要な上書き: `g-dx-lark-integration` の「Lark Base を唯一のデータソースにする」は今回採用しない
- 主DB: PostgreSQL
- Lark Baseの役割: 一部マスタ、補助運用、同期先、連携先
- 権限: アカウントごとに `LARK_SUPPORTのみ`, `WATER_SAVINGのみ`, `両方` を持てる
- 顧客方針: 1法人1レコードを基本とし、事業との関係は別管理
- 案件/架電/受注方針: 事業スコープを必須で持つ
- 技術基盤: Next.js App Router / TypeScript / Tailwind CSS / Noto Sans JP / PostgreSQL / Redis / Worker
- 実装前提: AI駆動で進めるが、1回の依頼で1成果物に限定する

---

## いまのあなたの仕事

あなたはいまコードを書く人ではなく、AIが迷わず実装できるように仕様を固定する人です。

やる順番はこれです。

1. `docs/` を作る
2. 下のPromptを**1つずつ**AIに投げる
3. AIの返答を `docs/*.md` に保存する
4. 保存した仕様を前提に、次のPromptを投げる
5. 仕様が揃ってから、初めて実装AIにコードを書かせる

---

## やってはいけないこと

- いきなり「CRM全部作って」と投げる
- UIから作り始める
- Lark Baseのテーブル設計から始める
- 権限未定のままAPIや画面を作る
- 1回のAI依頼で、設計・画面・API・実装を全部やらせる

---

## 実行順

### Step 1: 基盤方針を固定する
保存先: `docs/00-foundation.md`

```md
# ROLE
You are a principal product architect and enterprise SaaS tech lead.

# TASK
Create the foundation specification for a full rewrite of an internal business platform called G-DX.

# PROJECT_CONTEXT
company_name: 株式会社グラスト
product_name: G-DX
project_type: full rewrite
business_axes:
  - code: LARK_SUPPORT
    label: Lark導入支援
  - code: WATER_SAVING
    label: 節水器具販売
modules:
  - sales_management
  - customer_management
  - call_system
  - dashboard
login_method:
  - Lark OAuth only
ui_design_system:
  - Next.js App Router
  - React
  - Tailwind CSS
  - Noto Sans JP
  - professional non-AI-looking UI
system_goals:
  - improve operational efficiency
  - support business-based access control
  - support future verticalized G-DX variants

# HARD_CONSTRAINTS
- Keep Lark OAuth as the only login method.
- Do not use Lark Base as the primary system of record.
- Use PostgreSQL as the primary database.
- Treat Lark Base as optional integration/sync/auxiliary storage only.
- The system must support business scope visibility per account:
  - only LARK_SUPPORT
  - only WATER_SAVING
  - both
- Accounts/companies should be shared when appropriate.
- Deals/calls/contracts must carry business scope.
- Do not design a generic low-code platform.
- Prefer a practical enterprise web application architecture.

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Executive Summary
2. System Scope
3. Non-Goals
4. Architectural Principles
5. Business Scope Model
6. Authority Model Overview
7. Data Ownership Policy
8. Module Boundaries
9. Technical Architecture
10. Risks and Anti-Patterns
11. Final Recommended Baseline

# QUALITY_BAR
- Be concrete.
- Avoid abstract consulting language.
- Write for implementation handoff.
- Make decisions when ambiguity exists.
```

### Step 2: 権限表を作る
保存先: `docs/01-permission-matrix.md`

```md
# ROLE
You are a senior system analyst specializing in RBAC and internal business systems.

# TASK
Design the permission matrix for G-DX.

# CONTEXT
G-DX is an internal business platform for two business axes:
- LARK_SUPPORT
- WATER_SAVING

The platform includes:
- sales_management
- customer_management
- call_system
- dashboard

Authentication is Lark OAuth only.
Primary database is PostgreSQL.
Business scope must be assignable per account:
- only LARK_SUPPORT
- only WATER_SAVING
- both

# REQUIRED_DESIGN_DIRECTION
- Use RBAC + business scope constraints.
- Separate role from business visibility.
- Assume customer records can be shared across businesses.
- Assume deals/calls/contracts are business-scoped.
- Include field-level and action-level considerations where relevant.

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Permission Design Principles
2. Roles Definition
3. Business Scope Rules
4. Permission Matrix Table
5. Record Visibility Rules
6. Create/Update/Delete Rules
7. Export/Import Rules
8. Dashboard Visibility Rules
9. Edge Cases
10. Recommended Final Permission Policy

# EXTRA_REQUIREMENT
The matrix must be implementation-ready, not conceptual only.
```

### Step 3: データ設計を作る
保存先: `docs/02-domain-model.md`

```md
# ROLE
You are a principal domain architect for CRM and sales operations systems.

# TASK
Design the domain model and logical database schema for G-DX.

# CONTEXT
Product: G-DX
Businesses:
- LARK_SUPPORT
- WATER_SAVING
Modules:
- sales_management
- customer_management
- call_system
- dashboard

Authentication: Lark OAuth only
Primary DB: PostgreSQL
Lark Base: integration/sync only

# REQUIRED_DECISIONS
- Use shared accounts/companies when appropriate.
- Deals are business-scoped.
- Calls are business-scoped.
- Users can belong to one or both business scopes.
- The design must support future industry-specific variants without becoming a full metadata platform.

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Domain Modeling Principles
2. Core Entities
3. Entity Relationship Overview
4. Table List
5. Table-by-Table Schema Draft
6. Business Scope Handling Strategy
7. Audit and History Strategy
8. Dashboard Aggregation Strategy
9. Lark Integration Boundary
10. Recommended First Migration Order

# IMPORTANT
For each major table, include:
- purpose
- primary keys
- important columns
- foreign keys
- business scope behavior
- notes
```

### Step 4: 画面一覧と業務フローを作る
保存先: `docs/03-screens-and-flows.md`

```md
# ROLE
You are a senior product designer for enterprise operations systems.

# TASK
Design the screen inventory and primary user flows for G-DX.

# CONTEXT
G-DX modules:
- sales_management
- customer_management
- call_system
- dashboard

Businesses:
- LARK_SUPPORT
- WATER_SAVING

Authentication:
- Lark OAuth only

UI constraints:
- Next.js App Router
- Tailwind CSS
- Noto Sans JP
- professional non-AI-looking interface
- practical enterprise UX

Data model assumptions:
- accounts/companies can be shared
- deals/calls/contracts are business-scoped
- permissions are controlled by role + business scope

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Screen Design Principles
2. Navigation Structure
3. Screen Inventory Table
4. Core User Flows
5. Screen-Level Permission Notes
6. Business Switching Behavior
7. Empty/Error/Loading UX Rules
8. Recommended MVP Screen Order

# IMPORTANT
The output must be implementation-oriented.
Every screen should include:
- purpose
- primary user
- key actions
- required data
- permission considerations
```

### Step 5: API仕様を作る
保存先: `docs/04-api-contracts.md`

```md
# ROLE
You are a backend API architect for an internal enterprise platform.

# TASK
Create the initial API contract specification for G-DX.

# CONTEXT
Primary DB: PostgreSQL
Authentication: Lark OAuth only
Architecture: Next.js application + server-side API layer + worker processes
Businesses:
- LARK_SUPPORT
- WATER_SAVING
Modules:
- sales_management
- customer_management
- call_system
- dashboard

Permissions:
- role-based access control
- business scope constraints

# API_STYLE
- REST-first
- JSON request/response
- practical for Next.js route handlers or BFF
- avoid overengineering

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. API Design Principles
2. Authentication and Session Endpoints
3. User and Permission Endpoints
4. Accounts and Contacts Endpoints
5. Deals and Pipeline Endpoints
6. Call System Endpoints
7. Dashboard Endpoints
8. Lark Sync Endpoints
9. Error Handling Policy
10. Recommended API Build Order

# IMPORTANT
For every major endpoint group, include:
- method
- path
- purpose
- request shape
- response shape
- permission notes
```

### Step 6: 実装用のリポジトリ構成を作る
保存先: `docs/05-repo-plan.md`

```md
# ROLE
You are a staff engineer preparing an implementation-ready repository plan.

# TASK
Create the repository structure and implementation sequence for G-DX.

# CONTEXT
Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Redis
- worker processes
- Lark OAuth

Project type:
- full rewrite
- enterprise internal system
- AI-assisted implementation

# REQUIRED_DIRECTION
- optimize for maintainability
- optimize for AI-assisted coding
- separate domain, application, infrastructure, and UI concerns enough to reduce chaos
- do not create an unnecessarily complex microservices architecture

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Repository Design Principles
2. Recommended Folder Structure
3. Environment Strategy
4. Config and Secret Strategy
5. Testing Strategy
6. Migration Strategy
7. Worker Job Structure
8. CI/CD Baseline
9. Recommended Implementation Sequence
10. First Vertical Slice Recommendation
```

### Step 7: 最初の実装チケットを作る
保存先: `docs/06-first-sprint.md`

```md
# ROLE
You are an engineering manager creating implementation tickets for an AI-assisted delivery team.

# TASK
Break the initial G-DX build into small implementation tickets.

# CONTEXT
The following documents already exist and must be treated as the source of truth:
- docs/00-foundation.md
- docs/01-permission-matrix.md
- docs/02-domain-model.md
- docs/03-screens-and-flows.md
- docs/04-api-contracts.md
- docs/05-repo-plan.md

# REQUIRED_DIRECTION
- tickets must be small enough for AI coding tools
- each ticket must have a clear definition of done
- avoid giant cross-cutting tickets
- build from login -> permission -> core data -> basic screens -> dashboards -> lark sync

# OUTPUT_REQUIREMENTS
Return markdown only.
Use exactly these sections:
1. Ticketing Principles
2. Phase Breakdown
3. Ticket List
4. Ticket Dependencies
5. Recommended Execution Order
6. First Ticket to Start With

# IMPORTANT
For each ticket include:
- ticket_id
- title
- goal
- scope
- out_of_scope
- files_likely_to_change
- dependencies
- definition_of_done
```

---

## ここまで終わったら次にやること

次は実装AIに、**1チケットずつ**投げます。

最初の実装依頼は「Larkログイン」ではなく、実際には以下の順でよいです。

1. プロジェクト初期化
2. デザインシステム反映
3. Lark OAuthログイン土台
4. ユーザー/権限モデル
5. アカウント一覧
6. 顧客詳細
7. 案件一覧
8. 架電一覧
9. ダッシュボード最小版
10. Lark同期

---

## 実装AIに渡す共通ヘッダ

実装チケットごとに、毎回この共通ヘッダを先頭に付ける。

```md
# ROLE
You are a senior full-stack engineer implementing one isolated ticket in an enterprise Next.js application.

# GLOBAL_RULES
- Follow the G-DX design system.
- Use Next.js App Router + TypeScript + Tailwind CSS + Noto Sans JP.
- Keep the UI professional and not AI-looking.
- Do not introduce gradient, pastel colors, pill badges, oversized radius, or flashy animation.
- Use PostgreSQL as the primary database.
- Treat Lark Base as integration only, not the source of truth.
- Respect role-based access control and business scope constraints.
- Keep changes minimal and scoped to the ticket.
- Do not rewrite unrelated files.
- If a needed assumption is missing, choose the most practical enterprise-safe default and state it explicitly.

# REQUIRED_OUTPUT
Return in this order:
1. Assumptions
2. Files to create or change
3. Implementation plan
4. Code
5. Migration changes if any
6. Manual verification steps
```

---

## あなたが毎回見るべき確認ポイント

- 権限が `LARK_SUPPORT / WATER_SAVING / BOTH` を壊していないか
- 顧客共有と案件事業別の考え方が崩れていないか
- UIがG-DXデザインルールを破っていないか
- Lark Baseを主DB扱いしていないか
- 1回の実装範囲が広がりすぎていないか

