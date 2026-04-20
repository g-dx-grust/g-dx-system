# Task 08: 活動登録統合ページ + 面談の変換フロー + ダッシュボード集計（Stage 2/2）

## 概要

Task 07 で実装した面談（meetings）基盤の上に、以下を追加する:

1. **活動登録統合ページ** `/sales/register`: タブUIで「商談 / アライアンス / 面談」を1画面から登録可能にする（既存の `/sales/deals/new` 等はそのまま残す）
2. **面談 → 商談/アライアンス 変換フロー**: 面談詳細から「商談に変換」「アライアンスに変換」ボタン。変換時にフォームへプリフィルし、変換後は元面談を履歴として残す
3. **活動ダッシュボード集計への組み込み**: `meetings` を VISIT/ONLINE 等の件数に合算しつつ、内訳（商談訪問 / アライアンス訪問 / 面談訪問）を表示
4. **サイドバー更新**: 営業管理配下に「活動登録統合」「面談」メニューを追加

## 前提条件

**Task 07 が完了・マージ済みであること。** 特に以下が揃っていること:

- `meetings` テーブル + Drizzle スキーマ（`packages/database/schema/sales.ts` の `meetings` export）
- 型定義 `MeetingItem`, `CreateMeetingRequest`, `MeetingActivityType`, `MeetingCounterpartyType`（`@g-dx/contracts`）
- 面談モジュール `apps/web/src/modules/sales/meeting/`（create/update/delete/list/get + server-actions + MeetingCreateForm）
- 面談ページ `/sales/meetings`（一覧/新規/詳細）
- SearchableSelect の `onCreate` オプション拡張

## 1. 活動登録統合ページ

### ルート — `apps/web/src/app/(protected)/sales/register/page.tsx`

- タブ形式の単一ページ（`'use client'` で tab state を保持）
- タブ: **商談 / アライアンス / 面談**
- URL クエリで初期タブを指定可能: `?tab=deal | alliance | meeting`（デフォルト: `deal`）
- 各タブには既存のフォームコンポーネントを embedded 表示

### 既存フォームコンポーネントの共通化

以下3つの create form が、単体ページ (`/sales/deals/new` 等) と統合ページ (`/sales/register`) の両方で使えるよう、データ取得ロジックと UI を分離する:

| フォーム | 既存ファイル | 変更内容 |
|---------|-------------|---------|
| 商談 | [apps/web/src/modules/sales/deal/ui/deal-create-form.tsx](apps/web/src/modules/sales/deal/ui/deal-create-form.tsx) | 既に Props 経由で option を受け取る作りなのでそのまま流用可 |
| アライアンス | [apps/web/src/modules/sales/alliance/ui/alliance-create-form.tsx](apps/web/src/modules/sales/alliance/ui/alliance-create-form.tsx) | Props ベースに変更（現状 Props なしなので不要なら最小限） |
| 面談 | `apps/web/src/modules/sales/meeting/ui/meeting-create-form.tsx`（Task 07 で作成済み） | そのまま流用 |

### データ取得

`/sales/register/page.tsx`（server component）で並列に取得:

- 商談用: 会社一覧 / ステージ / 獲得方法 / JET マスタ / アライアンス / ユーザー
- アライアンス用: （必要に応じて）
- 面談用: 会社一覧 / アライアンス / ユーザー

既存の `/sales/deals/new/page.tsx` のデータ取得ロジックを参考に、並列 `Promise.all` で取得してから各 Form component に渡す。

### UI レイアウト

```
┌────────────────────────────────────────────────┐
│  活動登録統合                                   │
│                                                 │
│  [ 商談 ]  [ アライアンス ]  [ 面談 ]            │ ← タブ
│  ─────────                                      │
│                                                 │
│  （選択タブに応じたフォーム）                    │
│                                                 │
└────────────────────────────────────────────────┘
```

- Tabs コンポーネントは `@/components/ui/tabs`（既存のはず。なければ Radix + Tailwind で実装）
- 各タブの submit 後は、既存の Server Action に従って該当詳細ページへリダイレクト（従来通り）

## 2. 面談 → 商談/アライアンス 変換フロー

### UI

面談詳細 `/sales/meetings/[meetingId]/page.tsx` に2つのボタン（既存の `ConvertActions` コンポーネントを新規作成）:

- **「商談に変換」** → `/sales/deals/new?fromMeeting={meetingId}` にリダイレクト
- **「アライアンスに変換」** → `/sales/alliances/new?fromMeeting={meetingId}` にリダイレクト

既に変換済みの場合（`convertedDealId` or `convertedAllianceId` が set）は、
- ボタンを無効化
- リンクバッジ「→ 商談: {案件名}」「→ アライアンス: {名前}」を表示

### プリフィル

`/sales/deals/new` と `/sales/alliances/new` のページコンポーネントで、
`searchParams.fromMeeting` があれば面談を load し、該当フィールドに defaultValue をセット:

| 面談フィールド | → 商談 | → アライアンス |
|----------------|--------|----------------|
| `companyId` | `companyId` | （アライアンス側は `name` に会社名を反映） |
| `contactName` | メモ/備考に転記 | `contactPersonName` |
| `contactRole` | - | `contactPersonRole` |
| `summary` | `memo` | `notes` |
| `nextActionDate` | `nextActionDate` | （なし） |
| `nextActionContent` | `nextActionContent` | （なし） |
| `meetingDate` | - | - |

**`DealCreateForm` / `AllianceCreateForm` に `defaults` prop を追加**して、defaultValue を受け取れるようにする。

### 変換完了時の紐付け処理

商談/アライアンス作成 Server Action (`createDealAction` / `createAllianceAction`) に、`formData` から `fromMeeting` を読み取る処理を追加:

