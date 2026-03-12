# 1. Permission Design Principles

G-DXの権限制御は、**RBAC（Role-Based Access Control）** と **business scope constraints（事業スコープ制約）** を組み合わせて実装する。
ロールは「何ができるか」を決め、事業スコープは「どの事業データに触れられるか」を決める。
この2つを分離しないと、将来的に `LARK_SUPPORT` 担当の管理者、`WATER_SAVING` のオペレーター、両事業横断の経営層などを正しく表現できない。

実装方針は以下とする。

* 認証はLark OAuthのみ
* 認可はサーバー側で強制する
* UI制御は補助であり、権限判定の本体ではない
* ロールと事業スコープは別テーブルで管理する
* 顧客マスタは共有可能
* 案件、架電、契約、活動履歴は事業スコープ必須
* 一覧権限、詳細権限、作成権限、更新権限、削除権限、出力権限を分ける
* 必要箇所では field-level 制御を入れる
* 削除は原則論理削除とし、物理削除権限は持たせない
* 監査対象操作は必ず記録する

権限判定の基本式は以下。

`allow = role_permission && business_scope_match && record_visibility_rule`

ここでの `business_scope_match` は、対象データの事業スコープが、ユーザーに付与された事業スコープ集合に含まれるかで判定する。

# 2. Roles Definition

## 2.1 Core Roles

G-DXの標準ロールは以下の5つとする。

### `SUPER_ADMIN`

全権限を持つ。
全モジュール、全事業、全データ、全設定にアクセス可能。
初期構築、障害対応、監査対応、権限設計変更の責任者向け。

### `ADMIN`

業務管理者ロール。
ユーザー管理、権限設定、マスタ管理、データ補正、CSV入出力、各モジュールの通常業務管理が可能。
ただし、アクセス可能な事業データは付与された business scope に制限される。

### `MANAGER`

部門責任者ロール。
担当範囲の案件、顧客、架電、契約、集計を管理できる。
一般的には承認、状況確認、配下メンバーの進捗管理、集計確認に使う。
システム管理設定やユーザー管理は不可。

### `OPERATOR`

実務担当ロール。
案件登録、顧客更新、架電記録、契約の一部更新など、日常オペレーションを担当する。
組織設定、権限設定、全件エクスポート、大規模データ補正は不可。

### `VIEWER`

閲覧専用ロール。
一覧、詳細、ダッシュボード参照は可能だが、作成・更新・削除・インポートは不可。
経営層、監査、外部閲覧用途を想定。

## 2.2 Optional Internal Sub-Roles

将来的に必要になれば以下を派生ロールとして追加できるが、初期ベースラインには含めない。

* `CALL_OPERATOR`
* `SALES_OPERATOR`
* `AUDITOR`
* `DATA_STEWARD`

初期はロール数を増やしすぎず、5ロールで開始する。

## 2.3 Role Responsibility Boundaries

ロールごとの境界は以下。

* `SUPER_ADMIN`: システム全体責任
* `ADMIN`: 業務運用責任
* `MANAGER`: 部門管理責任
* `OPERATOR`: 実務入力責任
* `VIEWER`: 閲覧責任のみ

# 3. Business Scope Rules

## 3.1 Scope Assignment

各ユーザーには0個以上の事業スコープを割り当てる。
有効ユーザーは最低1つの事業スコープを持つこと。

有効値:

* `LARK_SUPPORT`
* `WATER_SAVING`

両方にアクセス可能なユーザーは、`BOTH` という単一値ではなく、2件のスコープ付与で表現する。

## 3.2 Scope Evaluation

レコードアクセス可否は以下で判定する。

* 顧客共有マスタ

  * company/contact自体は共有参照可能
  * ただし関連する案件、契約、架電は別途スコープ判定
* 事業スコープ付きトランザクション

  * deals.business_scope
  * contracts.business_scope
  * call_logs.business_scope
  * activities.business_scope

ユーザーが `LARK_SUPPORT` のみなら、`WATER_SAVING` の案件・契約・架電は参照不可。

## 3.3 Scope During Create

作成時は必ず対象レコードに事業スコープを設定する。
ユーザーが複数スコープを持つ場合、UIで明示選択させる。
自分に未付与のスコープでは作成できない。

## 3.4 Scope During Update

