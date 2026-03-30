# 活動ダッシュボード・個人ダッシュボード・KPI 拡張 実装仕様（Claude Code 向け）

> **目的**: 個人ダッシュボードを「今週／先週／今月／先月 × 新規／既存案件」の実績表示に拡張し、活動ダッシュボードは**同一ロジック**でチーム集計・メンバー一覧を表示する。既存の月次 KPI 目標（`user_kpi_targets`）は維持し、週次目標は**初版では必須にしない**（実績のみでも可）。

---

## 1. 実装の優先順位（必ずこの順）

1. **期間ユーティリティ** — 4 期間の `[startDate, endDate]`（カレンダー日付文字列 `YYYY-MM-DD`）を返す純関数。テスト可能にする。
2. **新規／既存の判定関数** — 案件 ID または `companyId + 基準日` から `new | existing` を返す（定義は §4）。
3. **個人向け集計リポジトリ** — `personal-kpi-repository.ts` に「指定期間の実績」を追加、または隣接ファイル `personal-kpi-period-repository.ts` に切り出し。
4. **個人ダッシュボード UI** — `PersonalKpiProgress` に 4 期間＋内訳を表示。
5. **チーム向け集計** — `kpi-repository.ts` を拡張、または `rolling-kpi-repository.ts` を新設し、`getSalesKpi` の日次／四半期／年間を**今週／先週／今月／先月**に差し替え。
6. **メンバービュー修正** — `byOwner` だけだと**案件を 1 件も持たないユーザーが一覧に出ない**。`user_business_memberships`（`membership_status = 'active'`）とマージする（§6）。
7. **契約型の更新** — `packages/contracts/src/sales.ts` の型を UI／サーバーで共有。
8. （任意）**KPI 目標設定画面** — 週次目標を入れるなら DB マイグレーション＋フォーム。入れないなら説明文のみ更新。

---

## 2. 現状コードマップ（触る場所）

| 領域 | パス |
|------|------|
| 活動ダッシュページ | `apps/web/src/app/(protected)/dashboard/activity/page.tsx` |
| 個人ダッシュページ | `apps/web/src/app/(protected)/dashboard/personal/page.tsx` |
| KPI 目標設定 | `apps/web/src/app/(protected)/dashboard/settings/kpi/page.tsx` |
| 営業 KPI 集計（BU 全体・旧期間） | `apps/web/src/modules/sales/deal/infrastructure/kpi-repository.ts` |
| 個人月次実績・目標 | `apps/web/src/modules/sales/deal/infrastructure/personal-kpi-repository.ts` |
| 個人ダッシュ用アプリ層 | `apps/web/src/modules/sales/deal/application/get-personal-dashboard-data.ts` |
| 個人 KPI UI | `apps/web/src/modules/sales/deal/ui/personal-kpi-progress.tsx` |
| 営業 KPI テーブル UI | `apps/web/src/modules/sales/deal/ui/sales-kpi-dashboard.tsx` |
| メンバービュー | `apps/web/src/modules/sales/deal/ui/member-view-tabs.tsx` |
| ダッシュサマリー（`byOwner` 生成） | `apps/web/src/modules/sales/deal/infrastructure/deal-repository.ts` → `getDashboardSummary` |
| 月次活動統計（メンバー別） | `apps/web/src/modules/sales/deal/infrastructure/activity-repository.ts`（`getMonthlyActivityStats`） |
| 契約型 | `packages/contracts/src/sales.ts`（`PersonalDashboardData` 等） |

---

## 3. 期間定義（実装アルゴリズム）

**タイムゾーン**: アプリの「今日」を決める基準を **JST（Asia/Tokyo）** に統一する。サーバーが UTC の場合は `Intl` または `date-fns-tz` 等で「東京の暦日」を取得すること。

**週の境界**: **月曜始まり**（ISO 週）をデフォルトとする。

- `thisWeek`: 東京の「今日」が含まれる週の月曜〜日曜（両端含む、`YYYY-MM-DD`）。
- `lastWeek`: その直前の週（月〜日）。
- `thisMonth`: 東京の当月 1 日〜末日。
- `lastMonth`: 前月 1 日〜末日。

