# CRM改修 — 各チャット用プロンプト

以下のプロンプトをそれぞれ別の Claude Code チャットに貼り付けて実行してください。

> **注意**: Task 05 と Task 06 は `dealActivities` テーブルへのカラム追加が重複します。同時実行する場合はマイグレーション番号の衝突に注意してください。片方が先にマージされた後にもう片方をリベースするのが安全です。

---

## Prompt 1: 契約後活動記録 UI 実装

```
docs/tasks/task-01-contract-activity-ui.md を読んで、その仕様通りに実装してください。

## 背景
- このプロジェクトは G-DX という業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- DDD モジュール構造: application/ → domain/ → infrastructure/ → ui/ → server-actions.ts
- `contractActivities` テーブルはスキーマ済み（packages/database/schema/sales.ts:165-177）だが UI が未実装
- 参考パターン: 案件活動ログ（apps/web/src/modules/sales/deal/ui/deal-activity-log.tsx）が同等機能で実装済み

## 実装手順
1. packages/contracts/src/sales.ts に ContractActivityType, ContractActivityItem, CreateContractActivityRequest の型を追加
2. contract-repository.ts に listContractActivities と createContractActivity 関数を追加
3. application/create-contract-activity.ts を新規作成（権限チェック + リポジトリ呼び出し）
4. server-actions.ts に createContractActivityAction を追加
5. ui/contract-activity-log.tsx を新規作成（deal-activity-log.tsx を参考に。meetingCount は除外、activityType は VISIT|CALL|EMAIL|INTERNAL|OTHER）
6. contract-detail.tsx に ContractActivityLog を組み込み
7. 契約詳細ページ（app/(protected)/sales/contracts/[contractId]/page.tsx）でデータ取得して渡す

既存コードのパターン（readString, isAppError, revalidatePath, audit log）に従ってください。
マイグレーションは不要です（テーブルは存在済み）。
```

---

## Prompt 2: 案件担当者の編集 + 検索機能強化

```
docs/tasks/task-02-deal-owner-edit-search.md を読んで、その仕様通りに実装してください。

## 背景
- G-DX 業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- 案件（deals）の担当者は ownerUserId カラムに1名。UpdateDealInput に ownerUserId は既に型定義あり
- 案件一覧は keyword（テキスト検索）と stage（ドロップダウン）の2フィルタのみ
- DealListFilters（domain/deal.ts）には ownerUserId, companyId が既にあるがUI未接続

## 実装内容

### Part A: 担当者編集
1. 案件詳細ページ（app/(protected)/sales/deals/[dealId]/page.tsx）で同一 businessUnit のユーザー一覧を取得
2. deal-detail.tsx の DealDetailView props に users: UserOption[] を追加
3. 編集フォーム内に担当者セレクトボックスを追加（name="ownerUserId"、defaultValue=deal.ownerUser.id）
4. updateDealAction で ownerUserId を FormData から取得して updateDeal に渡す
5. リポジトリの updateDeal で ownerUserId が SET 対象に含まれているか確認、なければ追加

### Part B: 検索機能強化
1. DealListFilters に amountMin, amountMax, nextActionStatus, dealStatus を追加
2. deal-repository.ts の listDeals に新フィルタ条件を追加（金額範囲、次回アクション状態、ステータス）
3. deal-list.tsx のフォームを拡張: 担当者セレクト + 詳細検索（折りたたみ）に金額範囲・次回アクション状態・ステータス
4. 案件一覧ページで searchParams から新パラメータを読み取り、ユーザー一覧を取得して DealList に渡す
5. packages/contracts/src/sales.ts の DealListQuery にも型を同期追加

検索フォームの詳細検索部分はデフォルト折りたたみ（<details> タグ or useState）。
```

---

## Prompt 3: アライアンス管理機能

