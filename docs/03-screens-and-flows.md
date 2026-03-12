## 1. Screen Design Principles

1. **業務処理は「一覧 → 詳細 → 実行」の3段階で完結させる**

   * 企業向け運用では、まず一覧で対象を絞り、詳細で確認し、実行操作を行う流れが最も迷いが少ない。
   * そのため各モジュールは、原則として `list / detail / form or action` の構成にする。

2. **shared master と business-scoped records をUI上でも明確に分離する**

   * `companies` と `contacts` は共通マスタとして扱う。
   * `deals` `calls` `contracts` は事業スコープ付きで扱う。
   * 画面上では、顧客詳細の上部に共通情報、下部に事業別の取引・架電情報を表示する構成にする。

3. **業務システムらしい、密度のあるテーブル中心UIにする**

   * ダッシュボード以外はカード乱用を避け、一覧画面はテーブル中心にする。
   * フィルタバー、検索、件数、ページネーション、列ソートを標準搭載する。
   * `sales_management` の商談のみ、必要に応じてテーブル優先＋簡易ボード切替を許容する。

4. **URLで状態を保持できる画面設計にする**

   * Next.js App Router 前提で、検索条件、ソート、ページ番号、アクティブタブ、business context は URL に反映する。
   * これにより、ADMINレビュー、引き継ぎ、ブックマーク、再現確認がしやすくなる。

5. **長い入力はフルページ、短い修正はドロワー/モーダルで処理する**

   * 新規登録や複数セクションの編集はフルページ。
   * 補助的な編集（担当者変更、ステータス変更、メモ追記など）は詳細画面からドロワーまたはモーダルで処理する。
   * これにより一覧文脈を壊しすぎず、実務速度を落とさない。

6. **権限不足は「見せない」「押せない」「理由が分かる」の順で制御する**

   * ページ自体に入れない場合はルートガードで制御する。
   * 閲覧は可だが操作不可の場合はボタン非表示または disabled にする。
   * disabled にする場合は理由テキストを必ず付ける。

7. **business context は常に視認できる**

   * ヘッダー固定位置に事業切替UIを置く。
   * 商談、契約、架電の作成時は、現在の business context をフォーム先頭に表示し、保存対象が曖昧にならないようにする。
   * `LARK_SUPPORT` と `WATER_SAVING` は内部値として扱い、表示ラベルは業務名称に置き換えてよい。

8. **詳細画面は「概要 + 関連履歴 + 監査導線」を標準化する**

   * どの詳細画面も、最低限 `summary / related records / activity or audit` を持つ。
   * 更新日時、更新者、最終アクションを画面上部で確認できるようにする。

9. **見た目は落ち着いた業務UIを徹底する**

   * フォントは `Noto Sans JP`。
   * 強いグラデーション、過剰なアニメーション、大きすぎるカード、不要な空白は避ける。
   * 色は状態・注意・成功の意味づけに限定し、普段はニュートラルな配色に寄せる。

---

## 2. Navigation Structure

### Global layout

* **左サイドバー**

  * Dashboard

    * Overview
    * Sales KPI
    * Call KPI
  * Customer Management

    * Contacts
    * Companies
  * Sales Management

    * Deals
    * Contracts
  * Call System

    * Call Queue
    * Call History

* **上部ヘッダー**

  * business switcher
  * パンくず
  * グローバル検索（company / contact / deal の横断検索）
  * ユーザーメニュー
  * ログイン状態表示（Larkユーザー名）

### Route structure

```text
/login
/auth/callback
/unauthorized

/dashboard
/dashboard/sales
/dashboard/calls

/customers/contacts
/customers/contacts/new
/customers/contacts/[contactId]

/customers/companies
/customers/companies/new
/customers/companies/[companyId]

/sales/deals
/sales/deals/new
/sales/deals/[dealId]

/sales/contracts
/sales/contracts/[contractId]

/calls/queue
/calls/workspace/[targetId]
/calls/history
/calls/[callId]
```

### Detail page tab standard

* **Contact Detail**

  * Overview
  * Related Deals
  * Call History
  * Activity

* **Company Detail**

  * Overview
  * Contacts
  * Related Deals
  * Call History
  * Activity

* **Deal Detail**

  * Overview
  * Stage History
  * Related Calls
  * Contract
  * Activity

