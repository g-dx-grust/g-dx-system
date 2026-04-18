## 1. Ticketing Principles

* Use the existing design docs as the source of truth. If code decisions conflict with `docs/00` to `docs/05`, the docs win.
* Keep one ticket focused on one primary concern only: auth, permission, schema, API slice, or screen slice.
* Prefer vertical progression over broad platform work: authenticate first, then authorize, then persist core data, then expose APIs, then build screens.
* Enforce permission and business-scope rules on the server before wiring UI behavior.
* Treat companies/contacts as shared entities and deals/calls as business-scoped entities in every ticket that touches data access.
* Avoid hidden cross-cutting work. A screen ticket should consume existing APIs; a schema ticket should not also introduce UI.
* Each ticket should be small enough for one AI coding task or one narrowly scoped PR.
* Standard done criteria apply to every ticket: typecheck passes, lint passes, tests for the changed behavior exist, and empty/error states are handled.

## 2. Phase Breakdown

### Phase 0 — Access and App Context

Goal: a user can sign in with Lark, get a valid session, resolve role + business scope, and land inside a protected app shell.

Tickets: `GDX-001` to `GDX-006`

### Phase 1 — Shared CRM Foundation

Goal: shared customer data is persisted, exposed via API, and manageable from basic screens.

Tickets: `GDX-007` to `GDX-010`

### Phase 2 — Sales Management Vertical Slice

Goal: business-scoped deals and pipeline workflows are usable end-to-end.

Tickets: `GDX-011` to `GDX-014`

### Phase 3 — Call System Vertical Slice

Goal: business-scoped call work can be queued, logged, and reviewed.

Tickets: `GDX-015` to `GDX-017`

### Phase 4 — Dashboard Vertical Slice

Goal: dashboards show reliable KPIs derived from the implemented sales and call flows.

Tickets: `GDX-018` to `GDX-019`

### Phase 5 — Lark Sync Foundation

Goal: Lark integration is added after the core product works locally without it.

Tickets: `GDX-020` to `GDX-021`

## 3. Ticket List

### GDX-001

* ticket_id: GDX-001
* title: Configure Lark OAuth and auth environment validation
* goal: Make the app capable of initiating Lark OAuth safely in local and deployed environments.
* scope:

  * Add required auth environment variables and validation.
  * Create Lark OAuth client helper.
  * Add auth start route and callback route skeleton.
  * Add provider-level error handling for bad configuration.
* out_of_scope:

  * Session persistence.
  * User bootstrap.
  * Permission evaluation.
* files_likely_to_change:

  * `.env.example`
  * `src/lib/env/**`
  * `src/server/auth/**`
  * `src/app/api/auth/lark/**`
* dependencies: []
* definition_of_done:

  * Missing or invalid auth env values fail fast with actionable errors.
  * OAuth start route builds a correct redirect URL.
  * Callback route can parse provider responses and surface controlled failures.
  * Basic auth configuration tests pass.

### GDX-002

* ticket_id: GDX-002
* title: Add identity and RBAC schema migrations
* goal: Create the minimum database foundation for users, roles, permissions, and business memberships.
* scope:

  * Add migrations for users.
  * Add migrations for roles, permissions, and role-permission joins.
  * Add migrations for user-business membership and related enums.
  * Add any auth persistence tables required by the chosen session strategy.
* out_of_scope:

  * Companies and contacts.
  * Deals and pipeline.
  * Calls and dashboard aggregates.
* files_likely_to_change:

  * `db/migrations/**`
  * `src/server/db/schema/**`
  * `src/server/auth/types/**`
  * `src/server/permissions/types/**`
* dependencies: []
* definition_of_done:

  * Migrations apply and rollback cleanly.
  * Tables match the permission and business-scope design.
  * User-to-role and user-to-business relationships are queryable.
  * Schema smoke tests pass.

### GDX-003

