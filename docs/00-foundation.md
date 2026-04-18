# 1. Executive Summary

G-DXのフルリライトでは、**PostgreSQLを唯一の主データ基盤**とし、**Lark OAuthのみで認証**する。
新システムは「Lark導入支援」と「節水器具販売」の2事業を1つの業務基盤に統合しつつ、**アカウント単位で事業スコープを制御**できる構成を採用する。

本システムは以下を目的とする。

* 営業管理、顧客管理、架電、ダッシュボードを1つの業務アプリとして統合する
* 同一企業・同一担当者を必要に応じて事業横断で共有する
* 案件、架電、契約などの業務データには必ず事業スコープを持たせる
* 将来的に業界別G-DXへ派生させやすいよう、共通基盤と事業依存ルールを分離する

アーキテクチャは、**Next.js App Router + React + Tailwind CSS**によるフロントエンド、**業務API層**、**PostgreSQL**を中心に構成する。
Lark Baseは補助的な連携先として扱い、参照用・エクスポート用・一部同期用には使用できるが、**主記録系にはしない**。

最終的な推奨方針は、**単一プロダクト・単一DB・単一認証・事業スコープ分離型のエンタープライズWebアプリ**である。

# 2. System Scope

本システムの対象範囲は以下とする。

* 認証・アカウント管理
* 事業スコープに基づく表示・権限制御
* 顧客管理
* 企業管理
* 営業案件管理
* 契約管理
* 架電業務管理
* ダッシュボード・集計
* Larkとの限定的連携

対象事業は以下の2つ。

* `LARK_SUPPORT` : Lark導入支援
* `WATER_SAVING` : 節水器具販売

対象モジュールは以下の4つ。

* `sales_management`
* `customer_management`
* `call_system`
* `dashboard`

システム上で管理すべき主要業務エンティティは以下。

* 会社
* 担当者
* ユーザーアカウント
* 案件
* 架電記録
* 契約
* 活動履歴
* 事業スコープ設定
* 権限ロール

# 3. Non-Goals

以下は今回の基盤方針の対象外とする。

* ノーコード/ローコード基盤の設計
* エンドユーザーが自由に業務画面やDBを定義できる仕組み
* Lark Base中心の運用設計
* 複数認証方式の併用
* 会計、請求、在庫、全文書管理などのERP化
* 事業ごとに完全分離した別システム構築
* 初期段階からのマイクロサービス分割
* BI製品相当の自由分析基盤の内製

このプロジェクトは、汎用プラットフォームではなく、**株式会社グラストの実業務に最適化された実務システム**を作ることを目的とする。

# 4. Architectural Principles

## 4.1 Single Source of Truth

主データは必ずPostgreSQLに保持する。
Lark Base、CSV、外部表計算、手動台帳は補助データであり、主記録とは見なさない。

## 4.2 Business Scope First

すべての主要業務データは、作成時点で事業スコープを持つ。
表示制御も集計制御も、まず事業スコープで絞る。

## 4.3 Shared Master, Scoped Transactions

会社・担当者などのマスタは必要に応じて共有可能とする。
一方で、案件、架電、契約などの業務トランザクションは事業スコープを必須とする。

## 4.4 Practical Monolith

初期構成は**モジュラーモノリス**を採用する。
単一コードベース・単一DB・明確なモジュール境界で運用し、将来的に重い部分だけ分離可能にする。

## 4.5 Server-Enforced Authorization

権限制御はフロントだけで判断しない。
API層・サーバー側で必ず権限と事業スコープを検証する。

## 4.6 Auditability

業務システムとして、更新履歴・担当者・時刻・変更内容を追跡可能にする。
少なくとも案件、契約、顧客、架電は監査ログ対象とする。

## 4.7 Explicit Domain Boundaries

営業管理、顧客管理、架電、ダッシュボードは画面としては連携してよいが、
内部責務は明確に分ける。
「どのモジュールがどのデータを最終責任で持つか」を曖昧にしない。

# 5. Business Scope Model

## 5.1 Scope Definitions