* **Call Detail**

  * Summary
  * Linked Records
  * Notes
  * Audit

### Navigation rules

* 顧客系は shared master を中心に辿る。
* 売上・架電系は active business に強く依存する。
* 顧客詳細から「商談作成」「架電開始」へ遷移できるようにし、モジュール横断を許容する。
* ダッシュボードの各カード・指標は必ず対象一覧へドリルダウン可能にする。

---

## 3. Screen Inventory Table

| ID    | Route                              | Module              | Screen                         | Purpose                                              | Primary User         | Key Actions                      | Required Data                                                               | Permission Considerations                                                  |
| ----- | ---------------------------------- | ------------------- | ------------------------------ | ---------------------------------------------------- | -------------------- | -------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| G-01  | `/login`                           | shared              | Lark Sign-in Entry             | Lark OAuth 開始と利用可能状態の案内を行う                           | 全ユーザー                | Larkでログイン、再試行                    | Lark App情報、システム状態、メンテナンス状態                                                  | 認証前なので業務データは表示しない。許可された組織ユーザーのみ次へ進める                                       |
| G-02  | `/auth/callback`                   | shared              | Session Initialization         | OAuth code をセッション化し、ロール・business scope を読み込んで遷移先を決める | 全ユーザー                | 自動遷移、失敗時の再試行                     | OAuth state/code、ユーザープロファイル、role、business scopes、最終利用 business              | scope がない、無効ユーザー、停止ユーザーは `/unauthorized` へ遷移                               |
| G-03  | `/unauthorized`                    | shared              | Unauthorized / Access Denied   | アクセス不可理由を表示し、復帰導線を出す                                 | 権限不足ユーザー             | 前画面へ戻る、ADMINへ連絡                    | 不足権限種別、不足 business scope、現在ユーザー情報                                           | 署名済みユーザーにのみ表示。権限情報は必要最小限のみ表示                                               |
| D-01  | `/dashboard`                       | dashboard           | Dashboard Overview             | 当日・今週の重要指標、未処理件数、注意案件を一画面で把握する                       | OPERATOR, MANAGER, ADMIN | 期間変更、business 切替、対象一覧へドリルダウン     | KPI集計、未対応件数、担当者別件数、自分のタスク、アラート                                              | OPERATORは自分中心、MANAGERはチーム集計、ADMINは許可範囲全体を閲覧                                       |
| D-02  | `/dashboard/sales`                 | dashboard           | Sales KPI Dashboard            | 商談件数、ステージ別分布、受注率、売上見込みを分析する                          | MANAGER, ADMIN         | 絞り込み、並び替え、商談一覧遷移                 | 商談集計、担当別集計、ステージ別件数、金額合計、期間比較                                                | team/all 表示は manager 以上。金額関連は viewer 系ロールでマスク可能                            |
| D-03  | `/dashboard/calls`                 | dashboard           | Call KPI Dashboard             | 架電件数、接続率、結果内訳、折返し予定を分析する                             | MANAGER, ADMIN    | 絞り込み、履歴遷移、未対応キュー確認               | 架電ログ集計、結果別件数、担当別集計、callback 予定                                              | チーム集計は manager 以上。詳細メモや録音関連は権限別に制御                                         |
| C-01  | `/customers/contacts`              | customer_management | Contact List                   | 共有顧客担当者（個人）を検索・一覧管理する                                | OPERATOR, MANAGER     | 検索、フィルタ、詳細遷移、新規登録                | contact 一覧、電話・メール、所属 company、最終接触日、関連 business タグ                           | contact は shared だが、PII 表示はロールに応じてマスク可能。 bulk export は制限対象                 |
| C-02  | `/customers/contacts/new`          | customer_management | Contact Create/Edit            | contact の新規登録・編集を行う                                  | OPERATOR, ADMIN        | 入力、重複候補確認、company 紐付け、保存         | 入力フォーム、company 検索候補、重複候補、バリデーション                                            | `customer.company.create` または `customer.contact.create` 権限が必要。電話・メールの編集は上位権限で制御可能                      |
| C-03  | `/customers/contacts/[contactId]`  | customer_management | Contact Detail                 | contact の共通情報と、事業別の関連商談・架電状況を一元確認する                  | OPERATOR, MANAGER     | 編集、company 紐付け、商談作成、架電開始、履歴確認    | contact 基本情報、所属 company、関連 deals/calls/contracts 件数、activity timeline       | 共通プロフィールは shared 権限で表示。関連取引タブは active business かつ scope 内のみ表示              |
| C-04  | `/customers/companies`             | customer_management | Company List                   | 共有企業マスタを検索・一覧管理する                                    | OPERATOR, MANAGER, ADMIN      | 検索、フィルタ、詳細遷移、新規登録                | company 一覧、業種、所在地、主要担当者数、関連 business 状況                                     | company は shared。一覧表示は閲覧権限で可、エクスポートは manager 以上を推奨                         |
| C-05  | `/customers/companies/new`         | customer_management | Company Create/Edit            | company の新規登録・編集を行う                                  | OPERATOR, ADMIN             | 入力、重複候補確認、保存                     | company フォーム、重複候補、住所・業種などの候補値                                               | `customer.company.create` / `customer.company.update` 権限が必要                                         |
| C-06  | `/customers/companies/[companyId]` | customer_management | Company Detail                 | company 共通情報と、関連 contact・商談・架電の全体像を確認する              | OPERATOR, MANAGER     | 編集、contact 追加、商談作成、関連履歴確認        | company 基本情報、contact 一覧、関連 deals/calls/contracts 集計、activity                | company は shared 表示。商談・契約・架電は active business のみ詳細表示                       |
| S-01  | `/sales/deals`                     | sales_management    | Deal List                      | 事業別の商談一覧を管理し、進捗を追跡する                                 | OPERATOR, MANAGER        | 検索、フィルタ、ソート、詳細遷移、新規作成、担当変更       | deal 一覧、stage、金額、担当者、next action、company/contact、business                   | deal は business-scoped。active business 外の record は表示しない。担当変更は manager 権限推奨 |
| S-02  | `/sales/deals/new`                 | sales_management    | Deal Create/Edit               | 商談の新規作成・編集を行う                                        | OPERATOR, MANAGER        | business 指定、顧客紐付け、stage 設定、保存    | active business、company/contact lookup、stage 定義、担当者候補                       | 作成は active business に対してのみ許可。owner 再設定や金額更新は role で制御可能                    |
| S-03  | `/sales/deals/[dealId]`            | sales_management    | Deal Detail                    | 商談進行、履歴確認、関連架電確認、契約登録起点を担う                           | OPERATOR, MANAGER        | stage 更新、メモ追加、次回予定設定、契約登録、関連架電確認 | deal 基本情報、stage history、linked company/contact、related calls、activity、audit | deal は対象 business の権限必須。金額、見込み、ステージ巻き戻しは manager 制御が望ましい                   |
| S-04  | `/sales/contracts`                 | sales_management    | Contract List                  | 契約一覧を検索し、契約状態を管理する                                   | MANAGER, ADMIN         | 検索、フィルタ、詳細遷移、一覧出力                | contract 一覧、deal 紐付け、契約状態、開始日、終了日、金額                                        | contract は business-scoped。financial 情報は role に応じて表示制御                     |
| S-05  | `/sales/contracts/[contractId]`    | sales_management    | Contract Detail / Registration | 受注済み商談から契約を登録し、条件・状態を管理する                            | MANAGER, ADMIN         | 契約登録、編集、状態変更、履歴確認                | linked deal、customer snapshot、contract 項目、履歴、監査情報                           | 契約作成は受注済み deal のみ。編集・状態変更は manager 以上を推奨                                   |
| CL-01 | `/calls/queue`                     | call_system         | Call Queue                     | active business における架電対象を優先順で処理する                    | OPERATOR            | キュー取得、対象選択、次案件取得、callback 予約     | 対象リスト、優先度、最終結果、callback 予定、連絡先可否                                            | business-scoped の対象のみ表示。claim/assign ルールは role に依存                         |
| CL-02 | `/calls/workspace/[targetId]`      | call_system         | Active Call Workspace          | 架電実行、結果入力、次回対応設定を単一画面で行う                             | OPERATOR            | 架電、結果登録、メモ入力、callback 設定、商談化     | target プロフィール、最近の架電履歴、スクリプトメモ、結果候補、関連 deal                                  | 電話番号表示、結果確定、商談化は `call.log.create` 権限が必要。完了後修正は assignee/manager のみ許可                |
| CL-03 | `/calls/history`                   | call_system         | Call History List              | 過去架電履歴を検索し、結果確認や再対応判断に使う                             | OPERATOR, MANAGER          | 検索、結果フィルタ、詳細遷移、再コール対象抽出          | call log 一覧、結果、担当者、時間、関連顧客・商談、callback 状況                                   | history は business-scoped。詳細メモ、エクスポートは role によって制御                         |
| CL-04 | `/calls/[callId]`                  | call_system         | Call Detail                    | 単一架電記録の確認、品質レビュー、監査確認を行う                             | MANAGER, ADMIN    | 内容確認、関連レコード遷移、修正可否判断             | call metadata、notes、linked company/contact/deal、audit history               | 通常担当者は閲覧限定に留め、修正・再オープンは管理系ロールのみ許可が望ましい                                     |

