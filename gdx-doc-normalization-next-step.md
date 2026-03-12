# G-DX 設計書 正規化プロンプト

以下をそのまま AI に投入してください。

```md
# ROLE
You are a principal software architect and documentation refactoring assistant.

# TASK
Normalize the uploaded G-DX design docs so terminology, routes, roles, permissions, repository paths, and implementation tickets are internally consistent and safe for AI-assisted implementation.

# SOURCE OF TRUTH
Use these as the baseline and preserve their intent:
- docs/00-foundation.md
- docs/01-permission-matrix.md
- docs/02-domain-model.md
- docs/03-screens-and-flows.md
- docs/04-api-contracts.md
- docs/05-repo-plan.md
- docs/06-first-sprint.md

# CANONICAL DECISIONS
1. Shared CRM core entities are exactly:
   - `companies`
   - `contacts`
   Do not use `accounts` as a technical entity, DB table, API resource, route, folder, or ticket name.

2. If the business side wants to display the Japanese word "アカウント", it may only be a UI label alias for `company`.
   Technical names must remain `companies` and `contacts`.

3. Standard roles are exactly:
   - `SUPER_ADMIN`
   - `ADMIN`
   - `MANAGER`
   - `OPERATOR`
   - `VIEWER`
   Do not use `SALES`, `BUSINESS_ADMIN`, or any other runtime role names unless explicitly defined as a non-core alias, and avoid aliases in API examples.

4. Permission keys must follow the granular model from docs/01.
   Use keys like:
   - `customer.company.read`
   - `customer.company.create`
   - `customer.company.update`
   - `customer.contact.read`
   - `customer.contact.create`
   - `customer.contact.update`
   - `sales.deal.read`
   - `sales.deal.create`
   - `sales.deal.update_basic`
   - `sales.deal.update_critical`
   - `call.log.read`
   - `call.log.create`
   - `call.log.update`
   - `dashboard.kpi.read`
   - `dashboard.team.read`
   - `dashboard.business.read`
   - `auth.user.manage`
   - `integration.sync.manage`
   - `audit.read`

5. Route convention must be exactly:
   - `/login`
   - `/auth/callback`
   - `/unauthorized`
   - `/dashboard`
   - `/dashboard/sales`
   - `/dashboard/calls`
   - `/customers/companies`
   - `/customers/companies/new`
   - `/customers/companies/[companyId]`
   - `/customers/contacts`
   - `/customers/contacts/new`
   - `/customers/contacts/[contactId]`
   - `/sales/deals`
   - `/sales/deals/new`
   - `/sales/deals/[dealId]`
   - `/sales/contracts`
   - `/sales/contracts/[contractId]`
   - `/calls/queue`
   - `/calls/workspace/[targetId]`
   - `/calls/history`
   - `/calls/[callId]`

6. Repository and app folder convention must align with the route convention and monorepo layout.
   Use these technical paths consistently:
   - `apps/web/src/app/(protected)/dashboard/**`
   - `apps/web/src/app/(protected)/customers/companies/**`
   - `apps/web/src/app/(protected)/customers/contacts/**`
   - `apps/web/src/app/(protected)/sales/deals/**`
   - `apps/web/src/app/(protected)/sales/contracts/**`
   - `apps/web/src/app/(protected)/calls/**`
   - `apps/web/src/app/api/v1/**`
   - `apps/web/src/modules/customer-management/company/**`
   - `apps/web/src/modules/customer-management/contact/**`
   - `apps/web/src/modules/sales-management/deal/**`
   - `apps/web/src/modules/sales-management/contract/**`
   - `apps/web/src/modules/call-system/**`
   - `apps/web/src/modules/dashboard/**`

7. Domain model intent from docs/02 is the source of truth for shared master vs business-scoped data:
   - shared master: `companies`, `contacts`
   - business-scoped transactions: `deals`, `call_logs`, `contracts`, `tasks`, dashboard metrics
   - Lark Base is not the source of truth

8. Role assignment model must be consistent with API examples.
   If multiple role assignments are supported in the domain model, API/session examples must not imply a single mandatory `role` string unless explicitly named `primaryRole` or `effectiveRole`.

# REQUIRED FIXES
Apply these fixes across the docs:
- Remove technical use of `accounts` where it conflicts with `companies` and `contacts`.
- Normalize route examples, file paths, and ticket file targets.
- Normalize role names to the standard 5-role model.
- Normalize permission references to granular permission keys.
- Make API examples consistent with the domain model and permission model.
- Keep the existing architecture direction, business-scope behavior, and implementation order intact.

# FILES TO PATCH
Patch these files in place:
- docs/03-screens-and-flows.md
- docs/04-api-contracts.md
- docs/05-repo-plan.md
- docs/06-first-sprint.md
- docs/00-foundation.md only if needed for terminology consistency

# OUTPUT REQUIREMENTS
Return revised markdown for each changed file separately in this order:
1. docs/03-screens-and-flows.md
2. docs/04-api-contracts.md
3. docs/05-repo-plan.md
4. docs/06-first-sprint.md
5. docs/00-foundation.md only if changed

# IMPORTANT
- Preserve the original section structure of each file.
- Do not add new product scope.
- Do not introduce a metadata platform.
- Optimize for AI-assisted implementation with unambiguous technical naming.
- Keep the response in markdown only.
```

## 正規化後の確認ポイント

- `accounts` が技術用語として残っていないか
- role が `SUPER_ADMIN / ADMIN / MANAGER / OPERATOR / VIEWER` に統一されているか
- route と repo path と ticket path が一致しているか
- permission 表現が granular key に寄っているか
- 共有マスタと事業別トランザクションの分離が崩れていないか
