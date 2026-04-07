# Task 05: 面会区分（新規/リピート、個人/法人）

## 概要
活動記録（`dealActivities`）に面会の区分フィールドを追加し、KPI集計で「新規面会のみ」をカウントできるようにする。

## データモデル変更

### マイグレーション — `packages/database/migrations/0014_meeting_category.sql`
（番号は実装時に調整）
```sql
ALTER TABLE deal_activities ADD COLUMN visit_category TEXT; -- NEW | REPEAT
ALTER TABLE deal_activities ADD COLUMN target_type TEXT;    -- INDIVIDUAL | CORPORATE
```
- nullable（既存レコードは NULL のまま、後方互換）
- VISIT / ONLINE の場合のみ入力対象

### スキーマ — `packages/database/schema/sales.ts`
`dealActivities` テーブルに追加:
```typescript
visitCategory: text('visit_category'),  // NEW | REPEAT
targetType: text('target_type'),        // INDIVIDUAL | CORPORATE
```

## 型定義 — `packages/contracts/src/sales.ts`

```typescript
export type VisitCategory = 'NEW' | 'REPEAT';
export type MeetingTargetType = 'INDIVIDUAL' | 'CORPORATE';

// DealActivityItem に追加
export interface DealActivityItem {
    // ... 既存フィールド
    visitCategory: VisitCategory | null;
    targetType: MeetingTargetType | null;
}

// CreateDealActivityRequest に追加
export interface CreateDealActivityRequest {
    // ... 既存フィールド
    visitCategory?: VisitCategory;
    targetType?: MeetingTargetType;
}
```

## UI変更

### 1. 活動記録フォーム — `apps/web/src/modules/sales/deal/ui/deal-activity-log.tsx`
活動種別が `VISIT` または `ONLINE` の場合にのみ、追加フィールドを表示:

```
[種別 ▼] [日付] [面会数]
── 以下、種別が VISIT or ONLINE の場合のみ表示 ──
[新規/リピート ▼]  [個人/法人 ▼]
[内容テキストエリア]
[記録ボタン]
```

- **新規/リピート**: `<select name="visitCategory">` — `新規面会 / リピート面会`
  - デフォルト: `REPEAT`（安全側に倒す）
  - VISIT/ONLINE 以外の種別では非表示 & 送信しない
- **個人/法人**: `<select name="targetType">` — `個人 / 法人`
  - デフォルト: `CORPORATE`
  - VISIT/ONLINE 以外では非表示

**条件表示の実装**: `'use client'` 化が必要。種別セレクトの `onChange` で state を管理し、VISIT/ONLINE 選択時のみサブフィールドを表示。
- 現在の `deal-activity-log.tsx` はサーバーコンポーネント（form action）なので、フォーム部分だけ `ActivityForm` クライアントコンポーネントに切り出すのがベスト

### 2. 活動一覧表示
各活動レコードのバッジ横に区分を表示:
```
[訪問] [新規・法人]  2024-04-01  山田太郎
```
- `visitCategory === 'NEW'` の場合: `新規` バッジ（青系）
- `visitCategory === 'REPEAT'` の場合: `リピート` バッジ（灰色）
- `targetType` は小さく付記: `個人` or `法人`

### 3. Server Action — `deal-server-actions.ts`
`createDealActivityAction` に追加:
```typescript
const visitCategory = readString(formData, 'visitCategory') as VisitCategory | undefined;
const targetType = readString(formData, 'targetType') as MeetingTargetType | undefined;
```
`createDealActivity` 呼び出しに渡す。

### 4. リポジトリ — `deal-repository.ts`
`createDealActivity` の insert に `visitCategory`, `targetType` を追加。
`listDealActivities` の select にも追加。

## KPI集計への影響

### 対象ファイル
KPI集計ロジック（`deal-repository.ts` 内の dashboard 系関数 or `apps/web/src/modules/sales/deal/infrastructure/` 配下）

### 変更内容
- **newVisitCount** の集計: `WHERE activity_type IN ('VISIT','ONLINE') AND visit_category = 'NEW'` に変更
  - 現在の newVisitCount がどう集計されているか確認し、`visitCategory` フィルタを追加
- **visitCount**（全面会）: 変更なし（NEW + REPEAT 両方カウント）
- `PersonalKpiItem` の `newVisitCount` ラベルを「新規面会数」に明確化

### KPI ダッシュボード表示
- `personal-kpi-progress.tsx`: 新規面会 vs 全面会の内訳が見えるように
- `dashboard-activity.tsx`: メンバー活動統計に新規/リピートの内訳列を追加（任意）

## 注意事項
- 既存の `dealActivities` レコードは `visitCategory = NULL`, `targetType = NULL` のまま
  - KPI集計で NULL は「リピート扱い」にする（= 新規は明示的に `NEW` を選んだ場合のみ）
  - これにより過去データで新規KPIが膨らむことを防ぐ
- フォームの条件表示のため、活動フォーム部分のみクライアントコンポーネント化が必要
- サイドバー版のフォーム（`DealActivitySidebarForm`）にも同じ変更を適用すること