---

## 4. Core User Flows

### F-01. Larkログインから業務開始まで

1. ユーザーが `/login` にアクセスする。
2. `Larkでログイン` を押下し、OAuth 認証を行う。
3. `/auth/callback` でセッションを確立し、`role` と `business scopes` を取得する。
4. 利用可能 scope が1つなら、その business を active にして `/dashboard` へ遷移する。
5. 利用可能 scope が複数なら、前回利用 business を active にして `/dashboard` へ遷移する。
6. scope がない、または停止ユーザーなら `/unauthorized` を表示する。

**実装ポイント**

* callback で business context を決定する。
* 初回ログイン時は last-used business がないため、許可済み scope の既定順で決定してよい。
* route guard はレイアウト層で統一する。

### F-02. 顧客検索から商談作成まで

1. ユーザーが `/customers/contacts` または `/customers/companies` を開く。
2. 名前、電話、メール、会社名で検索する。
3. 既存レコードがあれば詳細画面へ遷移する。
4. 既存レコードがなければ `/customers/contacts/new` または `/customers/companies/new` で新規作成する。
5. 保存後、詳細画面へ遷移する。
6. 詳細画面から `商談作成` を押下し、`/sales/deals/new` へ遷移する。
7. active business を確認し、商談内容を入力して保存する。
8. `/sales/deals/[dealId]` に遷移し、商談管理を開始する。