更新時にレコードの事業スコープが自分の付与範囲外なら更新不可。
また、既存レコードの business_scope 変更は一般操作として許可しない。
business_scope変更は `ADMIN` 以上の特権操作とし、監査ログ必須とする。

# 4. Permission Matrix Table

## 4.1 Permission Codes

以下の略記を使う。

* `Y` = 許可
* `C` = 条件付き許可
* `N` = 不可

条件付き許可の代表例:

* 自分の事業スコープ内のみ
* 自分の担当/チーム範囲のみ
* 一部フィールドのみ
* 論理削除のみ

## 4.2 Matrix

| Module              | Resource             |                          Action | SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER | Notes            |
| ------------------- | -------------------- | ------------------------------: | ----------: | ----: | ------: | -------: | -----: | ---------------- |
| auth                | session/profile      |               view self profile |           Y |     Y |       Y |        Y |      Y | 自分のログイン情報確認      |
| auth                | session/profile      | update self profile preferences |           Y |     Y |       Y |        Y |      N | 業務影響のない個人設定のみ    |
| authorization       | users                |                      list users |           Y |     Y |       N |        N |      N | 業務ユーザー一覧         |
| authorization       | users                |                view user detail |           Y |     Y |       N |        N |      N | ロール/スコープ含む       |
| authorization       | users                |             create user linkage |           Y |     Y |       N |        N |      N | Lark認証済ユーザーの利用許可 |
| authorization       | users                |               update role/scope |           Y |     Y |       N |        N |      N | 監査ログ必須           |
| authorization       | users                |                    disable user |           Y |     Y |       N |        N |      N | 論理無効化のみ          |
| customer_management | companies            |                            list |           Y |     Y |       Y |        Y |      Y | 共有マスタ            |
| customer_management | companies            |                     view detail |           Y |     Y |       Y |        Y |      Y | 関連データは別途制御       |
| customer_management | companies            |                          create |           Y |     Y |       Y |        Y |      N | 重複チェック必須         |
| customer_management | companies            |             update basic fields |           Y |     Y |       C |        C |      N | C=責任範囲のみ         |
| customer_management | companies            |                 merge duplicate |           Y |     Y |       N |        N |      N | 高リスク操作           |
| customer_management | companies            |                          delete |           C |     C |       N |        N |      N | C=論理削除のみ         |
| customer_management | contacts             |                            list |           Y |     Y |       Y |        Y |      Y | 共有マスタ            |
| customer_management | contacts             |                     view detail |           Y |     Y |       Y |        Y |      Y | 個人情報マスキングあり      |
| customer_management | contacts             |                          create |           Y |     Y |       Y |        Y |      N | 会社紐付けあり          |
| customer_management | contacts             |             update basic fields |           Y |     Y |       C |        C |      N | C=責任範囲のみ         |
| customer_management | contacts             |                          delete |           C |     C |       N |        N |      N | 論理削除のみ           |
| customer_management | business relations   |                   create/update |           Y |     Y |       C |        C |      N | 事業接点登録           |
| sales_management    | deals                |                            list |           Y |     Y |       Y |        Y |      Y | 事業スコープ判定必須       |
| sales_management    | deals                |                     view detail |           Y |     Y |       Y |        Y |      Y | 事業スコープ判定必須       |
| sales_management    | deals                |                          create |           Y |     Y |       Y |        Y |      N | scope必須          |
| sales_management    | deals                |             update stage/status |           Y |     Y |       Y |        C |      N | C=自担当/担当範囲のみ     |
| sales_management    | deals                |    update amount/contract terms |           Y |     Y |       C |        C |      N | 承認対象にしてもよい       |
| sales_management    | deals                |                  reassign owner |           Y |     Y |       Y |        N |      N | 担当変更             |
| sales_management    | deals                |           change business_scope |           Y |     C |       N |        N |      N | C=監査ログ必須         |
| sales_management    | deals                |                  logical delete |           Y |     C |       N |        N |      N | 原則無効化            |
| sales_management    | contracts            |                            list |           Y |     Y |       Y |        C |      Y | C=自担当/閲覧範囲のみ     |
| sales_management    | contracts            |                     view detail |           Y |     Y |       Y |        C |      Y | 金額マスキング条件あり      |
| sales_management    | contracts            |                          create |           Y |     Y |       Y |        C |      N | C=案件から生成のみ可      |
| sales_management    | contracts            |      update non-critical fields |           Y |     Y |       C |        C |      N | メモ、添付、進行状況など     |
| sales_management    | contracts            |          update critical fields |           Y |     Y |       C |        N |      N | 契約金額、締結日、契約先等    |
| sales_management    | contracts            |           logical delete/cancel |           Y |     C |       C |        N |      N | 解約/取消は履歴化        |
| call_system         | call_tasks           |                            list |           Y |     Y |       Y |        Y |      Y | 事業スコープ判定必須       |
| call_system         | call_tasks           |                          create |           Y |     Y |       Y |        Y |      N | 自スコープ内のみ         |
| call_system         | call_tasks           |                 assign/reassign |           Y |     Y |       Y |        N |      N | オペレーターは不可        |
| call_system         | call_logs            |                            list |           Y |     Y |       Y |        Y |      Y | 事業スコープ判定必須       |
| call_system         | call_logs            |                     view detail |           Y |     Y |       Y |        Y |      Y | 録音/詳細メモは別制御可     |
| call_system         | call_logs            |                          create |           Y |     Y |       Y |        Y |      N | 実施記録             |
| call_system         | call_logs            |           update result/outcome |           Y |     Y |       Y |        C |      N | C=自分の記録のみ当日修正可   |
| call_system         | call_logs            |                          delete |           Y |     C |       N |        N |      N | 原則論理削除のみ         |
| call_system         | call_results master  |                          manage |           Y |     Y |       N |        N |      N | 結果区分マスタ          |
| dashboard           | KPI summary          |                 view scoped KPI |           Y |     Y |       Y |        Y |      Y | スコープ制御必須         |
| dashboard           | team performance     |                            view |           Y |     Y |       Y |        C |      C | C=自チームまたは自分のみ    |
| dashboard           | company-wide summary |                            view |           Y |     Y |       C |        N |      C | C=付与対象のみ         |
| dashboard           | raw drill-down       |              view detail source |           Y |     Y |       Y |        Y |      C | C=閲覧元権限に従う       |
| integrations        | Lark sync jobs       |                     view status |           Y |     Y |       N |        N |      N | 運用管理向け           |
| integrations        | Lark sync jobs       |                   execute/retry |           Y |     Y |       N |        N |      N | 高権限のみ            |
| audit               | audit logs           |                            view |           Y |     Y |       N |        N |      N | 権限変更、重要更新の履歴     |
| audit               | audit logs           |                          export |           Y |     C |       N |        N |      N | C=管理目的のみ         |

