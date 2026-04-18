# G-DX System Review

## Summary

今回のレビューでは、体感ラグにつながりやすい「同一リクエスト内の重複DBアクセス」「ダッシュボード集計の直列待ち」「検索時の無駄な再リクエスト」を優先して確認しました。

先に結論を書くと、重さの主因は次の3点でした。

1. `session` と `business unit` の取得が、同じ画面描画中に何度もDBへ飛んでいたこと
2. ダッシュボード集計が複数クエリを直列実行し、さらに次回アクションで N+1 クエリになっていたこと
3. 一覧/検索系で件数取得や検索APIが直列に待っており、入力中の古いリクエストも残っていたこと

## Implemented Fixes

### 1. Request-scoped cache for session and business unit

- Added: `apps/web/src/shared/server/business-unit.ts`
- Updated: `apps/web/src/shared/server/session.ts`
- Updated: `apps/web/src/modules/sales/shared/infrastructure/sales-shared.ts`
- Updated: `apps/web/src/modules/customer-management/shared/infrastructure/customer-shared.ts`

実装内容:

- `React cache()` を使って、同一リクエスト内では `getAuthenticatedAppSession()` を1回だけ実行するように変更
- `findBusinessUnitByScope()` も同様に共通化し、同じ画面内の重複SELECTを抑制
- `session` 内の membership / role 読み込みを `Promise.all` 化

期待効果:

- 画面遷移時やダッシュボード表示時の「最初の待ち時間」を短縮
- `layout` / `header` / application layer が同じ session を何度も読みに行く無駄を削減

### 2. Dashboard query parallelization and N+1 removal

- Updated: `apps/web/src/modules/sales/deal/infrastructure/deal-repository.ts`

実装内容:

- 案件一覧取得 (`listDeals`) の `rows` と `count` を並列化
- ダッシュボード集計 (`getDashboardSummary`) の
  - stage rows
  - all deals
  - active members
  - next action deals
  を `Promise.all` で並列化
- 次回アクションの「直近活動」を案件ごとに1件ずつ取る N+1 を廃止し、単一クエリ + メモリ集約に変更

期待効果:

- `/dashboard/deals` と `/dashboard/activity` の表示待ち時間短縮
- 案件件数が増えたときの劣化を抑制

### 3. Company list and global search optimization

- Updated: `apps/web/src/modules/customer-management/company/infrastructure/company-repository.ts`
- Updated: `apps/web/src/modules/search/infrastructure/search-repository.ts`
- Updated: `apps/web/src/components/layout/global-search-bar.tsx`

実装内容:

- 会社一覧の `rows` と `count` を並列化
- グローバル検索の company / contact / deal 検索を並列化
- 検索入力中の古いリクエストを `AbortController` でキャンセル
- 検索コンポーネント unmount 時の timer / request cleanup を追加

期待効果:

- `/customers/companies` の初回表示やキーワード検索が軽くなる
- ヘッダー検索で「前の入力結果が遅れて返る」現象を抑制

## Remaining Findings

### High: approvals / notifications の型契約が崩れていて、web typecheck が失敗している

対象:

- `apps/web/src/app/api/v1/approvals/route.ts`
- `apps/web/src/app/api/v1/notifications/route.ts`
- `apps/web/src/modules/approvals/application/list-approvals.ts`
- `apps/web/src/modules/notifications/application/list-notifications.ts`

内容:

- application layer が `Response['data']` の型を返す定義になっている一方、実際には `{ data, meta }` を返しています
- その結果、route 側では `result.data` / `result.meta` を参照しているのに型上は配列扱いになっており、`tsc` が失敗しています

影響:

- 現状の mainline では web 全体の typecheck が通らない
- 速度改善とは別ですが、今後の保守と安全なデプロイの大きな阻害要因です

### Medium: rolling KPI はまだ重い

対象:

- `apps/web/src/modules/sales/deal/infrastructure/rolling-kpi-repository.ts`
- `apps/web/src/modules/sales/deal/infrastructure/personal-kpi-repository.ts`

内容:

- 4期間分の rolling KPI を毎回オンデマンド集計しており、期間ごとに複数の raw SQL を発行しています
- `EXISTS` を含む相関サブクエリが多く、データ量が増えるほど `/dashboard/activity` と `/dashboard/personal` の応答時間が伸びやすい構造です

次の改善案:

- 日次または時間単位の集計テーブルを作る
- materialized view / pre-aggregation job に寄せる
- stage id lookup を request cache 化して小さなクエリ数も削る

### Medium: CSV import はまだ row-by-row transaction で遅くなりやすい

対象:

- `apps/web/src/modules/customer-management/company/infrastructure/company-repository.ts`

内容:

- `bulkCreateCompanies()` が各行ごとに select / insert / audit insert を順番に実行しています
- インポート件数が多いほど、待ち時間が線形に伸びやすいです

次の改善案:

- 既存会社の事前一括取得
- 新規作成候補の batch insert
- profile / audit も可能な範囲でまとめて投入

## Verification

実施:

- `.\node_modules\.bin\tsc.cmd -p apps/web/tsconfig.json --noEmit`

結果:

- 今回の修正起因の型エラーは解消
- ただし、approval / notification 周辺の既存型不整合により web 全体の typecheck は失敗

## Recommended Next Steps

1. approvals / notifications のレスポンス型を直して `tsc` をグリーン化する
2. rolling KPI を事前集計に寄せる
3. CSV import を batch 化する
