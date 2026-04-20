# Task 07: 面談（Meetings）機能の基盤構築（Stage 1/2）

## 概要

商談・アライアンスとは独立した「面談（面会/初回ヒアリング）」を記録するための基盤を追加する。面談は、商談化・提携化の前段となる初回コンタクトや、分類未定のまま記録したい活動を対象とする。

本タスクでは **データモデル・バックエンド・面談単体の登録/一覧/詳細ページ**、および会社マスタの「Searchable Select から新規作成できる」UX拡張までを実装する。統合登録ページ（`/sales/register`）・変換フロー・ダッシュボード集計は **Task 08** で実装する。

## 前提コンテキスト

- リポジトリルート: `/Users/shojiyuya/Desktop/仕事/グラスト/案件/G-DX/g-dx_kanri`
- モノレポ構成（pnpm workspace + Turbo）
  - `apps/web`: Next.js App Router
  - `packages/database`: Drizzle ORM スキーマ + マイグレーション（PostgreSQL / Supabase）
  - `packages/contracts`: 型定義（`@g-dx/contracts`）
- 既存の類似テーブル構造（実装時に参照）:
  - `deals` / `dealActivities`: [packages/database/schema/sales.ts:57-213](packages/database/schema/sales.ts#L57-L213)
  - `alliances` / `allianceActivities`: [packages/database/schema/sales.ts:215-267](packages/database/schema/sales.ts#L215-L267)
  - `companies` マスタ: [packages/database/schema/companies.ts](packages/database/schema/companies.ts)
- 業務スコープ: `LARK_SUPPORT`（G-DX）/ `WATER_SAVING`（JET）。セッションから `session.activeBusinessScope` で参照。`businessUnitId` を FK で保持するパターンが既存。
- 認証: `getAuthenticatedAppSession()`（`@/shared/server/session`）
- サイドバー/ナビゲーション: 本タスクでは変更しない（Task 08 で追加）

## データモデル

### マイグレーション — `packages/database/migrations/0017_meetings.sql`

（番号は実装時に最新に合わせて調整）

```sql
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    owner_user_id UUID NOT NULL REFERENCES users(id),

    -- 相手先（排他的: companyId または allianceId、あるいは両方 NULL）
    counterparty_type TEXT NOT NULL DEFAULT 'NONE', -- COMPANY | ALLIANCE | NONE
    company_id UUID REFERENCES companies(id),
    alliance_id UUID REFERENCES alliances(id),
    contact_name TEXT,
    contact_role TEXT,

    -- 面談本体
    meeting_date TIMESTAMPTZ NOT NULL,
    activity_type TEXT NOT NULL, -- VISIT | ONLINE | CALL | OTHER
    purpose TEXT,                 -- 目的（自由記述）
    summary TEXT,                 -- 要約
    next_action_date DATE,
    next_action_content TEXT,

    -- 変換履歴（Task 08 で使用、本タスクではカラムのみ用意）
    converted_deal_id UUID REFERENCES deals(id),
    converted_alliance_id UUID REFERENCES alliances(id),
    converted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT meetings_counterparty_check CHECK (
        (counterparty_type = 'COMPANY' AND company_id IS NOT NULL AND alliance_id IS NULL)
        OR (counterparty_type = 'ALLIANCE' AND alliance_id IS NOT NULL AND company_id IS NULL)
        OR (counterparty_type = 'NONE' AND company_id IS NULL AND alliance_id IS NULL)
    )
);

CREATE INDEX meetings_business_unit_idx ON meetings(business_unit_id);
CREATE INDEX meetings_owner_user_idx ON meetings(owner_user_id);
CREATE INDEX meetings_meeting_date_idx ON meetings(meeting_date);
CREATE INDEX meetings_company_idx ON meetings(company_id);
CREATE INDEX meetings_alliance_idx ON meetings(alliance_id);
CREATE INDEX meetings_deleted_at_idx ON meetings(deleted_at);
```

### スキーマ — `packages/database/schema/sales.ts`

既存ファイル末尾に追記:

```typescript
// ─── 面談（商談・アライアンスと独立した初回コンタクト等の記録） ─────────
export const meetings = pgTable('meetings', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),

    counterpartyType: text('counterparty_type').notNull().default('NONE'), // COMPANY | ALLIANCE | NONE
    companyId: uuid('company_id').references(() => companies.id),
    allianceId: uuid('alliance_id').references(() => alliances.id),
    contactName: text('contact_name'),
    contactRole: text('contact_role'),

    meetingDate: timestamp('meeting_date', { withTimezone: true }).notNull(),
    activityType: text('activity_type').notNull(), // VISIT | ONLINE | CALL | OTHER
    purpose: text('purpose'),
    summary: text('summary'),
    nextActionDate: date('next_action_date'),
    nextActionContent: text('next_action_content'),

    convertedDealId: uuid('converted_deal_id').references(() => deals.id),
    convertedAllianceId: uuid('converted_alliance_id').references(() => alliances.id),
    convertedAt: timestamp('converted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    businessUnitIdx: index('meetings_business_unit_idx').on(table.businessUnitId),
    ownerUserIdx: index('meetings_owner_user_idx').on(table.ownerUserId),
    meetingDateIdx: index('meetings_meeting_date_idx').on(table.meetingDate),
    companyIdx: index('meetings_company_idx').on(table.companyId),
    allianceIdx: index('meetings_alliance_idx').on(table.allianceId),
    deletedAtIdx: index('meetings_deleted_at_idx').on(table.deletedAt),
}));
```

## 型定義 — `packages/contracts/src/sales.ts`

```typescript
export type MeetingActivityType = 'VISIT' | 'ONLINE' | 'CALL' | 'OTHER';
export type MeetingCounterpartyType = 'COMPANY' | 'ALLIANCE' | 'NONE';

export interface MeetingItem {
    id: string;
    businessScope: BusinessScopeType;
    ownerUserId: string;
    ownerName: string | null;

    counterpartyType: MeetingCounterpartyType;
    companyId: string | null;
    companyName: string | null;
    allianceId: string | null;
    allianceName: string | null;
    contactName: string | null;
    contactRole: string | null;

    meetingDate: string; // ISO
    activityType: MeetingActivityType;
    purpose: string | null;
    summary: string | null;
    nextActionDate: string | null;
    nextActionContent: string | null;

    convertedDealId: string | null;
    convertedAllianceId: string | null;
    convertedAt: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CreateMeetingRequest {
    businessScope: BusinessScopeType;
    ownerUserId?: string;
    counterpartyType: MeetingCounterpartyType;
    companyId?: string;
    allianceId?: string;
    contactName?: string;
    contactRole?: string;
    meetingDate: string; // ISO
    activityType: MeetingActivityType;
    purpose?: string;
    summary?: string;
    nextActionDate?: string;
    nextActionContent?: string;
}

export interface UpdateMeetingRequest extends Partial<CreateMeetingRequest> {
    id: string;
}
```

`packages/contracts/src/index.ts` から export されるよう確認すること。

## ディレクトリ構成（新規）

既存の `modules/sales/deal` / `modules/sales/alliance` 構造に倣う:

```
apps/web/src/modules/sales/meeting/
  application/
    create-meeting.ts
    update-meeting.ts
    delete-meeting.ts
    list-meetings.ts
    get-meeting.ts
  domain/
    meeting.ts         # エンティティ型・バリデーション
  infrastructure/
    meeting-repository.ts
  ui/
    meeting-create-form.tsx
    meeting-edit-form.tsx
    meeting-list.tsx
  server-actions.ts
```

## Server Actions — `apps/web/src/modules/sales/meeting/server-actions.ts`

既存の [deal/server-actions.ts](apps/web/src/modules/sales/deal/server-actions.ts) / [alliance/server-actions.ts](apps/web/src/modules/sales/alliance/server-actions.ts) と同じ書式:

- `createMeetingAction(formData: FormData)` — 成功時 `/sales/meetings/{id}?created=1` にリダイレクト
- `updateMeetingAction(formData: FormData)` — 成功時 `/sales/meetings/{id}?updated=1`
- `deleteMeetingAction(formData: FormData)` — 成功時 `/sales/meetings?deleted=1`

注意:
- `counterpartyType` に応じて `companyId` / `allianceId` のどちらを読むか分岐
- バリデーション失敗時は該当ページに `?error=validation` 等で戻す
- `revalidatePath('/sales/meetings')` と `/dashboard/activity`（Task 08 で集計対象になるため）を必ず呼ぶ
- 本タスクでは **Redis キャッシュ purge は未実装でOK**（Task 08 で dashboard キャッシュキーを追加してから合わせて実装）

## ページ

全て `apps/web/src/app/(protected)/sales/meetings/` 配下。既存の `/sales/deals`、`/sales/alliances` 構造と揃える。

### 1. 一覧 — `/sales/meetings/page.tsx`
- 表示: 日時 / 相手（会社 or アライアンス or 個人） / 種別バッジ / 目的 / 担当者 / 次アクション / 変換状態
- 検索/フィルタ: 期間、担当者、種別、相手タイプ（会社/アライアンス/なし）
- 「新規登録」ボタン → `/sales/meetings/new`
- スコープで自動フィルタ（`session.activeBusinessScope` → `businessUnitId`）

### 2. 新規 — `/sales/meetings/new/page.tsx`
- `MeetingCreateForm` をレンダリング
- companies（会社マスタ）と alliances を取得して渡す

### 3. 詳細/編集 — `/sales/meetings/[meetingId]/page.tsx`
- 既存の [deals/[dealId]/page.tsx](apps/web/src/app/(protected)/sales/deals/[dealId]/page.tsx) のレイアウトを参考
- 上部にメタ情報、下部に編集フォーム（`MeetingEditForm`）
- 「商談に変換」「アライアンスに変換」ボタンは **プレースホルダ（disabled + ツールチップ "Task 08 で実装"）**。実装は Task 08

## フォーム仕様 — `MeetingCreateForm`

フィールド（ラベル / name / 型 / 必須）:

| ラベル | name | 型 | 必須 |
|-------|------|-----|------|
| 日時 | `meetingDate` | datetime-local | 必須 |
| 種別 | `activityType` | select (VISIT/ONLINE/CALL/OTHER) | 必須 |
| 相手タイプ | `counterpartyType` | radio (案件会社 / アライアンス / なし) | 必須 |
| 相手会社（案件会社） | `companyId` | SearchableSelect | `counterpartyType=COMPANY` のとき必須 |
| 相手アライアンス | `allianceId` | SearchableSelect | `counterpartyType=ALLIANCE` のとき必須 |
| 相手氏名 | `contactName` | Input | 任意 |
| 役職 | `contactRole` | Input | 任意 |
| 目的 | `purpose` | textarea (自由記述) | 任意 |
| 要約 | `summary` | textarea | 任意 |
| 次アクション日 | `nextActionDate` | date | 任意 |
| 次アクション内容 | `nextActionContent` | Input | 任意 |
| 担当者 | `ownerUserId` | select (デフォルト=自分) | 任意 |

- 相手タイプに応じた **条件付き表示** のため `'use client'` 化が必要
- 商談フォーム [deal-create-form.tsx](apps/web/src/modules/sales/deal/ui/deal-create-form.tsx) のスタイル・レイアウトを流用

## 会社マスタ / アライアンスの Searchable Select 拡張 ★重要

ユーザーは「会社マスタに存在しない場合、その場で新規登録できる」挙動を要求している。既存の `SearchableSelect` を拡張する:

### 対象ファイル
- [apps/web/src/components/ui/searchable-select.tsx](apps/web/src/components/ui/searchable-select.tsx)

### 要件
1. **検索結果ゼロ時に「＋ 新規作成」ボタン**を表示するオプション `onCreate?: (query: string) => Promise<{ id: string; label: string }>` を追加
2. `onCreate` を渡した呼び出し側は、検索語を引数に新規レコードを作成して `{id, label}` を返す責務を持つ
3. 作成成功時、その値を自動選択

### 面談フォームでの使い方
- `counterpartyType=COMPANY` 選択時: `companies` マスタの SearchableSelect に `onCreate` を指定し、新規会社作成 Server Action を呼ぶ（最小項目: `displayName`, `legalName`, `normalizedName`）
- `counterpartyType=ALLIANCE` 選択時: `alliances` の SearchableSelect に `onCreate` を指定し、新規アライアンス作成 Server Action を呼ぶ（最小項目: `name`, `allianceType`）

### 新規作成 Server Actions
- `createCompanyQuickAction(name: string)`（既存があれば再利用可、なければ `modules/customers/company/server-actions.ts` あたりに追加）
- `createAllianceQuickAction(name: string)`（[alliance/server-actions.ts](apps/web/src/modules/sales/alliance/server-actions.ts) に追加）
- 両方ともスコープ・ユーザー情報を session から取得

## 受け入れ条件

- [ ] マイグレーションが通り、`meetings` テーブルと CHECK 制約が作成される
- [ ] `/sales/meetings` で一覧が表示でき、スコープでフィルタされる
- [ ] `/sales/meetings/new` から面談を登録でき、`counterpartyType=COMPANY/ALLIANCE/NONE` すべて保存できる
- [ ] `SearchableSelect` で会社/アライアンスをその場で新規作成でき、面談と紐付く
- [ ] `/sales/meetings/[meetingId]` で詳細・編集ができる
- [ ] `pnpm -w typecheck` と `pnpm -w lint` がパス
- [ ] 既存の `/sales/deals/new` `/sales/alliances/new` の動作に影響がない

## 注意事項

- 本タスクではサイドバー更新・活動ダッシュボード集計・変換フローは **実装しない**（Task 08）
- `converted_deal_id` / `converted_alliance_id` カラムはスキーマには作るが、書き込むコードは書かない
- 既存の `dealActivities` / `allianceActivities` の挙動は変更しない
- マイグレーション番号は実装時に `packages/database/migrations/` の最新番号に合わせる（末尾ログで確認: `ls packages/database/migrations/`）
- Drizzle のマイグレーション生成コマンドは既存プロジェクトのものに従うこと（`pnpm db:generate` 等、package.json で確認）