## 4.3 Field-Level Restrictions

以下は field-level 制御の必須対象。

### companies / contacts

* 電話番号
* メールアドレス
* 個人名
* 備考
* 内部評価ランク

制御方針:

* `VIEWER` は個人情報の一部マスキングを許可可能
* `OPERATOR` 以上は通常表示
* 特記事項や内部評価は `MANAGER` 以上のみ閲覧可とする選択も可能

### deals

* 金額
* 粗利
* 見積条件
* 失注理由
* 内部メモ

制御方針:

* `VIEWER` は金額閲覧可否を設定可能
* `OPERATOR` は内部メモの一部のみ編集可
* business_scope変更は `ADMIN` 以上のみ

### contracts

* 契約金額
* 契約締結日
* 契約書番号
* 契約ステータス
* 解約理由

制御方針:

* 契約の重要項目は `MANAGER` 以上中心
* `OPERATOR` は補助項目のみ更新可

### call_logs

* 通話メモ
* 結果区分
* 次回予定
* 録音URL
* クレーム判定

制御方針:

* 録音URLやセンシティブメモは `MANAGER` 以上のみでもよい
* `OPERATOR` は自分が記録した内容の当日修正のみ可

# 5. Record Visibility Rules

## 5.1 Shared Customer Master Visibility

`companies` と `contacts` は共有マスタであるため、基本は全事業ユーザーが一覧・詳細参照可能とする。
ただし、関連する事業活動の表示は権限に応じて絞る。

例:

* `LARK_SUPPORT` のみのユーザーが会社詳細を開く
* 会社自体は見える
* その会社に紐づく `WATER_SAVING` 案件一覧は見えない
* `LARK_SUPPORT` の案件のみ見える

## 5.2 Transaction Visibility

以下は必ず business scope 制御する。

* deals
* contracts
* call_tasks
* call_logs
* activities

判定ルール:

* レコードの `business_scope` が自分の付与スコープに含まれること
* 追加で owner/team 制限がある場合はそれも満たすこと

## 5.3 Ownership / Team Filters

将来の拡張を見込み、一覧APIは以下のフィルタレイヤを持つ。

* business scope filter
* owner filter
* team filter
* status filter

初期ポリシー:

* `MANAGER` 以上は自スコープ内のチーム横断参照を許可
* `OPERATOR` は自担当または自チームまでに制限可能
* `VIEWER` は閲覧目的に応じて自スコープ集計のみ

## 5.4 Cross-Business Shared Customer Case

同じ会社が両事業に存在するケースでは、会社詳細の中に事業タブを設ける。
ユーザーは自分の許可された事業タブのみ中身を見られる。

# 6. Create/Update/Delete Rules

## 6.1 Create Rules

* 作成対象が事業スコープ付きデータなら `business_scope` 必須
* ユーザーは自分に付与された scope のみ指定可能
* 顧客マスタ登録時は重複チェック必須
* 契約作成は原則案件起点とし、孤立契約を乱立させない
* 作成時の `created_by` `created_at` は自動記録

## 6.2 Update Rules

更新は以下の3区分で分ける。

### Basic Update

軽微項目更新。
例:

* 顧客基本情報
* 案件メモ
* 架電メモ
* 次回予定

`OPERATOR` 以上で可とする項目が多い。

### Controlled Update

業務影響が大きい更新。
例:

* 案件ステータス変更
* 契約進捗変更
* 顧客の重要属性変更

`MANAGER` または条件付き `OPERATOR`

### Critical Update

監査・金額・法務に影響する更新。
例:

* 契約金額
* business_scope変更
* 契約取消
* ユーザー権限変更
* 会社統合

`ADMIN` 以上を原則とする。

## 6.3 Delete Rules

削除は原則論理削除。

* `OPERATOR` は削除不可
* `MANAGER` は通常削除不可、または限定的取消のみ
* `ADMIN` は論理削除可
* `SUPER_ADMIN` は監査上必要な範囲で管理可能

削除時の必須項目:

* deleted_at
* deleted_by
* delete_reason

物理削除はバックオフィス保守手順に限定し、通常業務権限には含めない。

## 6.4 Reopen / Restore Rules

論理削除や取消を戻す操作は `ADMIN` 以上のみ。
契約や案件の復元は監査ログ必須。

# 7. Export/Import Rules

## 7.1 Export Rules

エクスポートは情報漏えいリスクが高いため、閲覧権限とは別に制御する。

推奨ポリシー:

* `SUPER_ADMIN`: 全出力可
* `ADMIN`: 自スコープ内の詳細出力可
* `MANAGER`: 集計出力可、詳細出力は条件付き
* `OPERATOR`: 原則不可、または自担当データのみ簡易出力
* `VIEWER`: 原則不可

出力種別を分ける。

* summary export
* detailed export
* personal data export
* audit export

## 7.2 Import Rules

インポートは `ADMIN` 以上を原則とする。
顧客一括登録や案件一括投入は高リスクのため、`OPERATOR` に開放しない。

インポート時の必須制御:

* 対象モジュール別テンプレート固定
* business_scope列の明示
* 重複チェック
* エラー行レポート
* dry-run
* 実行履歴保存

## 7.3 Export Scope Policy

出力対象は、画面上の見え方ではなく、サーバー側で scope 判定した結果のみ許可する。
フィルタ改ざんやURL直打ちでは越境取得できないこと。

# 8. Dashboard Visibility Rules

## 8.1 Dashboard Is Not Free Pass

ダッシュボードは集計画面であって、元データ権限を超えて見えてよいわけではない。
必ず事業スコープとロールに従う。

## 8.2 KPI Levels

ダッシュボードは3段階で制御する。

### Personal KPI

自分の件数、活動数、成約数など。
`OPERATOR` 以上は基本利用可。

### Team KPI

チーム別件数、担当別比較、進捗比較など。
`MANAGER` 以上を基本とする。
`OPERATOR` は自チームの限定ビューのみ許可してもよい。

### Business KPI

事業全体の売上、案件数、架電量、契約率など。
`ADMIN` と `MANAGER` を基本対象。
`VIEWER` は必要に応じて閲覧専用で可。

## 8.3 Drill-Down Rules

