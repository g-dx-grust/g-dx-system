# Task 03: アライアンス管理機能

## 概要
アライアンス（紹介者・パートナー・外部協力者）を管理するタブを新設し、案件登録時にアライアンスを紐付けられるようにする。

## データモデル

### 新テーブル 1: `alliances`
```sql
CREATE TABLE alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    name TEXT NOT NULL,                          -- 組織名 or 個人名
    alliance_type TEXT NOT NULL DEFAULT 'COMPANY', -- COMPANY | INDIVIDUAL
    contact_person_name TEXT,                    -- 一次接点・紹介者
    contact_person_role TEXT,                    -- 役職
    contact_person_email TEXT,
    contact_person_phone TEXT,
    agreement_summary TEXT,                      -- 合意・約束内容
    relationship_status TEXT NOT NULL DEFAULT 'PROSPECT', -- PROSPECT | ACTIVE | INACTIVE
    notes TEXT,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX alliances_business_unit_idx ON alliances(business_unit_id);
CREATE INDEX alliances_status_idx ON alliances(relationship_status);
```

### 新テーブル 2: `alliance_deal_links`
```sql
CREATE TABLE alliance_deal_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id UUID NOT NULL REFERENCES alliances(id),
    deal_id UUID NOT NULL REFERENCES deals(id),
    referral_type TEXT NOT NULL DEFAULT 'INTRODUCER', -- INTRODUCER | PARTNER | ADVISOR
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(alliance_id, deal_id)
);
CREATE INDEX alliance_deal_links_alliance_idx ON alliance_deal_links(alliance_id);
CREATE INDEX alliance_deal_links_deal_idx ON alliance_deal_links(deal_id);
```

## 実装対象

### 1. DB スキーマ — `packages/database/schema/sales.ts`
上記2テーブルを Drizzle スキーマとして追加。`index.ts` に export 追加。

### 2. マイグレーション — `packages/database/migrations/0012_alliance_management.sql`
上記 CREATE TABLE + INDEX を SQL で記述。

### 3. 型定義 — `packages/contracts/src/sales.ts`
```typescript
export type AllianceType = 'COMPANY' | 'INDIVIDUAL';
export type AllianceStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE';
export type AllianceReferralType = 'INTRODUCER' | 'PARTNER' | 'ADVISOR';

export interface AllianceListItem {
    id: UUID;
    name: string;
    allianceType: AllianceType;
    contactPersonName: string | null;
    relationshipStatus: AllianceStatus;
    linkedDealCount: number;
    createdAt: ISODateString;
}

export interface AllianceDetail extends AllianceListItem {
    businessScope: BusinessScopeType;
    contactPersonRole: string | null;
    contactPersonEmail: string | null;
    contactPersonPhone: string | null;
    agreementSummary: string | null;
    notes: string | null;
    linkedDeals: AllianceLinkedDeal[];
    updatedAt: ISODateString;
}

export interface AllianceLinkedDeal {
    dealId: UUID;
    dealName: string;
    companyName: string;
    stageKey: DealStageKey;
    referralType: AllianceReferralType;
    note: string | null;
}
```

### 4. モジュール構造 — 新規 `apps/web/src/modules/sales/alliance/`
DDD パターンに従い以下を作成:
```
alliance/
├── domain/
│   └── alliance.ts          -- AllianceListFilters, CreateAllianceInput 等の型
├── application/
│   ├── list-alliances.ts     -- 一覧取得
│   ├── get-alliance-detail.ts
│   ├── create-alliance.ts
│   ├── update-alliance.ts
│   └── link-deal.ts          -- アライアンス↔案件紐付け
├── infrastructure/
│   └── alliance-repository.ts
├── ui/
│   ├── alliance-list.tsx     -- 一覧画面
│   ├── alliance-detail.tsx   -- 詳細画面（紐付き案件一覧付き）
│   └── alliance-create-form.tsx
└── server-actions.ts
```

### 5. ページルーティング
```
apps/web/src/app/(protected)/sales/alliances/page.tsx           -- 一覧
apps/web/src/app/(protected)/sales/alliances/new/page.tsx       -- 新規作成
apps/web/src/app/(protected)/sales/alliances/[allianceId]/page.tsx -- 詳細
```

### 6. サイドナビゲーション追加
既存のナビ（`apps/web/src/components/` 配下のレイアウトコンポーネント）に「アライアンス」メニュー項目を追加。アイコンは `Users` (lucide) 等。

### 7. 案件側からの紐付けUI
**案件詳細画面**（`deal-detail.tsx`）に「アライアンス」セクションを追加:
- 紐付き済みアライアンス一覧（名前 + 紹介種別 + リンク）
- 「アライアンスを紐付け」ボタン → セレクト or 検索で選択 + referralType 選択
- 紐付け解除ボタン

**案件作成フォーム**（`deal-create-form.tsx`）:
- 任意項目として「アライアンス」セレクトを追加（既存アライアンスから選択）

### 8. Server Actions
- `createAllianceAction(formData)` — アライアンス作成
- `updateAllianceAction(formData)` — アライアンス更新
- `linkAllianceToDealAction(formData)` — 案件紐付け（allianceId, dealId, referralType）
- `unlinkAllianceFromDealAction(formData)` — 紐付け解除

### 9. 権限
- 既存の permission matrix に `alliance.read`, `alliance.create`, `alliance.update` を追加
- `packages/contracts/src/permissions/matrix.ts` に追加
- VIEWER 以上で read、OPERATOR 以上で create/update

## UI デザイン方針
- 既存の CRM 画面（会社一覧、契約一覧）と同じカードベースのデザイン
- ステータスバッジ: PROSPECT=灰色、ACTIVE=青、INACTIVE=薄灰色
- 紹介種別バッジ: INTRODUCER=紫、PARTNER=青、ADVISOR=緑

## 注意事項
- `contacts` テーブルとは別概念。contacts = 顧客側の連絡先、alliances = 紹介者・パートナー
- 双方向紐付け: アライアンス詳細から案件一覧、案件詳細からアライアンス一覧、両方向で参照可能
- 案件のステージに「ALLIANCE」が既にあるが、これはパイプラインステージの一つであり、このアライアンス管理機能とは別概念
- `businessUnitId` でスコープ。LARK_SUPPORT / WATER_SAVING それぞれで別管理