```typescript
const fromMeetingId = readString(formData, 'fromMeeting');
// ...
if (fromMeetingId) {
    await updateMeeting({
        id: fromMeetingId,
        convertedDealId: result.id, // または convertedAllianceId
        convertedAt: new Date().toISOString(),
    }).catch(() => {});
}
```

プリフィル用のページ側フォームには hidden input で `fromMeeting` を埋め込む。

### 履歴の扱い

- 元の面談レコードは **削除しない**
- 面談一覧/詳細に「変換済み → 商談: xxx」のリンクバッジを出す
- 変換後も面談自体は編集可能

## 3. 活動ダッシュボード集計

### 対象ファイル

- [apps/web/src/app/(protected)/dashboard/activity/page.tsx](apps/web/src/app/(protected)/dashboard/activity/page.tsx)
- [apps/web/src/modules/sales/deal/application/get-monthly-activity-stats.ts](apps/web/src/modules/sales/deal/application/get-monthly-activity-stats.ts)
- [apps/web/src/modules/sales/deal/application/get-rolling-kpi.ts](apps/web/src/modules/sales/deal/application/get-rolling-kpi.ts)
- [apps/web/src/modules/sales/deal/ui/dashboard-activity.tsx](apps/web/src/modules/sales/deal/ui/dashboard-activity.tsx)
- 関連するリポジトリ関数（`deal-repository.ts` 内 or 類似）

### 集計ロジック変更

**方針: KPI の合計値は VISIT/ONLINE 等の活動種別で合算（見分けなし）、ただし内訳として「商談活動 / アライアンス活動 / 面談活動」の3ソースを表示可能に**。

現状 `dealActivities` + `allianceActivities` から取得している箇所に `meetings` を第3ソースとして加える:

```typescript
// meetings テーブルを読み、activityType ごとに集計
// meetings.meetingDate を activityDate と同等に扱う
// meetings.ownerUserId を userId と同等に扱う
// counterpartyType='COMPANY' → 会社系面談、'ALLIANCE' → アライアンス系面談、'NONE' → 独立面談
```

### 個人KPI（ローリングKPI）

`getRollingKpi` の訪問数 / オンライン数計算に `meetings` を合算:

- 新規/既存の分類は `meetings` にはカラムがない → **一律「新規」扱い**（面談は初回コンタクトが主な用途のため）
- あるいは `meetings.counterpartyType='NONE'` を「新規」、それ以外を「既存」として振り分ける

**要実装時確認**: どちらのロジックを採用するか、現行の `visitCategory` 判定ロジックを読んで自然に組み込める方を選択。判断に迷ったら「一律新規」で実装し、コメントを残す。

### 内訳表示（ダッシュボードUI）

`ActivityDashboard` / `AllMembersActivitySection` にて、訪問数セルなどに小さな内訳注記を追加:

```
訪問数: 12
  内訳: 商談 8 / アライアンス 2 / 面談 2
```

- 既存のカードレイアウトを崩さないよう、ツールチップまたは `<details>` で展開する形も可
- モバイル表示で冗長になりすぎないこと

### キャッシュキー

- `getMonthlyActivityStatsCacheKey` / `getRollingKpiCacheKey` はスコープ/月単位の既存構造を維持
- 面談作成/更新/削除時に、これらのキャッシュを purge する処理を `meeting/server-actions.ts` に追加（`deal/server-actions.ts` の `revalidateDashboardPaths` を参考、ロジック共通化を検討）

## 4. サイドバー更新

### 対象ファイル
- [apps/web/src/components/layout/sidebar.tsx](apps/web/src/components/layout/sidebar.tsx)

### 変更
営業管理セクションに以下を追加:

```
営業管理
├── 商談
├── アライアンス
├── 面談             ← 新規
├── 活動登録統合      ← 新規
└── ...
```

アイコンは既存の選定ルールに従う（Lucide icons など）。

## 受け入れ条件

- [ ] `/sales/register` で3タブ（商談/アライアンス/面談）が切替可能で、各タブから登録成功
- [ ] URL クエリ `?tab=alliance` で初期タブ指定が効く
- [ ] 面談詳細から「商談に変換」「アライアンスに変換」が押せ、プリフィル付きの新規作成フォームに遷移
- [ ] 変換後、元の面談に `convertedDealId` / `convertedAllianceId` が保存され、詳細にリンクバッジが出る
- [ ] 活動ダッシュボードで `meetings` の活動が VISIT/ONLINE 合計に加算される
- [ ] 個人KPIの訪問数/オンライン数にも面談が加算される
- [ ] 合計セルに内訳（商談/アライアンス/面談）が表示される
- [ ] 面談作成/更新/削除でダッシュボードキャッシュが purge される
- [ ] サイドバーに「活動登録統合」「面談」が表示され、クリックで遷移
- [ ] 既存の `/sales/deals/new`, `/sales/alliances/new`, `/sales/meetings/new` が単体でも動作
- [ ] `pnpm -w typecheck` と `pnpm -w lint` がパス

## 注意事項

- Task 07 の完了が前提。先に PR をマージしてから着手
- 既存の商談/アライアンス登録フロー（単体ページ）の UX は絶対に変更しない
- ダッシュボード集計ロジックは既存クエリの条件を読み込み、**面談を後乗せする形で加算**（既存集計の意味を変えない）
- 個人KPI の visit_category（NEW/REPEAT）判定について、面談での扱い方針は実装時に確定。判断の根拠はコメントに残す
- 変換時のプリフィルで `companyId` が面談側と異なる場合（ユーザーが変更した）、変換後の紐付けはユーザーが変更した値で確定（面談側は記録のみ）
- 統合ページのタブは URL 同期が望ましいが、簡易実装で `useState` のみでも可（将来的に `nuqs` 等を検討）