* ticket_id: GDX-003
* title: Complete login, callback, and session flow
* goal: Let users sign in through Lark and access protected routes with a valid session.
* scope:

  * Exchange callback data for authenticated session state.
  * Implement login redirect and logout.
  * Add protected-route redirect behavior.
  * Add basic auth failure UX.
* out_of_scope:

  * User bootstrap in local tables.
  * Permission-based module access.
  * Business switching.
* files_likely_to_change:

  * `src/server/auth/**`
  * `src/app/api/auth/**`
  * `src/app/(auth)/**`
  * `middleware.ts`
* dependencies:

  * GDX-001
  * GDX-002
* definition_of_done:

  * Successful login lands on a protected in-app route.
  * Unauthenticated users are redirected to login.
  * Logout fully clears the session.
  * Auth smoke test covers success and failure paths.

### GDX-004

* ticket_id: GDX-004
* title: Seed RBAC master data and bootstrap user profile on login
* goal: Ensure first login creates or updates a local user and resolves initial role/business assignments.
* scope:

  * Add idempotent seed for roles and permissions.
  * Upsert local user record after login.
  * Load and attach business memberships.
  * Store last-login metadata.
* out_of_scope:

  * Route-level authorization.
  * Screen-level permission behavior.
  * Business switcher UI.
* files_likely_to_change:

  * `scripts/seed-rbac/**`
  * `src/server/users/**`
  * `src/server/auth/**`
  * `src/server/permissions/**`
* dependencies:

  * GDX-002
  * GDX-003
* definition_of_done:

  * RBAC seed can run repeatedly without duplication.
  * First login creates a local user and memberships.
  * Subsequent logins update last-login metadata.
  * Bootstrap tests cover single-business and dual-business users.

### GDX-005

* ticket_id: GDX-005
* title: Implement authorization utilities and route guards
* goal: Centralize permission checks for shared and business-scoped resources.
* scope:

  * Add `requireAuth` and `requirePermission` helpers.
  * Add business-scope resolver for business-scoped records.
  * Add field editability helper for screen/API use.
  * Add consistent API error wrapper for 401/403 responses.
* out_of_scope:

  * Module screens.
  * App shell navigation.
  * Resource-specific CRUD logic.
* files_likely_to_change:

  * `src/server/auth/**`
  * `src/server/permissions/**`
  * `src/server/api/**`
  * `middleware.ts`
* dependencies:

  * GDX-004
* definition_of_done:

  * Server handlers can enforce read/write permissions consistently.
  * Shared vs business-scoped access checks are separated correctly.
  * Unauthorized access returns stable 401/403 envelopes.
  * Permission tests cover dual-business edge cases.

### GDX-006

* ticket_id: GDX-006
* title: Build the protected app shell and business switcher
* goal: Give authenticated users a stable post-login shell with module navigation and active business context.
* scope:

  * Add app layout, sidebar/topbar, and module navigation.
  * Add active business switcher for dual-business users.
  * Hide unauthorized modules from navigation.
  * Persist active business context for child pages.
* out_of_scope:

  * Customer, sales, call, or dashboard screens.
  * Deep module-specific filters.
  * Lark integration screens.
* files_likely_to_change:

  * `src/app/(app)/**`
  * `src/components/layout/**`
  * `src/components/business-switcher/**`
  * `src/lib/business-context/**`
* dependencies:

  * GDX-005
* definition_of_done:

  * Single-business users see a fixed business context.
  * Dual-business users can switch between `LARK_SUPPORT` and `WATER_SAVING`.
  * Navigation only shows allowed modules.
  * Active business context is available to descendant routes.

### GDX-007

* ticket_id: GDX-007
* title: Add shared CRM schema for companies and contacts
* goal: Create the shared data model used by both businesses.
* scope:

  * Add migrations for companies and contacts.
  * Add relation tables needed for shared CRM ownership/association.
  * Add audit columns and soft-delete strategy fields if defined in the domain model.
  * Add repository/model scaffolding for shared CRM access.
* out_of_scope:

  * Deals and pipeline tables.
  * Calls and call results.
  * Sync jobs.