**実装ポイント**

* 新規登録時は重複候補を必ず提示する。
* 商談作成時は company/contact を prefill する。
* business が未選択にならないよう、active business を初期値固定にする。

### F-03. 顧客詳細から架電し、結果を記録するまで

1. ユーザーが `/customers/contacts/[contactId]` または `/customers/companies/[companyId]` を開く。
2. `架電開始` を押下する。
3. `/calls/workspace/[targetId]` を開き、対象プロフィール・直近履歴・スクリプトを確認する。
4. 架電実施後、結果、会話メモ、次回対応日を入力する。
5. 結果に応じて、callback 予約または商談化を行う。
6. 保存後、`/calls/history` または元の顧客詳細へ戻る。

**実装ポイント**

* 架電結果は標準化した result code を使う。
* 入力中に画面離脱する場合は unsaved changes 警告を出す。
* 商談化時は company/contact を引き継いで `/sales/deals/new` に遷移する。

### F-04. 架電キューから連続対応するまで

1. ユーザーが `/calls/queue` を開く。
2. active business の優先キューを確認する。
3. `次を取る` もしくは対象選択で `/calls/workspace/[targetId]` へ進む。
4. 架電結果を保存する。
5. 次回予約が必要なら callback 日時を設定する。
6. 商談化対象なら商談作成へ進む。
7. 保存後、再度 `/calls/queue` に戻り、次の対象を処理する。

**実装ポイント**

* queue 画面は連続処理を前提に、一覧から最短で workspace に入れる設計にする。
* callback 期限が近い対象は視覚的に強調する。
* 対象 claim の競合が起きるなら、楽観ロックまたは再取得処理を入れる。

### F-05. 商談進行から契約登録まで

1. ユーザーが `/sales/deals` で商談を絞り込む。
2. 対象の `/sales/deals/[dealId]` を開く。
3. stage を更新し、必要に応じてメモや次回アクションを記録する。
4. 受注に至ったら `契約登録` を押下する。
5. 契約登録後、`/sales/contracts/[contractId]` に遷移する。
6. 契約条件・開始日・状態を保存する。
7. 契約登録完了後、ダッシュボード・一覧に反映される。

