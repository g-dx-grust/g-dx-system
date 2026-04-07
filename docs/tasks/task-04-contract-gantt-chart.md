# Task 04: 契約後ガントチャート

## 概要
契約後の進行状況をガントチャートで可視化する。営業アクション / 構築アクション / 開発アクションを色分けし、どの案件がどこで詰まっているかを把握できるようにする。

## データモデル

### 新テーブル 1: `contract_milestones`
```sql
CREATE TABLE contract_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    milestone_name TEXT NOT NULL,
    milestone_type TEXT NOT NULL DEFAULT 'SALES_ACTION', -- SALES_ACTION | BUILD_ACTION | DEV_ACTION
    assignee_user_id UUID REFERENCES users(id),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED | IN_PROGRESS | COMPLETED | BLOCKED
    depends_on_milestone_id UUID REFERENCES contract_milestones(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contract_milestones_contract_idx ON contract_milestones(contract_id);
CREATE INDEX contract_milestones_business_unit_idx ON contract_milestones(business_unit_id);
CREATE INDEX contract_milestones_assignee_idx ON contract_milestones(assignee_user_id);
```

### 新テーブル 2: `contract_milestone_templates`
```sql
CREATE TABLE contract_milestone_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    template_name TEXT NOT NULL,
    milestones JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contract_milestone_templates_business_unit_idx ON contract_milestone_templates(business_unit_id);
```

`milestones` JSONB の構造:
```json
[
    {
        "milestoneName": "契約書締結",
        "milestoneType": "SALES_ACTION",
        "offsetDays": 0,
        "durationDays": 3,
        "sortOrder": 1
    },
    {
        "milestoneName": "環境構築",
        "milestoneType": "BUILD_ACTION",
        "offsetDays": 3,
        "durationDays": 7,
        "sortOrder": 2,
        "dependsOnIndex": 0
    }
]
```

## 実装対象

### 1. DB スキーマ — `packages/database/schema/sales.ts`
上記2テーブルを Drizzle で定義。

### 2. マイグレーション — `packages/database/migrations/0013_contract_milestones.sql`
（アライアンスが 0012 の場合。番号は実装時に調整）

### 3. 型定義 — `packages/contracts/src/sales.ts`
```typescript
export type MilestoneType = 'SALES_ACTION' | 'BUILD_ACTION' | 'DEV_ACTION';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface ContractMilestoneItem {
    id: UUID;
    contractId: UUID;
    milestoneName: string;
    milestoneType: MilestoneType;
    assigneeUser: { id: UUID; name: string } | null;
    plannedStartDate: string | null;
    plannedEndDate: string | null;
    actualStartDate: string | null;
    actualEndDate: string | null;
    status: MilestoneStatus;
    dependsOnMilestoneId: UUID | null;
    sortOrder: number;
    notes: string | null;
}

export interface ContractGanttData {
    contract: { id: UUID; title: string; companyName: string };
    milestones: ContractMilestoneItem[];
}
```

### 4. モジュール構造
`apps/web/src/modules/sales/contract/` 配下に追加:
```
contract/
├── application/
│   ├── list-milestones.ts       -- 契約のマイルストーン一覧
│   ├── create-milestone.ts
│   ├── update-milestone.ts
│   ├── delete-milestone.ts
│   └── get-gantt-overview.ts    -- 横断ガントデータ取得
├── infrastructure/
│   └── milestone-repository.ts
├── ui/
│   ├── contract-gantt.tsx       -- ガントチャート表示（'use client'）
│   ├── milestone-form.tsx       -- マイルストーン追加/編集フォーム
│   └── gantt-overview.tsx       -- 全契約横断ビュー
└── server-actions.ts            -- 既存に追記
```

### 5. ガントチャートUI — `contract-gantt.tsx`
**ライブラリ**: 自前のシンプルな横棒チャートを CSS Grid で実装（外部依存なし推奨）。
- 横軸: 日付（週単位でグリッド線）
- 縦軸: マイルストーン（sortOrder 順）
- 色分け:
  - SALES_ACTION: `bg-blue-400` (青)
  - BUILD_ACTION: `bg-emerald-400` (緑)
  - DEV_ACTION: `bg-purple-400` (紫)
- ステータス表現:
  - NOT_STARTED: 枠線のみ（planned 期間を点線表示）
  - IN_PROGRESS: 半透明バー（actual start ～ 今日）
  - COMPLETED: ソリッドバー（actual start ～ actual end）
  - BLOCKED: 赤枠 + 斜線パターン
- 依存関係線は初期実装では省略可（将来拡張）

### 6. 契約詳細画面への組み込み
`contract-detail.tsx` に「進行状況」セクションを追加:
- ガントチャート表示
- 「マイルストーン追加」ボタン
- 各マイルストーンの編集・ステータス変更・削除

### 7. 横断ビュー（Phase 2 でもOK）
`apps/web/src/app/(protected)/sales/contracts/gantt/page.tsx`:
- 全アクティブ契約のマイルストーンを1画面で表示
- フィルタ: 担当者、期間、milestoneType
- リソースのパンク（同一担当者に重複期間のマイルストーン）をハイライト

### 8. テンプレート機能（Phase 2 でもOK）
- テンプレートから一括でマイルストーンを生成
- 契約作成時に「テンプレート適用」ボタン → offsetDays を contractDate 基準で計算

## Server Actions
- `createMilestoneAction(formData)` — マイルストーン作成
- `updateMilestoneAction(formData)` — 更新（ステータス変更含む）
- `deleteMilestoneAction(formData)` — 削除

## 注意事項
- ガントチャートは `'use client'` コンポーネント（DOM操作が多い）
- 外部ライブラリ（frappe-gantt等）は使わず CSS Grid + Tailwind で実装を推奨（バンドルサイズ抑制）
- 初期実装は契約詳細のマイルストーン管理 + 単体ガント表示に集中。横断ビューとテンプレートは後回し可
- `businessUnitId` スコープを忘れずに
