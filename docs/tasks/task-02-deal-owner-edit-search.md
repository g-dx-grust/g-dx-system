# Task 02: 案件担当者の編集 + 検索機能強化

## 概要
1. 案件詳細の編集フォームで担当者（`ownerUserId`）を変更できるようにする
2. 案件一覧の検索条件に高度なフィルタ（担当者、ステージ、金額範囲、次回アクション状態）を追加する

## 現状
- **担当者編集**: `deals.ownerUserId` は DB カラムとして存在。`UpdateDealInput` に `ownerUserId` フィールドあり。だがUI側の編集フォームに担当者選択のセレクトボックスがない
- **検索**: 案件一覧（`deal-list.tsx`）は `keyword`（案件名テキスト検索）と `stage`（ステージドロップダウン）のみ
- **リポジトリ**: `DealListFilters` に `ownerUserId` と `companyId` は既にある（`deal-repository.ts:53-54`）がUI未接続
- **ユーザー一覧取得**: 他画面（契約作成等）で users セレクトボックスの実装パターンあり

---

## Part A: 担当者編集

### 1. 案件詳細ページ — `apps/web/src/app/(protected)/sales/deals/[dealId]/page.tsx`
- 同じ businessUnit に所属するユーザー一覧を取得（`userBusinessMemberships` テーブルでフィルタ）
- `DealDetailView` に `users: UserOption[]` を追加で渡す

### 2. 案件詳細UI — `apps/web/src/modules/sales/deal/ui/deal-detail.tsx`
DealDetailView の props に `users?: UserOption[]` を追加（`interface UserOption { id: string; name: string }`）。

編集フォーム（`updateDealAction` を action に持つ form）内に担当者セレクトを追加:
```html
<label>
    担当者
    <select name="ownerUserId" defaultValue={deal.ownerUser.id}>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select>
</label>
```

### 3. Server Action — `apps/web/src/modules/sales/deal/server-actions.ts`
`updateDealAction` 内で `ownerUserId` を FormData から取得する処理を追加:
```typescript
const ownerUserId = readString(formData, 'ownerUserId');
```
`updateDeal` 呼び出しの引数に `ownerUserId` を渡す（既に `UpdateDealInput` に定義済み）。

### 4. リポジトリ確認 — `deal-repository.ts`
`updateDeal` 関数内で `ownerUserId` が SET 対象に含まれているか確認。含まれていなければ追加。

---

## Part B: 検索機能強化

### 1. フィルタ型拡張 — `apps/web/src/modules/sales/deal/domain/deal.ts`
`DealListFilters` に以下を追加:
```typescript
export interface DealListFilters {
    // 既存
    page?: number;
    pageSize?: number;
    keyword?: string;
    businessScope: BusinessScopeType;
    stage?: DealStageKey;
    ownerUserId?: UUID;
    companyId?: UUID;
    // 新規追加
    amountMin?: number;
    amountMax?: number;
    nextActionStatus?: 'NOT_SET' | 'OVERDUE' | 'THIS_WEEK' | 'ALL';
    dealStatus?: DealStatus;
    lastActivityBefore?: string; // ISO date — この日より前に最終活動がある案件
}
```

### 2. リポジトリ — `deal-repository.ts` の `listDeals`
`whereClause` に新フィルタ条件を追加:
- `amountMin`: `gte(deals.amount, amountMin)`
- `amountMax`: `lte(deals.amount, amountMax)`
- `dealStatus`: `eq(deals.dealStatus, dealStatus)`
- `nextActionStatus`:
  - `NOT_SET`: `isNull(deals.nextActionDate)`
  - `OVERDUE`: `lte(deals.nextActionDate, today)` (today = current date)
  - `THIS_WEEK`: `lte(deals.nextActionDate, endOfWeek)`
- `lastActivityBefore`: サブクエリで `dealActivities` の最新日付を取得し比較

### 3. 案件一覧UI — `apps/web/src/modules/sales/deal/ui/deal-list.tsx`
検索フォームを拡張:
```
[キーワード入力] [ステージ ▼] [担当者 ▼] [検索ボタン]
▼ 詳細検索（折りたたみ）
  [金額 min] ~ [金額 max]  [次回アクション ▼]  [ステータス ▼]
  [クリア] [検索]
```

- **担当者セレクト**: ページコンポーネントからユーザー一覧を渡す
- **次回アクション状態**: `未設定 / 期限超過 / 今週中 / すべて`
- **ステータス**: `進行中 / 成約 / 失注 / アーカイブ`
- **詳細検索**: デフォルト非表示、トグルで展開（`<details>` or state管理）

### 4. 案件一覧ページ — `apps/web/src/app/(protected)/sales/deals/page.tsx`
- searchParams から新フィルタパラメータを読み取り
- ユーザー一覧を取得して `DealList` に渡す
- フィルタ値を `listDeals` に渡す

## 注意事項
- 担当者変更時の audit log は既存の `updateDeal` で記録される想定
- 検索はすべてサーバーサイド（URL searchParams ベース、クライアント state 不要）
- 金額フィルタは `numeric` カラムなのでキャスト注意
- `DealListQuery`（`packages/contracts/src/sales.ts`）にも API 側の型を同期追加すること