事業スコープは以下の3パターンを扱う。

* `LARK_SUPPORT`
* `WATER_SAVING`
* `BOTH`

ただしデータモデル上は、`BOTH`を単一値として濫用しない。
**アカウント権限は複数スコープ所持可能**とし、データは原則として個別スコープを持つ。

## 5.2 Account Scope

ユーザーアカウントにはアクセス可能な事業スコープを紐づける。

例:

* Aさん: `LARK_SUPPORT`のみ閲覧/操作可
* Bさん: `WATER_SAVING`のみ閲覧/操作可
* Cさん: 両方可

実装上は、`user_business_scopes` のような中間テーブルで持つ。

## 5.3 Data Scope

以下の業務データは必ず1つ以上の事業スコープを持つ。

* deals
* calls
* contracts
* activities

初期基準として、案件・架電・契約は**単一事業スコープ必須**とする。
1レコードが複数事業にまたがる曖昧状態は避ける。

## 5.4 Shared Companies and Contacts

会社・担当者は共有可能とする。
ただし、共有しても「どの事業で接点があるか」は関連テーブルで追跡する。

推奨ルール:

* `companies` は共通マスタ
* `contacts` は共通マスタ
* 事業との接点は `company_business_relations` や `contact_business_relations` で保持
* 実案件や契約は各事業スコープ付きで別管理

これにより、同一企業がLark導入支援と節水器具販売の両方の見込み先/顧客になるケースに対応できる。

## 5.5 Visibility Rules

表示ルールは以下。

* ユーザーは自分が許可された事業スコープのデータのみ参照できる
* 両方権限を持つユーザーは横断参照できる
* 共有会社・共有担当者は見えても、紐づく案件や契約は権限外なら見えない
* ダッシュボード集計も同様にスコープ制限する

# 6. Authority Model Overview

## 6.1 Authorization Layers

権限制御は以下の3層で行う。

* 認証: Lark OAuthで本人確認
* 権限: ロールで操作可否を管理
* 範囲: 事業スコープで閲覧対象を管理

## 6.2 Recommended Core Roles

最低限のロールは以下。

* `SUPER_ADMIN`
* `ADMIN`
* `MANAGER`
* `OPERATOR`
* `VIEWER`

役割の基準:

* `SUPER_ADMIN`: 全設定、全事業、全閲覧/全更新
* `ADMIN`: 管理業務全般、ユーザー管理、マスタ管理
* `MANAGER`: 自部門または担当範囲の管理、集計参照、承認系操作
* `OPERATOR`: 日常業務入力、案件更新、架電記録
* `VIEWER`: 閲覧中心

## 6.3 Scope + Role Composition

実権限は「ロール」だけでなく、**ロール × 事業スコープ**で決まる。

例:

* `MANAGER` + `LARK_SUPPORT`
* `OPERATOR` + `WATER_SAVING`
* `ADMIN` + `LARK_SUPPORT`,`WATER_SAVING`

これにより、同じロールでも事業ごとに可視範囲を変えられる。

## 6.4 Record-Level Ownership

事業スコープだけでは足りない場合に備え、以下も持てるようにする。

* owner_user_id
* team_id
* created_by
* updated_by

これにより将来的に以下へ拡張できる。

* 自分の案件のみ
* チーム案件のみ
* 事業全体案件
* 管理者だけ全件

## 6.5 UI Enforcement Rules

UIでは以下を徹底する。

* 権限外メニューは非表示
* スコープ外データは一覧に出さない
* レコード詳細APIでも再検証する
* 一括更新・CSV出力も同じ制御を適用する

# 7. Data Ownership Policy

## 7.1 System of Record Policy

各データの主責任は以下。

* 認証元: Lark OAuth
* ユーザー情報の業務利用プロファイル: G-DX DB
* 会社/担当者/案件/契約/架電/活動履歴: G-DX DB
* 外部共有・簡易閲覧・補助同期: Lark Base可

Larkから取得した情報も、業務利用するならG-DX側に保持する。