```
docs/tasks/task-03-alliance-management.md を読んで、その仕様通りに実装してください。

## 背景
- G-DX 業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- DDD モジュール構造に従う（application/ → domain/ → infrastructure/ → ui/ → server-actions.ts）
- 新規テーブル2つ（alliances, alliance_deal_links）とフルCRUD + 案件紐付けを実装
- 参考: 既存の CRM モジュール（会社一覧 apps/web/src/modules/customer-management/company/、契約 apps/web/src/modules/sales/contract/）

## 実装手順
1. packages/database/schema/sales.ts に alliances, allianceDealLinks テーブルを Drizzle で定義。schema/index.ts に export 追加
2. マイグレーション SQL を packages/database/migrations/ に作成（テーブル名は alliances, alliance_deal_links）
3. packages/contracts/src/sales.ts に AllianceType, AllianceStatus, AllianceReferralType, AllianceListItem, AllianceDetail, AllianceLinkedDeal 型を追加
4. packages/contracts/src/permissions/matrix.ts に alliance.read, alliance.create, alliance.update 権限を追加（VIEWER以上read、OPERATOR以上create/update）
5. apps/web/src/modules/sales/alliance/ モジュールを新規作成:
   - domain/alliance.ts（型定義）
   - infrastructure/alliance-repository.ts（CRUD + 案件リンク）
   - application/（list, get-detail, create, update, link-deal, unlink-deal）
   - ui/alliance-list.tsx, alliance-detail.tsx, alliance-create-form.tsx
   - server-actions.ts
6. ページルーティング: app/(protected)/sales/alliances/ に page.tsx, new/page.tsx, [allianceId]/page.tsx
7. サイドナビに「アライアンス」メニュー項目を追加
8. 案件詳細画面（deal-detail.tsx）にアライアンス紐付けセクションを追加（紐付き一覧 + 紐付けボタン + 解除）
9. 案件作成フォームにアライアンスセレクトを任意で追加

UI は既存の CRM 画面（カードベース、バッジ、テーブル）と統一してください。
双方向参照: アライアンス詳細→紐付き案件一覧、案件詳細→紐付きアライアンス一覧。
```

---

## Prompt 4: 契約後ガントチャート

```
docs/tasks/task-04-contract-gantt-chart.md を読んで、その仕様通りに実装してください。

## 背景
- G-DX 業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- 契約後の進行管理をガントチャートで可視化する
- 外部ライブラリは使わず、CSS Grid + Tailwind で自前実装

## 実装手順
1. packages/database/schema/sales.ts に contractMilestones, contractMilestoneTemplates テーブルを追加
2. マイグレーション SQL を作成
3. packages/contracts/src/sales.ts に MilestoneType, MilestoneStatus, ContractMilestoneItem, ContractGanttData 型を追加
4. apps/web/src/modules/sales/contract/ 配下に:
   - infrastructure/milestone-repository.ts（CRUD: list, create, update, delete）
   - application/list-milestones.ts, create-milestone.ts, update-milestone.ts, delete-milestone.ts
   - server-actions.ts に createMilestoneAction, updateMilestoneAction, deleteMilestoneAction を追加
5. ui/contract-gantt.tsx（'use client'）:
   - CSS Grid ベースのガントチャート
   - 横軸=日付（週単位グリッド線）、縦軸=マイルストーン（sortOrder順）
   - 色分け: SALES_ACTION=青, BUILD_ACTION=緑, DEV_ACTION=紫
   - ステータス: NOT_STARTED=点線枠, IN_PROGRESS=半透明バー, COMPLETED=ソリッド, BLOCKED=赤枠
6. ui/milestone-form.tsx — マイルストーン追加/編集フォーム
7. contract-detail.tsx に「進行状況」セクションを追加（ガント表示 + マイルストーン管理UI）
8. 契約詳細ページでマイルストーンデータを取得して渡す

初期実装では横断ビュー（全契約一覧ガント）とテンプレート機能は不要です。
契約詳細画面内のマイルストーン管理 + ガント表示に集中してください。
```

---

## Prompt 5: 面会区分（新規/リピート、個人/法人）