疑似コード:

```ts
type RollingPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

function getRollingPeriodBounds(period: RollingPeriod, nowInTokyo: Date): { startDate: string; endDate: string; label: string };
```

**個人のコール数**: 既存の `getPersonalActuals` は `deal_activities` の手動ログ＋`call_logs` を月内で合算している。**期間版でも同じ合成ルールを踏襲**し、活動ダッシュのチーム集計とズレないようにする（`kpi-repository.ts` は現状 `call_logs` を含まない → **どちらかに寄せるか** §8 で決め、実装で統一）。

---

## 4. 新規案件／既存案件の定義（デフォルト案）

DB に明示フラグがない前提での**推奨デフォルト**（プロダクト確認で差し替え可）:

- 対象は **`deals` の `companyId`**（同一顧客企業）。
- 基準イベント日を `E` とする（活動なら `deal_activities.activityDate`、ステージ遷移なら `deal_stage_history.changedAt` の日付部分、案件作成なら `deals.createdAt` の日付部分など）。
- **`E` の時点で**、当該 `businessUnitId` かつ `deletedAt IS NULL` の案件のうち、`createdAt < E の 0:00（JST）` かつ同一 `companyId` のものが **1 件でもあれば `existing`**、なければ **`new`**。

> 注意: 「当該案件自身」の `createdAt` は常に `<= E` なので、比較対象から**同一 `dealId` を除く**、または「`E` より前に作成された**他案件**の有無」だけを数える。

集計時は SQL サブクエリまたはアプリ側でバッチ判定。パフォーマンスが厳しければ `companies` や `deals` にキャッシュ列を追加する案は**別タスク**とする。

**案件に紐づかない活動**（将来 `dealId` nullable 等）がある場合は `segment: 'unassigned' | 'new' | 'existing'` の三値とし、UI は「未紐づけ」行で表示。

---

## 5. 指標（KPI キー）と分割ルール

`SalesKpiData` と個人側で**同じキー**を使う:

| key | 意味 | 新規／既存の付け方 |
|-----|------|-------------------|
| `callCount` | コール | 活動ログの `dealId` → 案件 → `companyId` で判定。`call_logs` は `dealId` が取れるなら同様。取れなければ §8 |
| `visitCount` | 訪問 | 同上（`deal_activities.activityType = 'VISIT'`） |
| `onlineCount` | オンライン商談 | 同上（`'ONLINE'`） |
| `appointmentCount` | アポイント | **既存 `kpi-repository` は期間内 `deals.createdAt` をカウント**。個人側のステージベースとズレる可能性あり → **既存ロジックをどちらかに統一**（推奨: `personal-kpi-repository` の定義に合わせる） |
| `negotiationCount` | 商談化 | `deal_stage_history` で `NEGOTIATING` 到達、期間内 `changedAt`、対象 deal で new/existing |
| `contractCount` | 契約 | `CONTRACTED` 到達、期間内 `changedAt` |

各キーについて、期間ごとに次の形を返す:

```ts
export type DealSegment = 'new' | 'existing';

export interface KpiSegmentedCounts {
  total: number;
  bySegment: Record<DealSegment, number>;
}

export type RollingKpiPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

export interface PersonalRollingKpiBlock {
  period: RollingKpiPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  metrics: Record<
    'callCount' | 'visitCount' | 'onlineCount' | 'appointmentCount' | 'negotiationCount' | 'contractCount',
    KpiSegmentedCounts
  >;
}

export interface PersonalDashboardData {
  // 既存フィールドは維持（targetMonth, kpiItems, revenue*, hasTargets など）
  rollingKpis: PersonalRollingKpiBlock[];
}
```

活動ダッシュのテーブル用（BU 全体）:

```ts
export interface SalesRollingKpiColumn {
  period: RollingKpiPeriod;
  periodLabel: string;
  metrics: Record<string, KpiSegmentedCounts>; // 上と同じキー
}

export type SalesRollingKpiGrid = SalesRollingKpiColumn[];
```

UI は各セルに `total`、ツールチップまたは下段で `新規: n / 既存: m` を表示。