**実装ポイント**

* 契約登録ボタンは `won` 相当 stage のときのみ有効にする。
* 契約は必ず元商談と紐づける。
* stage 履歴と契約登録履歴は監査対象として残す。

### F-06. MANAGERがKPIを確認し、現場に戻るまで

1. MANAGERが `/dashboard` を開く。
2. business と期間を切り替え、重要指標を確認する。
3. さらに詳細が必要なら `/dashboard/sales` または `/dashboard/calls` へ遷移する。
4. 異常値や対象チームを絞り込む。
5. 指標から対象一覧（`/sales/deals` / `/calls/history`）へドリルダウンする。
6. 個別 record を開き、必要に応じて担当変更、確認、指示を行う。

**実装ポイント**

* drilldown 時はフィルタ条件を引き継ぐ。
* KPI だけで閉じず、必ず action 可能な一覧・詳細へつながるようにする。

### F-07. 共通顧客を事業切替で確認するまで

1. ユーザーが contact または company 詳細を開く。
2. 画面上部で shared master 情報を確認する。
3. business switcher で `LARK_SUPPORT` と `WATER_SAVING` を切り替える。
4. 下部の関連商談、架電、契約サマリーが active business に応じて切り替わる。
5. 必要なら該当 business の商談または架電詳細へ遷移する。

**実装ポイント**

* 顧客の共通情報は切り替えで変えない。
* 取引・架電・契約の関連パネルのみ business context に追従させる。
* 権限のない business へは切替UI自体を表示しない。

---

## 5. Screen-Level Permission Notes

1. **画面アクセス制御は route 単位で行う**

   * `dashboard`, `sales_management`, `call_system` はルート進入時点で role と business scope を確認する。
   * 権限不足は 404 にせず `/unauthorized` に統一する。

2. **shared master 画面は「閲覧」と「操作」を分ける**

   * `companies` `contacts` は shared のため、閲覧可能ユーザーを広めに設定できる。
   * ただし新規作成、編集、削除相当操作は別権限で制御する。

3. **business-scoped 画面は active business と必ず一致させる**

   * `deals` `contracts` `calls` は active business に紐づく record だけを表示する。
   * URL 直打ちで他 business の record を開こうとしても拒否する。

4. **同一詳細画面の中でも、タブ単位で表示制御を行う**

   * 顧客詳細は見えても、`Related Deals` や `Call History` が見えない場合があり得る。
   * その場合はタブ非表示または権限メッセージ付き空状態を表示する。

5. **フィールド単位のマスク対象を明確にする**

   * phone、email、個人メモ、契約金額、見込み金額、ADMINメモは field-level control 対象候補。
   * 一覧と詳細で別々に制御できるようにする。

6. **一覧の一括操作は manager/admin 寄りにする**

   * bulk export、担当一括変更、契約状態一括更新は manager 以上を基本とする。
   * OPERATORは個別 record 操作中心に留める。

7. **架電ワークスペースは実行権限を最も厳密に見る**

   * 連絡先表示、結果確定、callback 登録、商談化を別々に制御できると運用しやすい。
   * 完了後の修正可否も role 別に分ける。

8. **ダッシュボードは role に応じて粒度を変える**

   * 担当者は自分の数字中心。
   * MANAGERは自チーム集計。
   * ADMINは許可された business 全体を表示。

---

## 6. Business Switching Behavior

1. **business switcher はグローバルヘッダー固定**

   * 複数 scope を持つユーザーにのみ表示する。
   * 単一 scope ユーザーには表示しない。

2. **初期 business は「前回利用値 > 既定値」の順で決定する**

   * 前回利用 business があればそれを復元する。
   * なければ許可済み scope の既定順で選ぶ。

3. **切替時の挙動は画面種別で変える**

   * `dashboard`, `deals`, `contracts`, `calls` は画面全体を business 再読み込みする。
   * `contacts`, `companies` は共通プロフィールは維持し、関連パネルだけ切り替える。

4. **作成画面では active business を初期値固定する**

   * `deals` `contracts` `calls` の新規作成は current active business で始める。
   * 作成途中の business 変更は原則禁止、もしくは確認ダイアログ付きにする。

