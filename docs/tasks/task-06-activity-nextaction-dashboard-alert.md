# Task 06: 活動記録・商談記録・次回アクション導線 + ダッシュボードアラート

## 概要
活動記録に商談フラグを追加し、活動入力後に次回アクション設定を促す導線を整備する。
ダッシュボードに漏れ検知アラートセクションを新設する。

---

## Part A: 活動記録への商談フラグ追加

### マイグレーション
```sql
ALTER TABLE deal_activities ADD COLUMN is_negotiation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE deal_activities ADD COLUMN negotiation_outcome TEXT; -- POSITIVE | NEUTRAL | NEGATIVE | PENDING
ALTER TABLE deal_activities ADD COLUMN competitor_info TEXT;
```

### スキーマ — `packages/database/schema/sales.ts`
`dealActivities` に追加:
```typescript
isNegotiation: boolean('is_negotiation').notNull().default(false),
negotiationOutcome: text('negotiation_outcome'), // POSITIVE | NEUTRAL | NEGATIVE | PENDING
competitorInfo: text('competitor_info'),
```

### 型定義 — `packages/contracts/src/sales.ts`
```typescript
export type NegotiationOutcome = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'PENDING';

// DealActivityItem に追加
export interface DealActivityItem {
    // ... 既存
    isNegotiation: boolean;
    negotiationOutcome: NegotiationOutcome | null;
    competitorInfo: string | null;
}
```

### UI — `deal-activity-log.tsx`
フォームに商談チェックボックスを追加。ONの場合に追加フィールド表示:
```
[種別 ▼] [日付] [面会数]
☐ 商談として記録
── 商談ON時のみ ──
[商談結果 ▼ (前向き/中立/後ろ向き/保留)]
[競合情報テキスト]
── ここまで ──
[内容テキストエリア]
[記録ボタン]
```

---

## Part B: 次回アクション設定導線

### 活動記録保存後のフロー
活動記録を保存した後、次回アクションが未設定の場合に警告を表示する:

**方式**: server action の redirect で `?activityAdded=1&noNextAction=1` パラメータを付与。
案件詳細画面で `noNextAction=1` の場合:
```
⚠️ 次回アクションが設定されていません。設定しますか？
[次回アクションを設定] [後で設定する]
```
- 「次回アクションを設定」→ 編集フォームの次回アクション欄にスクロール＆フォーカス
- 「後で設定する」→ 警告を閉じる

### Server Action 変更
`createDealActivityAction` 成功後:
1. 該当 deal の `nextActionDate` を確認
2. NULL の場合: redirect URL に `&noNextAction=1` を追加

---

## Part C: ダッシュボードアラートセクション

### 新規コンポーネント — `apps/web/src/modules/sales/deal/ui/dashboard-alerts.tsx`

```typescript
export interface DashboardAlert {
    type: 'NO_NEXT_ACTION' | 'OVERDUE_ACTION' | 'NO_OWNER' | 'STALE_DEAL' | 'SLA_EXCEEDED';
    severity: 'HIGH' | 'MEDIUM';
    dealId: string;
    dealName: string;
    companyName: string;
    ownerName: string | null;
    detail: string; // 例: "次回アクション未設定", "期限超過: 3日", "最終活動: 21日前"
}
```

### アラート条件と集計

| アラート種別 | 条件 | 深刻度 |
|---|---|---|
| `NO_NEXT_ACTION` | アクティブ案件 (`dealStatus='open'`) で `nextActionDate IS NULL` | HIGH |
| `OVERDUE_ACTION` | `nextActionDate < today` | HIGH |
| `NO_OWNER` | `ownerUserId IS NULL`（通常は起きないが安全策） | MEDIUM |
| `STALE_DEAL` | アクティブ案件で最新 `dealActivities.activityDate` が14日以上前 | MEDIUM |
| `SLA_EXCEEDED` | 現ステージの `slaDays` を超過（`dealStageHistory` の最新 `changedAt` + `slaDays` < today） | MEDIUM |

### リポジトリ — `deal-repository.ts`
新規関数 `getDashboardAlerts(businessScope): Promise<DashboardAlert[]>`:
- 上記5条件を1〜2クエリで集計
- MANAGER/ADMIN: 全メンバー分、OPERATOR: 自分の案件のみ（引数で制御）

### ダッシュボード組み込み
`apps/web/src/modules/sales/deal/ui/dashboard-deals.tsx` の先頭（メトリクスカードの上）にアラートセクションを追加:

```
┌─────────────────────────────────────────┐
│ ⚠️ 対応が必要な案件  (5件)              │
│                                         │
│ 🔴 次回アクション未設定 (3件)            │
│   ・ABC商事 - 新規導入案件               │
│   ・DEF株式会社 - リプレイス案件          │
│   ・GHI Corp - アップセル                │
│                                         │
│ 🔴 次回アクション期限超過 (1件)          │
│   ・JKL商事 - 初回提案 (3日超過)         │
│                                         │
│ 🟡 14日以上活動なし (1件)               │
│   ・MNO株式会社 - 見積検討中 (21日前)    │
└─────────────────────────────────────────┘
```

- 各案件名はリンク（案件詳細へ遷移）
- HIGH は赤アイコン、MEDIUM は黄アイコン
- 件数0の場合は「✅ 対応が必要な案件はありません」

### ダッシュボードページ
`apps/web/src/app/(protected)/dashboard/page.tsx`（or 該当ページ）で:
- `getDashboardAlerts(session.activeBusinessScope)` を呼び出し
- `DashboardAlerts` コンポーネントに渡す

---

## 実装の順序（この Task 内）
1. マイグレーション（商談フラグカラム追加）
2. スキーマ・型定義更新
3. リポジトリ・アプリケーション層更新（商談フィールドの保存・取得）
4. 活動フォームUI更新（商談チェック + 条件表示）
5. 次回アクション警告導線
6. ダッシュボードアラート（リポジトリ → コンポーネント → ページ組み込み）

## 注意事項
- Task 05（面会区分）と同じテーブル（`dealActivities`）にカラム追加するため、マイグレーションの番号が衝突しないよう注意
  - Task 05 と Task 06 を同時に実装する場合は、マイグレーションを1つにまとめるか、番号を分ける
- 活動フォームのクライアントコンポーネント化は Task 05 と共通（1回で済ませる）
- ダッシュボードアラートのクエリはパフォーマンス注意。インデックス `deals_updated_at_idx` と `deal_activities_deal_idx` を活用
- アラートの閾値（14日等）はハードコードで開始し、将来的に設定化を検討