---

## 6. メンバー一覧が欠ける問題の修正

**原因**: `getDashboardSummary` の `byOwner` は**案件オーナーが少なくとも 1 件**いるユーザーだけが入る（`deal-repository.ts` の `ownerMap`）。

**要件**: 現在の事業部（`activeBusinessScope` → `businessUnitId`）に **`user_business_memberships` で active 所属しているユーザー**は全員、メンバービューに表示する。案件統計は 0 でもよい。

**実装案**:

- `getDashboardSummary` 内で `userBusinessMemberships` と `users` を join し、`byOwner` 用のリストを **`ownerMap` とマージ**（ユーザー ID をキーに、名前は `users.displayName`）。
- または専用クエリで `MemberRow[]` を返し、`MemberViewTabs` の props を `owners: DealOwnerStat[]` から **`MemberDashboardRow[]`** に拡張（推奨: 型を明確に）。

`getMonthlyActivityStats` も同様に「全メンバー分キーを返す」よう揃えると、カードの「今月活動」が欠けない。

---

## 7. UI 要件（簡潔）

### 7.1 個人ダッシュボード（`personal-kpi-progress.tsx`）

- 既存の「今月の KPI 達成状況（目標対比）」セクションは**残す**（`hasTargets` 時）。
- その下（または横タブ）に **「期間別実績（新規／既存）」** を追加。
  - 列: **今週 | 先週 | 今月 | 先月**
  - 行: 各 KPI 指標
  - セル: 合計＋内訳（例: `12 (新4/既8)`）

### 7.2 活動ダッシュボード（`sales-kpi-dashboard.tsx`）

- 列ヘッダを `日次/月次/四半期/年間` から **今週/先週/今月/先月** に変更。
- 各行のセルに **合計＋新規／既存**（個人と同パターン）。

### 7.3 メンバービュー（`member-view-tabs.tsx`）

- 全員表示後、必要なら **期間セレクト**（今週〜先月）でカード上の「活動数」を切り替え（初版は「今月のみ」でも可だが、仕様上は個人と揃えるのが理想）。

---

## 8. オープン項目（コードを書く前に決めると安全）

1. **`appointmentCount` の定義** — `kpi-repository.ts`（`deals.createdAt`）と `personal-kpi-repository.ts`（ステージ `APO_ACQUIRED`）のどちらに統一するか。
2. **チーム KPI のコール数** — `call_logs` を含めるか（個人と揃えるなら含める）。
3. **週次目標** — 不要なら KPI 設定画面は「月次のみ」の文言のまま。必要なら `user_kpi_targets` に週キー列を追加する設計が別途必要。

---

## 9. 受け入れ条件（チェックリスト）

- [ ] JST で今週／先週／今月／先月の境界が一貫している（ユニットテスト推奨）。
- [ ] 個人ダッシュで 4 期間すべてに、各 KPI の **total / new / existing** が表示される。
- [ ] 活動ダッシュの営業 KPI サマリーが同じ 4 期間・同じ指標キーで表示される。
- [ ] 事業部に所属し案件を持たないユーザーもメンバービューに表示され、活動 0 で表示される。
- [ ] 既存の月次目標プログレスと売上 KPI が従来どおり動作する（回帰）。
- [ ] 権限: 個人は `dashboard.kpi.read`、活動は `sales.deal.read`（現状踏襲）。

---

## 10. テストの指針

- `getRollingPeriodBounds` を JST 固定の日付スタブでテスト（年跨ぎ・月跨ぎ・週跨ぎ）。
- DB 統合テストがあれば、同一会社に 2 案件作り、2 件目の活動が `existing` になることを確認。

---

## 11. 参照: 旧 `KpiPeriod` 型

置き換え後は `getSalesKpi('daily' | 'quarterly' | 'yearly')` の呼び出しを削除または非推奨にし、`activity/page.tsx` の `Promise.all([getSalesKpi(...)])` を **4 回の rolling 取得**（または 1 関数でまとめて返す）に変更する。

---

*文書バージョン: 1.0 — 実装時は §8 の決定をコメントまたは ADR に残すこと。*