## 7.2 Write Policy

更新は原則G-DXから行う。
Lark Baseから直接更新して主記録を壊す運用は採用しない。

許可する連携例:

* G-DX → Lark Baseへの同期
* G-DX → Lark通知
* Lark OAuthによるログイン
* Larkユーザー基本情報の取り込み

非推奨:

* 業務担当者がLark Baseを直接編集し、後でG-DXに合わせる運用
* DB未更新のままLark Baseだけを正とする運用

## 7.3 Audit and History Policy

最低限、以下は履歴を持つ。

* 案件ステータス変更
* 契約情報変更
* 顧客情報主要項目変更
* 架電結果記録
* 権限設定変更

履歴には以下を保持する。

* 対象テーブル
* 対象ID
* 変更前
* 変更後
* 実行者
* 実行日時

## 7.4 Delete Policy

物理削除は原則避け、論理削除を基本とする。
特に顧客、案件、契約、架電、権限系は論理削除前提。

# 8. Module Boundaries

## 8.1 Customer Management

責務:

* 会社管理
* 担当者管理
* 顧客基本属性管理
* 顧客と事業の関連管理

持つべき中心データ:

* companies
* contacts
* company_business_relations
* contact_business_relations

非責務:

* 契約の最終管理
* 架電の最終管理
* ダッシュボード集計ロジック

## 8.2 Sales Management

責務:

* 案件管理
* 商談進捗
* 受注/失注管理
* 契約前後の営業フロー管理

持つべき中心データ:

* deals
* deal_stages
* quotations
* contracts

ルール:

* dealには必ずbusiness_scopeを持たせる
* company/contact参照はCustomer Managementのマスタを使う

## 8.3 Call System

責務:

* 架電対象管理
* 架電実績記録
* 架電結果分類
* 再架電予定
* 通話関連オペレーション記録

持つべき中心データ:

* call_lists
* call_tasks
* call_logs
* call_results

ルール:

* call_logには必ずbusiness_scopeを持たせる
* 対象顧客はCustomer Management参照
* 案件化した場合はSales Managementへ連携

## 8.4 Dashboard

責務:

* KPI表示
* 件数/率/進捗集計
* 期間比較
* 担当別/事業別集計

ルール:

* Dashboardは主データを持たない
* 集計元は各モジュールの正規データ
* スコープ制御を厳格適用する
* 重い集計は集計テーブルまたはマテリアライズドビューで最適化する

## 8.5 Cross-Module Rules

モジュール横断の基本ルールは以下。

* 顧客マスタはCustomer Managementが責任を持つ
* 案件・契約はSales Managementが責任を持つ
* 架電記録はCall Systemが責任を持つ
* Dashboardは参照専用
* 他モジュールの責任データを直接書き換えない
* 更新が必要なら公開サービス層または明示API経由で行う

# 9. Technical Architecture

## 9.1 Frontend

* Next.js App Router
* React
* Tailwind CSS
* Noto Sans JP

方針:

* BtoB管理画面として落ち着いたUIにする
* 過剰なアニメーションは使わない
* AI生成っぽい装飾を避ける
* 一覧、検索、詳細、編集、履歴を使いやすく設計する
* 事業スコープ切替をヘッダーまたはグローバルフィルタで明示する

## 9.2 Backend Style

推奨は、Next.jsと分離可能な**業務API層付きのモジュラーモノリス**。
初期は単一デプロイでもよいが、責務は以下に分ける。

* auth
* users
* authorization
* customers
* sales
* calls
* dashboard
* integrations
* audit

APIは業務単位で設計し、画面都合だけの肥大化したAPIを避ける。

## 9.3 Database

主DBはPostgreSQL。

基本方針:

* 厳密な正規化をベースにする
* 一覧高速化に必要な索引を設計する
* 事業スコープ列は主要トランザクションテーブルに必須
* 監査ログを別テーブルで管理する
* 集計用途は派生テーブル/ビューで吸収する

推奨主要テーブル群:

* users
* user_business_scopes
* roles
* user_roles
* companies
* contacts
* company_business_relations
* contact_business_relations
* deals
* contracts
* call_tasks
* call_logs
* activities
* audit_logs
* integration_sync_jobs

## 9.4 Authentication

認証はLark OAuthのみ。
ローカルID/パスワードは持たない。

ログイン後の流れ:

1. Lark OAuthで認証
2. Lark user identifierを受領
3. G-DX内のユーザーとマッピング
4. ロールと事業スコープを読み込む
5. セッション発行

注意点:

* Lark上に存在しても、G-DX未許可ユーザーはログイン不可
* 認証成功と利用許可は別概念にする
* Lark組織変更時の再同期方針を持つ

## 9.5 Integration Policy

Lark連携は以下に限定する。

* OAuth認証
* ユーザー基本情報同期
* 通知送信
* 任意のLark Base同期

Lark Baseは以下の立場に限定する。

* 補助ビュー
* 外部共有
* 一時運用補助
* 一部部門向け補助台帳

主業務データの永続先にはしない。

## 9.6 Deployment Baseline

初期推奨:

* 単一Webアプリケーション
* 単一PostgreSQL
* バックグラウンドジョブ基盤あり
* ステージング/本番環境を分離
* 障害解析用ログ基盤あり

非同期処理対象:

* Lark同期
* 通知
* 重い集計更新
* CSV入出力
* 監査イベント整形

# 10. Risks and Anti-Patterns

## 10.1 Lark Baseを実質本番DBにしてしまう

最も避けるべき失敗。
画面はG-DX、実データ更新はLark Base、という二重管理になると整合性が崩れる。

## 10.2 共有マスタと事業データの境界が曖昧

会社や担当者を共有したい一方で、案件や契約まで共有扱いにすると権限事故が起きやすい。
共有するのは顧客マスタまで、トランザクションは事業単位で管理する。

## 10.3 ロール設計だけで権限制御しようとする

`MANAGER` かどうかだけでは不十分。
必ず事業スコープとの組み合わせで判定する。

## 10.4 画面都合でモジュール責任を壊す

一覧画面が欲しいからといって、各画面が勝手に顧客・案件・架電を直接更新し始めると保守不能になる。
責任モジュール経由で更新する。

## 10.5 初期から過剰分散する

マイクロサービス化を先にやると、権限、監査、集計、検索が余計に複雑になる。
最初はモジュラーモノリスで十分。

## 10.6 “両事業共通” データを曖昧に持つ

`business_scope = BOTH` を業務データに多用すると、集計も権限も壊れる。
業務トランザクションは原則単一事業に固定する。

## 10.7 Dashboardが独自ロジックの温床になる

ダッシュボード側で独自集計定義を乱立させると、本体データとの数字不一致が起きる。
集計定義は業務ルールとして共通化する。

# 11. Final Recommended Baseline

G-DXの基盤方針として、以下を正式ベースラインとする。

* 認証は**Lark OAuthのみ**
* 主DBは**PostgreSQL**
* **Lark Baseは補助連携先であり、主記録ではない**
* システム構成は**単一プロダクトのモジュラーモノリス**
* 事業は `LARK_SUPPORT` と `WATER_SAVING` の2軸を持つ
* ユーザーは事業スコープ単位でアクセス権を持つ
* 会社・担当者は共有可能な共通マスタとして扱う
* 案件・架電・契約・活動履歴は事業スコープ必須とする
* 権限制御は**ロール × 事業スコープ**で判定する
* ダッシュボードは参照専用で、正規データは各業務モジュールが保持する
* 初期段階では汎用プラットフォーム化を目指さず、**グラスト実務に最適化した業務Webアプリ**として設計する

このベースラインにより、以下が両立できる。

* 現実的な実装速度
* 事業別の閲覧統制
* 顧客共有の柔軟性
* 将来の業界別G-DX派生への拡張性

次工程では、この基盤方針を前提として、**権限マトリクス定義、主要ER、モジュール別ユースケース、画面一覧、API責務分解**へ進める。
