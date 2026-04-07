# Task 01: 契約後活動記録 UI 実装

## 概要
`contractActivities` テーブル（スキーマ済み）に対応するUI（一覧表示 + 入力フォーム）を契約詳細画面に追加する。

## 現状
- **スキーマ**: `contract_activities` テーブルは `packages/database/schema/sales.ts:165-177` に定義済み
  - `id`, `contractId`, `businessUnitId`, `userId`, `activityType` (VISIT|CALL|EMAIL|INTERNAL|OTHER), `activityDate`, `summary`, `createdAt`
- **UI**: 未実装。契約詳細画面（`apps/web/src/modules/sales/contract/ui/contract-detail.tsx`）に活動ログ表示がない
- **参考実装**: 案件活動ログ（`apps/web/src/modules/sales/deal/ui/deal-activity-log.tsx`）が同等パターンで実装済み

## 実装対象ファイル

### 1. 型定義追加 — `packages/contracts/src/sales.ts`
```typescript
// 既存の DealActivityType の下あたりに追加
export type ContractActivityType = 'VISIT' | 'CALL' | 'EMAIL' | 'INTERNAL' | 'OTHER';

export interface ContractActivityItem {
    id: string;
    contractId: string;
    userId: string;
    userName: string;
    activityType: ContractActivityType;
    activityDate: string;
    summary: string | null;
    createdAt: string;
}

export interface CreateContractActivityRequest {
    contractId: string;
    activityType: ContractActivityType;
    activityDate: string;
    summary?: string;
}
```

### 2. リポジトリ — `apps/web/src/modules/sales/contract/infrastructure/contract-repository.ts`
以下の関数を追加:
- `listContractActivities(contractId: UUID): Promise<ContractActivityItem[]>` — contractActivities を userId JOIN users で取得、createdAt DESC
- `createContractActivity(input): Promise<{ id: UUID }>` — insert + audit log

**パターン参考**: `apps/web/src/modules/sales/deal/infrastructure/deal-repository.ts` の `createDealActivity` / `listDealActivities`

### 3. アプリケーション層 — `apps/web/src/modules/sales/contract/application/`
新規ファイル `create-contract-activity.ts`:
- `getAuthenticatedAppSession()` でセッション取得
- `assertPermission(session, 'contract.update_basic')` で権限チェック
- リポジトリの `createContractActivity` を呼び出し

### 4. Server Action — `apps/web/src/modules/sales/contract/server-actions.ts`
`createContractActivityAction(formData: FormData)` を追加:
- `contractId`, `activityType`, `activityDate`, `summary` を FormData から取得
- 成功時: `revalidatePath('/sales/contracts/${contractId}')` + redirect with `?activityAdded=1`

### 5. UI コンポーネント — 新規: `apps/web/src/modules/sales/contract/ui/contract-activity-log.tsx`
案件活動ログ（`deal-activity-log.tsx`）と同じパターンで実装:
- `ContractActivityLog` コンポーネント
  - インライン追加フォーム（種別セレクト、日付、内容テキストエリア）
  - 活動一覧（バッジ + 日付 + ユーザー名 + 内容）
- 種別ラベル: `VISIT: '訪問', CALL: '電話', EMAIL: 'メール', INTERNAL: '社内', OTHER: 'その他'`
- `meetingCount` は不要（契約活動には面会数カウントなし）

### 6. 契約詳細画面への組み込み — `apps/web/src/modules/sales/contract/ui/contract-detail.tsx`
- `ContractActivityLog` を契約詳細カードの下に配置
- props: `contractId`, `activities`, `activityAdded`

### 7. ページデータ取得 — `apps/web/src/app/(protected)/sales/contracts/[contractId]/page.tsx`
- `listContractActivities(contractId)` を呼び出して activities を取得
- `ContractDetailView` に `activities` と `activityAdded` を渡す

## 注意事項
- `deal-activity-log.tsx` のコードをほぼ踏襲してよいが、`meetingCount` フィールドは除外
- activityType に `ONLINE` はなく `INTERNAL` がある点に注意
- 既存の contract CRUD パターン（`readString`, `isAppError` ハンドリング, `revalidatePath`）に従うこと
- テーブルは既にDBに存在するためマイグレーション不要