* files_likely_to_change:

  * `db/migrations/**`
  * `src/server/db/schema/**`
  * `src/server/customer-management/**`
* dependencies:

  * GDX-002
* definition_of_done:

  * Shared CRM schema applies cleanly.
  * Companies and contacts can be queried without business duplication.
  * Audit fields align with the domain model.
  * Repository smoke tests pass.

### GDX-008

* ticket_id: GDX-008
* title: Implement companies and contacts read APIs
* goal: Expose shared CRM records for list, search, and detail views.
* scope:

  * Add list and detail endpoints for companies.
  * Add list and detail endpoints for contacts.
  * Add search, pagination, and basic filter support.
  * Enforce permission checks in handlers.
* out_of_scope:

  * Create/update endpoints.
  * Import/export.
  * Lark sync.
* files_likely_to_change:

  * `src/app/api/companies/**`
  * `src/app/api/contacts/**`
  * `src/server/customer-management/**`
  * `src/server/api/**`
* dependencies:

  * GDX-005
  * GDX-007
* definition_of_done:

  * List and detail endpoints return stable JSON envelopes.
  * Search and pagination work for shared CRM data.
  * Unauthorized users cannot read records they should not access.
  * Empty results and missing-record cases are handled cleanly.

### GDX-009

* ticket_id: GDX-009
* title: Implement companies and contacts write APIs
* goal: Allow authorized users to create and update shared CRM records.
* scope:

  * Add create and update endpoints for companies.
  * Add create and update endpoints for contacts.
  * Add request validation and standardized error responses.
  * Add audit metadata updates on write.
* out_of_scope:

  * Bulk import.
  * Merge/deduplication workflows.
  * Destructive hard delete flows.
* files_likely_to_change:

  * `src/app/api/companies/**`
  * `src/app/api/contacts/**`
  * `src/server/customer-management/**`
  * `src/server/api/**`
* dependencies:

  * GDX-005
  * GDX-007
* definition_of_done:

  * Authorized users can create and update shared CRM records.
  * Validation failures return predictable error payloads.
  * Audit fields update correctly.
  * Write-path tests cover allowed and forbidden cases.

### GDX-010

* ticket_id: GDX-010
* title: Build companies and contacts basic screens
* goal: Deliver the first usable customer management UI slice.
* scope:

  * Add companies list and detail screens.
  * Add contacts list and detail screens.
  * Add basic create/edit forms.
  * Wire screens to existing read/write APIs.
* out_of_scope:

  * Bulk upload.
  * Advanced deduplication UI.
  * Deep related widgets from other modules.
* files_likely_to_change:

  * `src/app/(app)/customer-management/**`
  * `src/modules/customer-management/**`
  * `src/components/forms/**`
* dependencies:

  * GDX-006
  * GDX-008
  * GDX-009
* definition_of_done:

  * Users can list, search, open, create, and edit companies/contacts.
  * Empty, loading, and error states are visible and usable.
  * Form behavior respects field editability rules.
  * Basic UI smoke tests pass.

### GDX-011

* ticket_id: GDX-011
* title: Add sales schema for deals and pipeline history
* goal: Create the business-scoped sales data model required for the MVP pipeline.
* scope:

  * Add migrations for deals.
  * Add migrations for pipeline stages and stage history.
  * Add relations from deals to shared companies/contacts where defined.
  * Add repository/model scaffolding for sales access.
* out_of_scope:

  * Contract lifecycle.
  * Quotation flows.
  * Dashboard aggregates.
* files_likely_to_change:

  * `db/migrations/**`
  * `src/server/db/schema/**`
  * `src/server/sales-management/**`
* dependencies:

  * GDX-007
* definition_of_done:

  * Sales schema applies and rolls back cleanly.
  * Deals are business-scoped by design.
  * Stage history is queryable for auditability.
  * Repository smoke tests pass.

### GDX-012