5. **未保存変更がある場合は切替確認を出す**

   * 編集中・入力中に business を切り替える場合は confirm を挟む。
   * 破棄または保存後に切り替えさせる。

6. **deep link でも business context を復元可能にする**

   * `?business=LARK_SUPPORT` のような形でリンク共有可能にする。
   * その business に権限がなければ、許可済み既定 business にフォールバックする。

7. **All businesses 表示は限定的に許可する**

   * 原則として業務処理画面では `All` を持たせない。
   * 例外的に dashboard のみ、manager/admin 向けに `All permitted businesses` を許可してよい。

---

## 7. Empty/Error/Loading UX Rules

| Scenario       | Rule                                                           |
| -------------- | -------------------------------------------------------------- |
| 初回データなし        | 単なる「データがありません」ではなく、次の業務行動を示す。例: 「まだ商談がありません。顧客詳細から商談を作成してください」 |
| 検索結果なし         | 検索条件を保持したまま、「条件を広げる」「新規登録する」の両導線を出す                            |
| 権限不足           | 画面全体アクセス不可は `/unauthorized`。画面内機能不足は該当領域のみメッセージ表示にする           |
| business 不一致   | deep link 先が他 business の場合は、自動でフォールバックし、上部トーストで理由を伝える          |
| Loading（一覧）    | テーブルの行数・列幅に合わせた skeleton を表示する。ローディング中でもフィルタバーは極力残す            |
| Loading（詳細）    | summary 領域、関連タブ、履歴領域ごとに skeleton を出し、全画面スピナーは避ける               |
| 保存中            | ボタンを二重押下不可にし、保存対象名を含む進行状態を表示する。例: 「商談を保存中」                     |
| バリデーションエラー     | フィールド直下にエラー文を出し、ページ上部にも要約を出す。入力値は保持する                          |
| 重複候補検出         | 保存前に候補一覧を表示し、「既存を開く」「そのまま新規登録」を選ばせる                            |
| 通信エラー          | 自動再試行に依存せず、手動再試行を用意する。フォーム入力内容は失わせない                           |
| 架電ワークスペースでのエラー | 通話結果メモは一時保持し、通信失敗時も再送できるようにする                                  |
| 削除相当操作         | 物理削除よりも状態変更・無効化を優先し、破壊的操作は確認ダイアログ必須にする                         |

---

## 8. Recommended MVP Screen Order

1. **認証・共通土台**

   * `/login`
   * `/auth/callback`
   * `/unauthorized`
   * グローバルレイアウト
   * business switcher

   **理由**

   * すべての画面の前提になる。
   * role + business scope 制御の土台を最初に固定すべき。

2. **顧客共通マスタ**

   * `/customers/contacts`
   * `/customers/contacts/new`
   * `/customers/contacts/[contactId]`
   * `/customers/companies`
   * `/customers/companies/new`
   * `/customers/companies/[companyId]`

   **理由**

   * sales/calls の両方が依存する shared master。
   * 先に顧客基盤を作ると、その後の画面が組みやすい。

3. **商談の基本導線**

   * `/sales/deals`
   * `/sales/deals/new`
   * `/sales/deals/[dealId]`

   **理由**

   * 売上管理の核。
   * 顧客詳細から商談作成の導線を早期に成立させられる。

4. **架電の基本導線**

   * `/calls/queue`
   * `/calls/workspace/[targetId]`
   * `/calls/history`

   **理由**

   * 架電業務の実運用確認がしやすい。
   * 顧客・商談との連携価値が早く見える。

5. **契約管理**

   * `/sales/contracts`
   * `/sales/contracts/[contractId]`

   **理由**

   * 商談→契約のクローズドフローを完成させる。
   * 金額・状態管理などの厳格な権限制御を後追いで実装しやすい。

6. **ダッシュボード概要**

   * `/dashboard`

   **理由**

   * 先に業務データの入力・更新導線を作ってから集計画面を載せた方が、実データ前提で設計できる。

7. **ダッシュボード詳細と監督導線**

   * `/dashboard/sales`
   * `/dashboard/calls`
   * `/calls/[callId]`

   **理由**

   * manager/admin 向けの運用改善画面は、基礎業務フロー成立後に追加するのが安全。
   * drilldown と監査観点を後段で仕上げられる。