```
docs/tasks/task-05-meeting-category.md を読んで、その仕様通りに実装してください。

## 背景
- G-DX 業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- dealActivities テーブルに面会区分フィールドを追加し、KPI集計で新規面会のみカウントできるようにする
- 現在の活動フォーム: apps/web/src/modules/sales/deal/ui/deal-activity-log.tsx

## 実装手順
1. マイグレーション: deal_activities に visit_category (TEXT, nullable) と target_type (TEXT, nullable) を追加
2. packages/database/schema/sales.ts の dealActivities に visitCategory, targetType を追加
3. packages/contracts/src/sales.ts に VisitCategory, MeetingTargetType 型を追加。DealActivityItem, CreateDealActivityRequest に追加
4. deal-repository.ts の createDealActivity に visitCategory, targetType を追加。listDealActivities の select にも追加
5. deal-activity-log.tsx を変更:
   - フォーム部分を 'use client' コンポーネント（ActivityForm）に切り出し
   - 種別が VISIT or ONLINE の場合のみ「新規/リピート」「個人/法人」セレクトを表示
   - デフォルト: visitCategory=REPEAT, targetType=CORPORATE（安全側）
   - DealActivitySidebarForm にも同じ変更を適用
6. 活動一覧表示に区分バッジ追加（NEW=青, REPEAT=灰, INDIVIDUAL/CORPORATE 小テキスト）
7. server-actions.ts の createDealActivityAction で visitCategory, targetType を FormData から取得
8. KPI集計ロジックの修正:
   - newVisitCount → visit_category = 'NEW' でフィルタ（NULL は REPEAT 扱い）
   - visitCount → 全件（変更なし）
   - 該当する集計関数を deal-repository.ts 内で特定して修正

⚠️ Task 06 と同時実装する場合、マイグレーションの番号衝突に注意してください。
```

---

## Prompt 6: 活動記録・商談記録・次回アクション導線 + ダッシュボードアラート

```
docs/tasks/task-06-activity-nextaction-dashboard-alert.md を読んで、その仕様通りに実装してください。

## 背景
- G-DX 業務管理システム（Next.js 14 App Router + Drizzle ORM + PostgreSQL）
- 活動記録に商談フラグを追加し、活動入力後に次回アクション未設定を警告する
- ダッシュボードに漏れ検知アラートを追加する

## 実装手順

### Part A: 商談フラグ
1. マイグレーション: deal_activities に is_negotiation (BOOLEAN DEFAULT false), negotiation_outcome (TEXT), competitor_info (TEXT) を追加
2. スキーマ・型定義を更新（NegotiationOutcome型、DealActivityItem に isNegotiation/negotiationOutcome/competitorInfo）
3. deal-repository.ts の createDealActivity / listDealActivities を更新
4. deal-activity-log.tsx のフォームに商談チェックボックス追加。ON時のみ商談結果セレクト + 競合情報テキスト表示
5. server-actions.ts の createDealActivityAction に商談フィールド追加

### Part B: 次回アクション警告
1. createDealActivityAction 成功後、deal の nextActionDate を確認。NULL なら redirect URL に &noNextAction=1 を追加
2. deal-detail.tsx で noNextAction=1 パラメータを受け取り、警告バナーを表示
3. 「次回アクションを設定」ボタンで編集フォームの該当欄にスクロール

### Part C: ダッシュボードアラート
1. deal-repository.ts に getDashboardAlerts 関数を新規追加:
   - NO_NEXT_ACTION: active deal で nextActionDate IS NULL
   - OVERDUE_ACTION: nextActionDate < today
   - STALE_DEAL: 最新活動が14日以上前
   - SLA_EXCEEDED: ステージ滞留日数がslaDays超過
2. ui/dashboard-alerts.tsx コンポーネントを新規作成（アラート一覧表示、案件リンク付き）
3. dashboard-deals.tsx の先頭にアラートセクションを組み込み
4. ダッシュボードページでアラートデータを取得して渡す

ロール別表示: ADMIN/MANAGER → チーム全体、OPERATOR → 自分の案件のみ。

⚠️ Task 05 と同時実装する場合、dealActivities へのカラム追加マイグレーションが重複します。マイグレーション番号を分けるか、1つにまとめてください。
```

---

## 並行実行時の依存関係

```
Task 01 (契約活動UI)      ── 独立、他と衝突なし
Task 02 (担当者+検索)     ── 独立、他と衝突なし
Task 03 (アライアンス)     ── 独立（マイグレーション番号のみ注意）
Task 04 (ガントチャート)   ── 独立（マイグレーション番号のみ注意）
Task 05 (面会区分)         ── ⚠️ Task 06 と dealActivities カラム追加が重複
Task 06 (商談+アラート)    ── ⚠️ Task 05 と dealActivities カラム追加が重複
```

**推奨**: Task 05 → Task 06 の順でマージ。または同一チャットで実装してマイグレーションを1つにまとめる。