* ticket_id: GDX-012
* title: Implement deals and pipeline read APIs
* goal: Expose business-scoped deal and pipeline data to the UI.
* scope:

  * Add deal list and detail endpoints.
  * Add pipeline-lane read endpoint.
  * Add filters for active business, stage, and owner.
  * Enforce business-scope and permission checks.
* out_of_scope:

  * Deal creation and editing.
  * Stage movement.
  * Sales analytics.
* files_likely_to_change:

  * `src/app/api/deals/**`
  * `src/server/sales-management/**`
  * `src/server/api/**`
* dependencies:

  * GDX-005
  * GDX-011
* definition_of_done:

  * APIs only return deals for the active business context.
  * Users can fetch deal list, detail, and pipeline lane data.
  * Unauthorized business access is blocked.
  * Empty lane and missing-deal cases are handled.

### GDX-013

* ticket_id: GDX-013
* title: Implement deal write and stage transition APIs
* goal: Allow authorized users to create deals, edit them, and move them through the pipeline.
* scope:

  * Add create and update endpoints for deals.
  * Add stage transition endpoint.
  * Add close-won/close-lost update handling.
  * Persist stage history on transitions.
* out_of_scope:

  * Contract generation.
  * Approval workflows.
  * Bulk stage operations.
* files_likely_to_change:

  * `src/app/api/deals/**`
  * `src/server/sales-management/**`
  * `src/server/api/**`
* dependencies:

  * GDX-005
  * GDX-011
* definition_of_done:

  * Authorized users can create and update deals in one business scope.
  * Stage changes write audit history.
  * Invalid transitions return controlled validation errors.
  * Write-path tests cover allowed and forbidden cases.

### GDX-014

* ticket_id: GDX-014
* title: Build pipeline and deal detail screens
* goal: Deliver the first usable sales management UI slice.
* scope:

  * Add pipeline screen.
  * Add deal detail screen.
  * Add create/edit deal form.
  * Add basic stage change UI using existing APIs.
* out_of_scope:

  * Advanced drag-and-drop polish.
  * Forecasting views.
  * Contract management UI.
* files_likely_to_change:

  * `src/app/(app)/sales-management/**`
  * `src/modules/sales-management/**`
  * `src/components/forms/**`
* dependencies:

  * GDX-006
  * GDX-012
  * GDX-013
* definition_of_done:

  * Users can view pipeline data for the selected business.
  * Users can open, create, edit, and stage-change deals.
  * Loading and empty lanes are handled cleanly.
  * UI respects permission and business-scope rules.

### GDX-015

* ticket_id: GDX-015
* title: Add call system schema
* goal: Create the business-scoped data model for call work and call results.
* scope:

  * Add migrations for call queue items or call work items.
  * Add migrations for call logs/results.
  * Add relations to shared contacts/companies where needed.
  * Add repository/model scaffolding for call-system access.
* out_of_scope:

  * Telephony provider integration.
  * Recordings.
  * Auto-dialer behavior.
* files_likely_to_change:

  * `db/migrations/**`
  * `src/server/db/schema/**`
  * `src/server/call-system/**`
* dependencies:

  * GDX-007
* definition_of_done:

  * Call schema applies cleanly.
  * Call records are business-scoped.
  * Result/status fields align with the domain model.
  * Repository smoke tests pass.

### GDX-016

* ticket_id: GDX-016
* title: Implement call queue and call result APIs
* goal: Expose the minimum API slice required to work calls and save outcomes.
* scope:

  * Add next-call or queue read endpoint.
  * Add call start/end or status update endpoints.
  * Add result/note save endpoint.
  * Add recent call history endpoint.
* out_of_scope:

  * VOIP integration.
  * Call recordings.
  * Campaign optimization logic.
* files_likely_to_change:

  * `src/app/api/calls/**`
  * `src/server/call-system/**`
  * `src/server/api/**`
* dependencies:

  * GDX-005
  * GDX-015
* definition_of_done:

  * Authorized users can fetch call work for the active business.
  * Call outcome and notes can be saved.
  * Recent history is readable.
  * Permission and business-scope tests pass.

### GDX-017