グラフや件数から明細へ遷移するときは、遷移先でも通常の一覧権限を再適用する。
集計だけ見えて明細は見えない、という状態は許可される。

## 8.4 Sensitive KPI

以下はセンシティブ指標として扱う。

* 粗利
* 契約単価
* 失注理由分析
* 担当者成績ランキング
* クレーム率

これらは `MANAGER` 以上中心に限定する。

# 9. Edge Cases

## 9.1 One Shared Company, Two Business Pipelines

同一会社に `LARK_SUPPORT` 案件と `WATER_SAVING` 案件が両方存在する場合、
会社詳細は見えても、事業別トランザクションは自分のスコープ内のみ表示する。
会社名検索で相手の存在が見えても、権限外の案件件数や契約金額は出さない。

## 9.2 User With Two Scopes but One Role

両事業スコープを持つ `OPERATOR` は、両事業の実務入力はできるが、管理権限までは得ない。
スコープが広いことと、権限が強いことは別。

## 9.3 Manager Without Scope

`MANAGER` ロールでも事業スコープ未付与なら業務データにはアクセス不可。
ロールのみで閲覧を通さない。

## 9.4 Scope Change After Record Creation

ユーザーから事業スコープを剥奪した後、そのユーザーが過去に作成した他事業データは閲覧不可になる。
作成者であることは永続閲覧権にはならない。

## 9.5 Shared Contact With Private Notes

共有担当者に権限外事業の内部メモがある場合、
担当者詳細のノート表示は事業別セクションで分離し、権限外部分を出さない。

## 9.6 Bulk Update / Bulk Export

一括操作は1件ずつ権限判定を行う。
一覧取得後にまとめて実行するからといって、可視範囲外データを混ぜて処理してはいけない。

## 9.7 Contract Visibility vs Deal Visibility

契約は見えるが元案件は見えない、またはその逆、という設計は原則避ける。
契約は案件の延長線上とし、閲覧系の整合を保つ。
少なくとも同一スコープ内で権限ポリシーを大きく逆転させない。

## 9.8 Temporary Delegation

長期休暇などで担当者代行が必要な場合は、
owner移譲または一時チーム権限で対応し、ロールを恒久的に上げない。
一時権限は開始・終了日時を持てる設計が望ましい。

# 10. Recommended Final Permission Policy

G-DXの正式な権限制御方針は以下とする。

* 権限は **RBAC + business scope constraints** で実装する
* ロールと事業可視範囲は別管理にする
* 標準ロールは `SUPER_ADMIN` `ADMIN` `MANAGER` `OPERATOR` `VIEWER`
* 顧客マスタは共有参照可能とする
* 案件、契約、架電、活動履歴は必ず事業スコープを持つ
* 参照可否は `role_permission && business_scope_match && visibility_rule` で判定する
* `BOTH` を単一値として使わず、2スコープ付与で表現する
* create/update/delete/export/import は別権限として扱う
* business_scope変更、契約重要項目変更、権限変更、マージ、インポートは高権限操作にする
* 削除は原則論理削除のみ
* ダッシュボードも元データ権限を超えない
* 一括操作でもレコード単位権限判定を省略しない
* 重要操作は監査ログ必須
* UI非表示だけでなくサーバー側で強制する

実装ベースラインとしては、以下の permission key を持つ構造を推奨する。

* `customer.company.read`
* `customer.company.create`
* `customer.company.update`
* `customer.company.delete`
* `customer.contact.read`
* `customer.contact.create`
* `customer.contact.update`
* `sales.deal.read`
* `sales.deal.create`
* `sales.deal.update_basic`
* `sales.deal.update_critical`
* `sales.deal.reassign`
* `sales.deal.change_scope`
* `sales.contract.read`
* `sales.contract.create`
* `sales.contract.update_basic`
* `sales.contract.update_critical`
* `call.task.read`
* `call.task.create`
* `call.task.assign`
* `call.log.read`
* `call.log.create`
* `call.log.update`
* `dashboard.kpi.read`
* `dashboard.team.read`
* `dashboard.business.read`
* `auth.user.manage`
* `auth.role.manage`
* `integration.sync.manage`
* `audit.read`
* `export.summary`
* `export.detail`
* `import.customer`
* `import.sales`

この方針を基準にすれば、実装時は
**roles → role_permissions → user_roles → user_business_scopes → record_scope判定**
の構成でそのまま開発へ引き渡せる。