* ticket_id: GDX-017
* title: Build call workbench and recent history screens
* goal: Deliver the first usable call-system UI slice.
* scope:

  * Add call queue or next-call screen.
  * Add active call result form.
  * Add recent history screen.
  * Wire screens to existing call APIs.
* out_of_scope:

  * Softphone UI.
  * Auto-dialer UX.
  * Call analytics beyond basic history.
* files_likely_to_change:

  * `src/app/(app)/call-system/**`
  * `src/modules/call-system/**`
  * `src/components/forms/**`
* dependencies:

  * GDX-006
  * GDX-016
* definition_of_done:

  * Users can open call work, submit outcomes, and review recent calls.
  * Empty queue and failed save states are handled.
  * Business switching changes the visible call work correctly.
  * Basic UI smoke tests pass.

### GDX-018

* ticket_id: GDX-018
* title: Implement dashboard aggregation queries and jobs
* goal: Prepare reliable KPI data from companies, deals, and calls.
* scope:

  * Define MVP dashboard metrics.
  * Add aggregation queries or materialization jobs.
  * Add date-range and active-business support.
  * Add worker execution path for refreshable metrics.
* out_of_scope:

  * Dashboard UI.
  * Predictive scoring.
  * Custom report builder.
* files_likely_to_change:

  * `src/server/dashboard/**`
  * `src/workers/dashboard/**`
  * `src/server/db/schema/**`
* dependencies:

  * GDX-009
  * GDX-013
  * GDX-016
* definition_of_done:

  * MVP KPI queries return stable values for selected business and date range.
  * Aggregation logic is test-covered.
  * Refresh path can be run locally.
  * Metric definitions are aligned with implemented data flows.

### GDX-019

* ticket_id: GDX-019
* title: Build dashboard APIs and screens
* goal: Expose and render MVP KPI views for management and operations users.
* scope:

  * Add dashboard API endpoints.
  * Add KPI cards and simple trend visualizations.
  * Add business and date filters.
  * Handle permission-aware dashboard access.
* out_of_scope:

  * Custom dashboard builder.
  * Export/report download.
  * Non-MVP analytics modules.
* files_likely_to_change:

  * `src/app/api/dashboard/**`
  * `src/app/(app)/dashboard/**`
  * `src/modules/dashboard/**`
  * `src/server/dashboard/**`
* dependencies:

  * GDX-006
  * GDX-018
* definition_of_done:

  * Dashboard loads KPI data for the selected business and date range.
  * Empty datasets and partial failures are handled cleanly.
  * Access is limited by role and business visibility.
  * Basic UI smoke tests pass.

### GDX-020

* ticket_id: GDX-020
* title: Add Lark sync foundation and job infrastructure
* goal: De-risk the external integration without coupling it to unfinished product flows.
* scope:

  * Add Lark API client and configuration wrapper.
  * Add retry/error handling rules for sync jobs.
  * Add job runner scaffolding and sync-run tracking.
  * Add internal logging hooks for sync status.
* out_of_scope:

  * Actual company/contact mapping.
  * Bi-directional sync.
  * Admin UI.
* files_likely_to_change:

  * `src/server/integrations/lark/**`
  * `src/workers/lark-sync/**`
  * `src/server/jobs/**`
  * `src/server/db/schema/**`
* dependencies:

  * GDX-001
  * GDX-007
* definition_of_done:

  * Lark client can authenticate with configured credentials.
  * Sync jobs have retry-safe scaffolding.
  * Sync run status can be recorded and inspected.
  * Integration smoke tests pass with mocked responses.

### GDX-021

* ticket_id: GDX-021
* title: Implement company/contact sync jobs and manual trigger
* goal: Sync shared CRM data from Lark into the MVP system after core CRUD already works.
* scope:

  * Add company sync job.
  * Add contact sync job.
  * Map external data into shared CRM tables idempotently.
  * Add manual trigger endpoint or minimal admin trigger screen.
* out_of_scope:

  * Conflict-resolution UI.
  * Real-time webhooks.
  * Sync for deals or calls.
* files_likely_to_change:

  * `src/server/integrations/lark/**`
  * `src/workers/lark-sync/**`
  * `src/app/api/lark-sync/**`
  * `src/app/(app)/admin/**`
  * `src/server/customer-management/**`
* dependencies:

  * GDX-009
  * GDX-020
* definition_of_done:

  * Manual trigger starts a sync run successfully.
  * Re-running sync does not duplicate shared CRM records.
  * Sync failures are logged with actionable error output.
  * Last sync status is visible through API or admin UI.

## 4. Ticket Dependencies

### Core access chain

`GDX-001` → `GDX-003`
`GDX-002` → `GDX-003` → `GDX-004` → `GDX-005` → `GDX-006`

### Shared CRM chain

`GDX-007` → `GDX-008` and `GDX-009`
`GDX-006` + `GDX-008` + `GDX-009` → `GDX-010`

### Sales chain

`GDX-007` → `GDX-011`
`GDX-005` + `GDX-011` → `GDX-012` and `GDX-013`
`GDX-006` + `GDX-012` + `GDX-013` → `GDX-014`

### Call system chain

`GDX-007` → `GDX-015`
`GDX-005` + `GDX-015` → `GDX-016`
`GDX-006` + `GDX-016` → `GDX-017`

### Dashboard chain

`GDX-009` + `GDX-013` + `GDX-016` → `GDX-018`
`GDX-006` + `GDX-018` → `GDX-019`

### Lark sync chain

`GDX-001` + `GDX-007` → `GDX-020`
`GDX-009` + `GDX-020` → `GDX-021`

### Safe parallelization points

* `GDX-008` and `GDX-009` can run in parallel after `GDX-007` and `GDX-005`.
* `GDX-012` and `GDX-013` can run in parallel after `GDX-011` and `GDX-005`.
* `GDX-020` can be started earlier as a risk-reduction spike after `GDX-007`, but it should not interrupt the core MVP flow.

## 5. Recommended Execution Order

1. `GDX-001` — Configure Lark OAuth and auth environment validation
2. `GDX-002` — Add identity and RBAC schema migrations
3. `GDX-003` — Complete login, callback, and session flow
4. `GDX-004` — Seed RBAC master data and bootstrap user profile on login
5. `GDX-005` — Implement authorization utilities and route guards
6. `GDX-006` — Build the protected app shell and business switcher
7. `GDX-007` — Add shared CRM schema for companies and contacts
8. `GDX-008` — Implement companies and contacts read APIs
9. `GDX-009` — Implement companies and contacts write APIs
10. `GDX-010` — Build companies and contacts basic screens
11. `GDX-011` — Add sales schema for deals and pipeline history
12. `GDX-012` — Implement deals and pipeline read APIs
13. `GDX-013` — Implement deal write and stage transition APIs
14. `GDX-014` — Build pipeline and deal detail screens
15. `GDX-015` — Add call system schema
16. `GDX-016` — Implement call queue and call result APIs
17. `GDX-017` — Build call workbench and recent history screens
18. `GDX-018` — Implement dashboard aggregation queries and jobs
19. `GDX-019` — Build dashboard APIs and screens
20. `GDX-020` — Add Lark sync foundation and job infrastructure
21. `GDX-021` — Implement company/contact sync jobs and manual trigger

## 6. First Ticket to Start With

### Start with `GDX-001` — Configure Lark OAuth and auth environment validation

Why this should be first:

* It exposes the highest external-risk area immediately.
* It unblocks every later auth, session, and bootstrap ticket.
* It forces the team to settle environment naming, secret handling, and callback route shape before feature work starts.
* It prevents wasted UI/API work built on top of an unstable login assumption.

What success looks like for the first merge:

* The app can generate a valid Lark OAuth redirect.
* The callback route exists and handles success/error payload shapes.
* Environment validation fails fast in development and deployment.
* The repo is ready for `GDX-003` without revisiting auth configuration.
