# 1. API Design Principles

## 1.1 基本方針

* G-DX の API は **REST-first / JSON ベース** とする。
* 実装対象は **Next.js の Route Handlers または BFF 層** を前提とし、フロントエンドが扱いやすい粒度で設計する。
* 認証は **Lark OAuth のみ** を採用し、独自のパスワード認証は持たない。
* 権限制御は **RBAC（role） + business scope 制約** の二段階で判定する。
* 業務データは過度に汎用化せず、現時点の業務要件に合わせた明示的な API を定義する。
* 監査・履歴・同期系は将来拡張を見越しつつ、MVP では実務運用に必要な最小単位を先に揃える。

## 1.2 API ベースパス

* ベースパス: `/api/v1`

例:

* `/api/v1/session`
* `/api/v1/companies`
* `/api/v1/deals`

## 1.3 共通レスポンス方針

成功時:

```json
{
  "data": {},
  "meta": {}
}
```

一覧取得時:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 125
  }
}
```

エラー時:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "details": {}
  }
}
```

## 1.4 共通設計ルール

* 日時は ISO 8601 文字列を使用する。
* ID は原則 UUID 文字列を使用する。
* 一覧 API は基本的に `page`, `pageSize`, `sort`, `order` を受け付ける。
* フィルタはクエリパラメータで受け付ける。
* 作成・更新 API は明示的な JSON ボディを受け付ける。
* 削除は物理削除ではなく、可能な限り **soft delete / archived** を優先する。
* 業務スコープを持つデータには `businessScope` を必須で持たせる。

## 1.5 business scope の扱い

* 対象値:

  * `LARK_SUPPORT`
  * `WATER_SAVING`
* 共有可能なマスタ系（companies, contacts）は複数 business に跨って参照可能。
* deals / calls / dashboard 集計は business 単位で扱う。
* API は以下のいずれかで scope を扱う:

  * クエリ: `?businessScope=LARK_SUPPORT`
  * リクエストボディ: `"businessScope": "LARK_SUPPORT"`
* サーバー側では、指定 scope がログインユーザーの許可 scope に含まれるか必ず検証する。

## 1.6 推奨共通オブジェクト

```json
{
  "id": "uuid",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-10T10:00:00Z"
}
```

User summary:

```json
{
  "id": "uuid",
  "name": "山田 太郎",
  "email": "taro@example.com",
  "roles": ["OPERATOR"],
  "businessScopes": ["LARK_SUPPORT"]
}
```

Business-scoped entity summary:

```json
{
  "id": "uuid",
  "businessScope": "LARK_SUPPORT",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-10T10:00:00Z"
}
```

---

# 2. Authentication and Session Endpoints

## 2.1 GET `/api/v1/auth/lark/start`

* **purpose**: Lark OAuth 認証開始用 URL へリダイレクトする。
* **request shape**:

```json
{
  "redirectTo": "/dashboard"
}
```

実際はクエリパラメータ利用でもよい。

* **response shape**:

```json
{
  "data": {
    "authUrl": "https://..."
  }
}
```

または 302 Redirect。

* **permission notes**:

  * 認証不要。
  * 外部公開エンドポイント。

## 2.2 GET `/api/v1/auth/lark/callback`

* **purpose**: Lark OAuth callback を受け、ユーザー情報取得・ローカルユーザー照合・セッション作成を行う。
* **request shape**:

```json
{
  "code": "oauth_code",
  "state": "csrf_token"
}
```

* **response shape**:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "山田 太郎",
      "email": "taro@example.com",
      "roles": ["OPERATOR"],
      "businessScopes": ["LARK_SUPPORT", "WATER_SAVING"]
    },
    "session": {
      "expiresAt": "2026-03-11T00:00:00Z"
    }
  }
}
```

* **permission notes**:

  * 認証不要。
  * `state` 検証必須。
  * 内部的に Cookie セッションまたは署名付きトークンを発行する。

## 2.3 GET `/api/v1/session`

* **purpose**: 現在ログイン中のセッション情報と権限情報を返す。
* **request shape**: body なし。
* **response shape**:

```json
{
  "data": {
    "isAuthenticated": true,
    "user": {
      "id": "uuid",
      "name": "山田 太郎",
      "email": "taro@example.com",
      "roles": ["MANAGER"],
      "businessScopes": ["LARK_SUPPORT"]
    },
    "permissions": {
      "modules": {
        "sales_management": ["read", "create", "update"],
        "customer_management": ["read", "create", "update"],
        "call_system": ["read", "create"],
        "dashboard": ["read"]
      }
    }
  }
}
```

* **permission notes**:

  * ログイン済みユーザーのみ。
  * UI 初期化用の最重要 API。

## 2.4 POST `/api/v1/session/scope`

* **purpose**: 現在操作中の business scope をセッションに保存する。
* **request shape**:

```json
{
  "activeBusinessScope": "LARK_SUPPORT"
}
```

* **response shape**:

```json
{
  "data": {
    "activeBusinessScope": "LARK_SUPPORT"
  }
}
```

* **permission notes**:

  * ログイン済みユーザーのみ。
  * 指定 scope がユーザー許可範囲外なら 403。

## 2.5 DELETE `/api/v1/session`

* **purpose**: ログアウトし、セッションを破棄する。
* **request shape**: body なし。
* **response shape**:

```json
{
  "data": {
    "loggedOut": true
  }
}
```

* **permission notes**:

  * ログイン済みユーザーのみ。

---

# 3. User and Permission Endpoints

## 3.1 GET `/api/v1/users`

* **purpose**: ユーザー一覧を取得する。管理者向け。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 20,
  "keyword": "山田",
  "roles": ["OPERATOR"],
  "businessScope": "LARK_SUPPORT",
  "status": "active"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "山田 太郎",
      "email": "taro@example.com",
      "roles": ["OPERATOR"],
      "businessScopes": ["LARK_SUPPORT"],
      "status": "active",
      "lastLoginAt": "2026-03-10T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `ADMIN`, `ADMIN` のみ。
  * `ADMIN` は自分の許可 scope 内ユーザーのみ閲覧可。

## 3.2 POST `/api/v1/users`

* **purpose**: ローカル業務ユーザーを作成または Lark ユーザーと紐付ける。
* **request shape**:

```json
{
  "larkUserId": "ou_xxx",
  "name": "山田 太郎",
  "email": "taro@example.com",
  "roles": ["OPERATOR"],
  "businessScopes": ["LARK_SUPPORT"]
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "taro@example.com",
    "roles": ["OPERATOR"],
    "businessScopes": ["LARK_SUPPORT"],
    "status": "active"
  }
}
```

* **permission notes**:

  * `ADMIN` のみ、または厳格運用なら `ADMIN` は自 scope 内のみ可。
  * role と businessScopes はサーバー側バリデーション必須。

## 3.3 GET `/api/v1/users/{userId}`

* **purpose**: ユーザー詳細を取得する。
* **request shape**: path param のみ。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "taro@example.com",
    "roles": ["OPERATOR"],
    "businessScopes": ["LARK_SUPPORT"],
    "status": "active",
    "larkUserId": "ou_xxx",
    "createdAt": "2026-03-01T00:00:00Z",
    "updatedAt": "2026-03-10T00:00:00Z"
  }
}
```

* **permission notes**:

  * `ADMIN`, `ADMIN`。
  * 一般ユーザーは `/me` のみ参照可能に寄せるのが安全。

## 3.4 PATCH `/api/v1/users/{userId}`

* **purpose**: role, businessScopes, status などを更新する。
* **request shape**:

```json
{
  "roles": ["MANAGER"],
  "businessScopes": ["LARK_SUPPORT", "WATER_SAVING"],
  "status": "active"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "roles": ["MANAGER"],
    "businessScopes": ["LARK_SUPPORT", "WATER_SAVING"],
    "status": "active",
    "updatedAt": "2026-03-10T10:30:00Z"
  }
}
```

* **permission notes**:

  * `ADMIN` のみ推奨。
  * role 変更と scope 変更は監査ログ必須。

## 3.5 GET `/api/v1/me`

* **purpose**: 自分自身のプロフィールと権限を返す。
* **request shape**: body なし。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "taro@example.com",
    "roles": ["OPERATOR"],
    "businessScopes": ["LARK_SUPPORT"],
    "permissions": {
      "sales_management": ["read", "create", "update"]
    }
  }
}
```

* **permission notes**:

  * ログイン済みユーザー全員。

## 3.6 GET `/api/v1/roles`

* **purpose**: フロントエンド用に role 定義一覧を返す。
* **request shape**: body なし。
* **response shape**:

```json
{
  "data": [
    {
      "key": "ADMIN",
      "label": "管理者"
    },
    {
      "key": "OPERATOR",
      "label": "営業"
    }
  ]
}
```

* **permission notes**:

  * ログイン済みユーザー全員。
  * UI マスタ用途。

---

# 4. Companies and Contacts Endpoints

## 4.1 GET `/api/v1/companies`

* **purpose**: 企業・法人アカウント一覧を取得する。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 20,
  "keyword": "株式会社",
  "industry": "SaaS",
  "businessScope": "LARK_SUPPORT",
  "assignedUserId": "uuid",
  "status": "active"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "株式会社サンプル",
      "industry": "SaaS",
      "phone": "03-xxxx-xxxx",
      "website": "https://example.com",
      "sharedAcrossBusinesses": true,
      "tags": ["重点"],
      "ownerUser": {
        "id": "uuid",
        "name": "山田 太郎"
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `customer_management.read` を持つユーザー。
  * business filter は参照文脈用。共有アカウントは scope 跨ぎで返却可能だが、関連案件の見え方は別制御。

## 4.2 POST `/api/v1/companies`

* **purpose**: 企業アカウントを作成する。
* **request shape**:

```json
{
  "name": "株式会社サンプル",
  "industry": "SaaS",
  "phone": "03-xxxx-xxxx",
  "website": "https://example.com",
  "postalCode": "1000001",
  "address": "東京都...",
  "ownerUserId": "uuid",
  "tags": ["重点"],
  "sharedAcrossBusinesses": true
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "name": "株式会社サンプル",
    "sharedAcrossBusinesses": true,
    "createdAt": "2026-03-10T10:00:00Z"
  }
}
```

* **permission notes**:

  * `customer_management.create` を持つユーザー。
  * 重複チェック（会社名、電話、ドメイン）推奨。

## 4.3 GET `/api/v1/companies/{companyId}`

* **purpose**: 企業アカウント詳細を取得する。
* **request shape**: path param のみ。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "name": "株式会社サンプル",
    "industry": "SaaS",
    "phone": "03-xxxx-xxxx",
    "website": "https://example.com",
    "address": "東京都...",
    "ownerUser": {
      "id": "uuid",
      "name": "山田 太郎"
    },
    "contacts": [
      {
        "id": "uuid",
        "name": "佐藤 花子",
        "department": "営業部",
        "email": "hanako@example.com"
      }
    ],
    "openDealsSummary": {
      "LARK_SUPPORT": 2,
      "WATER_SAVING": 1
    }
  }
}
```

* **permission notes**:

  * `customer_management.read` を持つユーザー。
  * openDealsSummary は閲覧可能 scope のみ返す。

## 4.4 PATCH `/api/v1/companies/{companyId}`

* **purpose**: 企業アカウント情報を更新する。
* **request shape**:

```json
{
  "industry": "Manufacturing",
  "phone": "03-xxxx-9999",
  "ownerUserId": "uuid",
  "tags": ["既存顧客"]
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "updatedAt": "2026-03-10T10:20:00Z"
  }
}
```

* **permission notes**:

  * `customer_management.update`。
  * 基本情報変更は監査対象。

## 4.5 GET `/api/v1/contacts`

* **purpose**: 担当者一覧を取得する。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 20,
  "keyword": "佐藤",
  "companyId": "uuid",
  "businessScope": "LARK_SUPPORT"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "companyName": "株式会社サンプル",
      "name": "佐藤 花子",
      "department": "営業部",
      "title": "課長",
      "email": "hanako@example.com",
      "phone": "090-xxxx-xxxx"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `customer_management.read`。

## 4.6 POST `/api/v1/contacts`

* **purpose**: 担当者を作成する。
* **request shape**:

```json
{
  "companyId": "uuid",
  "name": "佐藤 花子",
  "department": "営業部",
  "title": "課長",
  "email": "hanako@example.com",
  "phone": "090-xxxx-xxxx",
  "isPrimary": true
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "name": "佐藤 花子"
  }
}
```

* **permission notes**:

  * `customer_management.create`。

## 4.7 PATCH `/api/v1/contacts/{contactId}`

* **purpose**: 担当者を更新する。
* **request shape**:

```json
{
  "department": "経営企画室",
  "title": "部長",
  "email": "hanako.sato@example.com"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "updatedAt": "2026-03-10T10:40:00Z"
  }
}
```

* **permission notes**:

  * `customer_management.update`。

## 4.8 GET `/api/v1/companies/{companyId}/timeline`

* **purpose**: company 単位の活動履歴を返す。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 30
}
```

* **response shape**:

```json
{
  "data": [
    {
      "type": "deal_created",
      "occurredAt": "2026-03-10T09:00:00Z",
      "businessScope": "LARK_SUPPORT",
      "summary": "新規案件を作成"
    },
    {
      "type": "call_logged",
      "occurredAt": "2026-03-10T09:30:00Z",
      "businessScope": "LARK_SUPPORT",
      "summary": "架電記録を登録"
    }
  ]
}
```

* **permission notes**:

  * `customer_management.read`。
  * 各イベントはユーザー閲覧可能な scope 分のみ表示。

---

# 5. Deals and Pipeline Endpoints

## 5.1 GET `/api/v1/deals`

* **purpose**: 案件一覧を取得する。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 20,
  "businessScope": "LARK_SUPPORT",
  "stage": "PROPOSAL",
  "ownerUserId": "uuid",
  "companyId": "uuid",
  "keyword": "大型案件",
  "from": "2026-03-01",
  "to": "2026-03-31"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "businessScope": "LARK_SUPPORT",
      "name": "Lark導入支援 4月案件",
      "company": {
        "id": "uuid",
        "name": "株式会社サンプル"
      },
      "stage": "PROPOSAL",
      "amount": 1200000,
      "ownerUser": {
        "id": "uuid",
        "name": "山田 太郎"
      },
      "expectedCloseDate": "2026-03-31"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `sales_management.read`。
  * `businessScope` 指定必須推奨。
  * scope 外の案件は返却不可。

## 5.2 POST `/api/v1/deals`

* **purpose**: 案件を作成する。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "companyId": "uuid",
  "primaryContactId": "uuid",
  "name": "Lark導入支援 4月案件",
  "stage": "LEAD",
  "amount": 1200000,
  "expectedCloseDate": "2026-03-31",
  "ownerUserId": "uuid",
  "source": "inbound",
  "memo": "初回提案前"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "businessScope": "LARK_SUPPORT",
    "name": "Lark導入支援 4月案件",
    "stage": "LEAD",
    "createdAt": "2026-03-10T11:00:00Z"
  }
}
```

* **permission notes**:

  * `sales_management.create`。
  * 指定 scope に対する作成権限必須。

## 5.3 GET `/api/v1/deals/{dealId}`

* **purpose**: 案件詳細を取得する。
* **request shape**: path param のみ。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "businessScope": "LARK_SUPPORT",
    "name": "Lark導入支援 4月案件",
    "company": {
      "id": "uuid",
      "name": "株式会社サンプル"
    },
    "primaryContact": {
      "id": "uuid",
      "name": "佐藤 花子"
    },
    "stage": "PROPOSAL",
    "amount": 1200000,
    "expectedCloseDate": "2026-03-31",
    "ownerUser": {
      "id": "uuid",
      "name": "山田 太郎"
    },
    "memo": "初回提案前",
    "stageHistory": [
      {
        "from": "LEAD",
        "to": "PROPOSAL",
        "changedAt": "2026-03-10T10:00:00Z"
      }
    ]
  }
}
```

* **permission notes**:

  * `sales_management.read`。
  * scope 外アクセスは 404 または 403 のいずれかで統一する。

## 5.4 PATCH `/api/v1/deals/{dealId}`

* **purpose**: 案件内容を更新する。
* **request shape**:

```json
{
  "name": "Lark導入支援 4月案件 改",
  "amount": 1500000,
  "expectedCloseDate": "2026-04-05",
  "ownerUserId": "uuid",
  "memo": "見積更新済み"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "updatedAt": "2026-03-10T11:20:00Z"
  }
}
```

* **permission notes**:

  * `sales_management.update`。
  * 担当者変更・金額変更は監査対象。

## 5.5 POST `/api/v1/deals/{dealId}/stage-transition`

* **purpose**: 案件の stage を遷移させる。
* **request shape**:

```json
{
  "toStage": "NEGOTIATION",
  "reason": "提案通過",
  "changedAt": "2026-03-10T11:30:00Z"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "stage": "NEGOTIATION",
    "previousStage": "PROPOSAL",
    "changedAt": "2026-03-10T11:30:00Z"
  }
}
```

* **permission notes**:

  * `sales_management.update`。
  * 遷移ルールはサーバー側で制御。
  * stage 変更履歴は必ず保存。

## 5.6 GET `/api/v1/pipelines`

* **purpose**: business ごとのパイプライン定義と stage 一覧を返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT"
}
```

* **response shape**:

```json
{
  "data": {
    "businessScope": "LARK_SUPPORT",
    "stages": [
      {"key": "LEAD", "label": "リード", "order": 1},
      {"key": "PROPOSAL", "label": "提案", "order": 2},
      {"key": "NEGOTIATION", "label": "交渉", "order": 3},
      {"key": "WON", "label": "受注", "order": 4},
      {"key": "LOST", "label": "失注", "order": 5}
    ]
  }
}
```

* **permission notes**:

  * `sales_management.read`。
  * UI 表示用の基礎 API。

## 5.7 GET `/api/v1/pipelines/board`

* **purpose**: カンバン表示用に stage ごとの案件一覧をまとめて返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "ownerUserId": "uuid"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "stage": "LEAD",
      "deals": [
        {
          "id": "uuid",
          "name": "案件A",
          "amount": 500000
        }
      ]
    },
    {
      "stage": "PROPOSAL",
      "deals": []
    }
  ]
}
```

* **permission notes**:

  * `sales_management.read`。
  * scope 必須。

---

# 6. Call System Endpoints

## 6.1 GET `/api/v1/calls`

* **purpose**: 架電履歴一覧を取得する。
* **request shape**:

```json
{
  "page": 1,
  "pageSize": 20,
  "businessScope": "LARK_SUPPORT",
  "assignedUserId": "uuid",
  "companyId": "uuid",
  "contactId": "uuid",
  "result": "CONNECTED",
  "from": "2026-03-01",
  "to": "2026-03-31"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "businessScope": "LARK_SUPPORT",
      "calledAt": "2026-03-10T11:00:00Z",
      "company": {
        "id": "uuid",
        "name": "株式会社サンプル"
      },
      "contact": {
        "id": "uuid",
        "name": "佐藤 花子"
      },
      "assignedUser": {
        "id": "uuid",
        "name": "山田 太郎"
      },
      "result": "CONNECTED",
      "durationSec": 180
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `call_system.read`。
  * scope 指定推奨。

## 6.2 POST `/api/v1/calls`

* **purpose**: 架電記録を作成する。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "companyId": "uuid",
  "contactId": "uuid",
  "dealId": "uuid",
  "assignedUserId": "uuid",
  "calledAt": "2026-03-10T11:00:00Z",
  "result": "CONNECTED",
  "durationSec": 180,
  "notes": "次回提案日を調整",
  "nextAction": "proposal_followup",
  "nextActionDueAt": "2026-03-12T10:00:00Z"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "businessScope": "LARK_SUPPORT",
    "result": "CONNECTED",
    "createdAt": "2026-03-10T11:05:00Z"
  }
}
```

* **permission notes**:

  * `call_system.create`。
  * dealId 指定時は同一 businessScope の deal のみ許可。

## 6.3 GET `/api/v1/calls/{callId}`

* **purpose**: 架電記録詳細を取得する。
* **request shape**: path param のみ。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "businessScope": "LARK_SUPPORT",
    "calledAt": "2026-03-10T11:00:00Z",
    "company": {
      "id": "uuid",
      "name": "株式会社サンプル"
    },
    "contact": {
      "id": "uuid",
      "name": "佐藤 花子"
    },
    "deal": {
      "id": "uuid",
      "name": "Lark導入支援 4月案件"
    },
    "assignedUser": {
      "id": "uuid",
      "name": "山田 太郎"
    },
    "result": "CONNECTED",
    "durationSec": 180,
    "notes": "次回提案日を調整",
    "nextAction": "proposal_followup",
    "nextActionDueAt": "2026-03-12T10:00:00Z"
  }
}
```

* **permission notes**:

  * `call_system.read`。
  * scope 外は非表示。

## 6.4 PATCH `/api/v1/calls/{callId}`

* **purpose**: 架電記録を更新する。
* **request shape**:

```json
{
  "result": "CALLBACK_REQUESTED",
  "notes": "先方都合で折り返し待ち",
  "nextActionDueAt": "2026-03-13T15:00:00Z"
}
```

* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "updatedAt": "2026-03-10T11:10:00Z"
  }
}
```

* **permission notes**:

  * `call_system.update`。
  * 自分の架電のみ更新可、または manager 以上は全件可など運用ルールをここで確定させる。

## 6.5 GET `/api/v1/call-tasks`

* **purpose**: 次回架電・折り返し・未対応タスク一覧を取得する。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "assignedUserId": "uuid",
  "status": "open",
  "dueBefore": "2026-03-12T23:59:59Z"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "callId": "uuid",
      "companyName": "株式会社サンプル",
      "contactName": "佐藤 花子",
      "nextAction": "proposal_followup",
      "nextActionDueAt": "2026-03-12T10:00:00Z",
      "status": "open"
    }
  ]
}
```

* **permission notes**:

  * `call_system.read`。

## 6.6 POST `/api/v1/call-sessions/start`

* **purpose**: 架電業務の開始記録を作成する。オペレーター稼働計測用。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT"
}
```

* **response shape**:

```json
{
  "data": {
    "sessionId": "uuid",
    "startedAt": "2026-03-10T09:00:00Z"
  }
}
```

* **permission notes**:

  * `call_system.create`。
  * オペレーター本人のみ。

## 6.7 POST `/api/v1/call-sessions/{sessionId}/end`

* **purpose**: 架電業務セッションを終了する。
* **request shape**:

```json
{
  "endedAt": "2026-03-10T18:00:00Z"
}
```

* **response shape**:

```json
{
  "data": {
    "sessionId": "uuid",
    "startedAt": "2026-03-10T09:00:00Z",
    "endedAt": "2026-03-10T18:00:00Z",
    "totalDurationSec": 32400
  }
}
```

* **permission notes**:

  * `call_system.create`。
  * オペレーター本人または管理者。

---

# 7. Dashboard Endpoints

## 7.1 GET `/api/v1/dashboard/summary`

* **purpose**: ダッシュボード上部の主要 KPI を返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "from": "2026-03-01",
  "to": "2026-03-31"
}
```

* **response shape**:

```json
{
  "data": {
    "totalDeals": 120,
    "openDeals": 48,
    "wonDeals": 15,
    "lostDeals": 6,
    "totalSalesAmount": 25000000,
    "callCount": 840,
    "connectedRate": 0.42
  }
}
```

* **permission notes**:

  * `dashboard.read`。
  * scope 必須推奨。
  * 集計対象はユーザー閲覧許可範囲のみ。

## 7.2 GET `/api/v1/dashboard/sales-funnel`

* **purpose**: 営業ファネル集計を返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "from": "2026-03-01",
  "to": "2026-03-31"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "stage": "LEAD",
      "count": 40,
      "amount": 12000000
    },
    {
      "stage": "PROPOSAL",
      "count": 22,
      "amount": 9000000
    }
  ]
}
```

* **permission notes**:

  * `dashboard.read`。
  * sales データ閲覧権限前提。

## 7.3 GET `/api/v1/dashboard/call-performance`

* **purpose**: 架電パフォーマンス集計を返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "from": "2026-03-01",
  "to": "2026-03-31",
  "groupBy": "day"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "date": "2026-03-01",
      "callCount": 55,
      "connectedCount": 21,
      "connectedRate": 0.3818
    }
  ]
}
```

* **permission notes**:

  * `dashboard.read`。
  * call_system 閲覧権限がない場合は非表示でもよい。

## 7.4 GET `/api/v1/dashboard/owner-ranking`

* **purpose**: 担当者別の案件・架電ランキングを返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "from": "2026-03-01",
  "to": "2026-03-31",
  "metric": "won_amount"
}
```

* **response shape**:

```json
{
  "data": [
    {
      "user": {
        "id": "uuid",
        "name": "山田 太郎"
      },
      "value": 4200000
    }
  ]
}
```

* **permission notes**:

  * `dashboard.read`。
  * 個人評価表示は role によって制御可能。

## 7.5 GET `/api/v1/dashboard/activity-feed`

* **purpose**: 最近の重要活動を時系列で返す。
* **request shape**:

```json
{
  "businessScope": "LARK_SUPPORT",
  "limit": 20
}
```

* **response shape**:

```json
{
  "data": [
    {
      "type": "deal_won",
      "occurredAt": "2026-03-10T10:30:00Z",
      "summary": "Lark導入支援 4月案件が受注",
      "entityId": "uuid",
      "entityType": "deal"
    }
  ]
}
```

* **permission notes**:

  * `dashboard.read`。
  * 各 feed item は閲覧可能データのみ出す。

---

# 8. Lark Sync Endpoints

## 8.1 基本方針

Lark は **認証基盤 + 一部ディレクトリ同期 + 補助データ同期** に限定し、G-DX の主業務データの SoT は PostgreSQL とする。

## 8.2 POST `/api/v1/lark/sync/users`

* **purpose**: Lark ユーザー情報を同期するジョブを起動する。
* **request shape**:

```json
{
  "mode": "incremental"
}
```

* **response shape**:

```json
{
  "data": {
    "jobId": "uuid",
    "status": "queued"
  }
}
```

* **permission notes**:

  * `ADMIN` のみ。
  * 実処理は worker に委譲。

## 8.3 GET `/api/v1/lark/sync/jobs`

* **purpose**: 同期ジョブ一覧を返す。
* **request shape**:

```json
{
  "type": "users",
  "status": "failed",
  "page": 1,
  "pageSize": 20
}
```

* **response shape**:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "users",
      "status": "success",
      "startedAt": "2026-03-10T00:00:00Z",
      "finishedAt": "2026-03-10T00:01:00Z",
      "summary": {
        "created": 2,
        "updated": 15,
        "failed": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

* **permission notes**:

  * `ADMIN` のみ。

## 8.4 GET `/api/v1/lark/sync/jobs/{jobId}`

* **purpose**: 特定同期ジョブの詳細を取得する。
* **request shape**: path param のみ。
* **response shape**:

```json
{
  "data": {
    "id": "uuid",
    "type": "users",
    "status": "success",
    "startedAt": "2026-03-10T00:00:00Z",
    "finishedAt": "2026-03-10T00:01:00Z",
    "logs": [
      {
        "level": "info",
        "message": "15 users updated"
      }
    ]
  }
}
```

* **permission notes**:

  * `ADMIN` のみ。

## 8.5 POST `/api/v1/lark/webhooks/users`

* **purpose**: Lark からのユーザー変更 webhook を受け取り、非同期同期処理へ引き渡す。
* **request shape**:

```json
{
  "eventId": "evt_xxx",
  "type": "user.updated",
  "payload": {}
}
```

* **response shape**:

```json
{
  "data": {
    "accepted": true
  }
}
```

* **permission notes**:

  * 人間ユーザー向けではない。
  * 署名検証・イベント重複排除必須。

## 8.6 GET `/api/v1/lark/connections/status`

* **purpose**: Lark 接続状態と最終同期状態を返す。
* **request shape**: body なし。
* **response shape**:

```json
{
  "data": {
    "oauthConfigured": true,
    "webhookConfigured": true,
    "lastUserSyncAt": "2026-03-10T00:01:00Z",
    "lastSyncStatus": "success"
  }
}
```

* **permission notes**:

  * `ADMIN` のみ。

---

# 9. Error Handling Policy

## 9.1 HTTP ステータス基本方針

* `200 OK`: 取得・更新成功
* `201 Created`: 作成成功
* `202 Accepted`: 非同期ジョブ受付
* `400 Bad Request`: 入力不正
* `401 Unauthorized`: 未ログインまたは認証失敗
* `403 Forbidden`: 権限不足、scope 不一致
* `404 Not Found`: 対象リソースなし
* `409 Conflict`: 重複、状態競合、遷移不可
* `422 Unprocessable Entity`: 業務バリデーション違反
* `500 Internal Server Error`: 想定外エラー

## 9.2 共通エラー形式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload.",
    "details": {
      "fields": {
        "businessScope": ["This field is required."]
      }
    }
  }
}
```

## 9.3 推奨エラーコード

* `UNAUTHORIZED`
* `FORBIDDEN`
* `BUSINESS_SCOPE_FORBIDDEN`
* `NOT_FOUND`
* `VALIDATION_ERROR`
* `DUPLICATE_COMPANY`
* `INVALID_STAGE_TRANSITION`
* `DEAL_SCOPE_MISMATCH`
* `CALL_SCOPE_MISMATCH`
* `LARK_SYNC_FAILED`
* `INTERNAL_SERVER_ERROR`

## 9.4 バリデーション方針

* フィールド単位エラーを `details.fields` に格納する。
* UI がそのまま表示できる、実務的で簡潔なメッセージを返す。
* 内部例外文字列はそのまま返さない。

## 9.5 認可エラー方針

* role 不足か scope 不足かをサーバー内部では区別する。
* 外部レスポンスでは必要以上に情報を漏らさない。
* 機密性の高いリソースは 404 を返す設計でもよいが、プロジェクト全体で統一する。

## 9.6 監査ログ対象

最低限、以下は監査ログ出力対象とする。

* ログイン成功 / 失敗
* role 変更
* business scope 変更
* company / contact 更新
* deal 作成 / 更新 / stage 遷移
* call 作成 / 更新
* Lark sync 実行

---

# 10. Recommended API Build Order

## Phase 1: 認証・セッション基盤

1. `GET /api/v1/auth/lark/start`
2. `GET /api/v1/auth/lark/callback`
3. `GET /api/v1/session`
4. `DELETE /api/v1/session`
5. `POST /api/v1/session/scope`

**理由**:

* 全画面共通の前提。
* 権限・scope 判定の基礎になる。

## Phase 2: ユーザー・権限管理

1. `GET /api/v1/me`
2. `GET /api/v1/roles`
3. `GET /api/v1/users`
4. `POST /api/v1/users`
5. `PATCH /api/v1/users/{userId}`

**理由**:

* 運用開始前にユーザー整備が必要。
* role + business scope 制御を早期に固める。

## Phase 3: 顧客管理

1. `GET /api/v1/companies`
2. `POST /api/v1/companies`
3. `GET /api/v1/companies/{companyId}`
4. `PATCH /api/v1/companies/{companyId}`
5. `GET /api/v1/contacts`
6. `POST /api/v1/contacts`
7. `PATCH /api/v1/contacts/{contactId}`
8. `GET /api/v1/companies/{companyId}/timeline`

**理由**:

* 案件・架電の前提データになる。
* 共有 company/contact モデルをここで安定化させる。

## Phase 4: 案件管理

1. `GET /api/v1/pipelines`
2. `GET /api/v1/deals`
3. `POST /api/v1/deals`
4. `GET /api/v1/deals/{dealId}`
5. `PATCH /api/v1/deals/{dealId}`
6. `POST /api/v1/deals/{dealId}/stage-transition`
7. `GET /api/v1/pipelines/board`

**理由**:

* sales_management の中核機能。
* dashboard 集計の一次データにもなる。

## Phase 5: 架電システム

1. `GET /api/v1/calls`
2. `POST /api/v1/calls`
3. `GET /api/v1/calls/{callId}`
4. `PATCH /api/v1/calls/{callId}`
5. `GET /api/v1/call-tasks`
6. `POST /api/v1/call-sessions/start`
7. `POST /api/v1/call-sessions/{sessionId}/end`

**理由**:

* 実運用で入力頻度が高い。
* 案件・顧客との関連整合が必要なため後段に置く。

## Phase 6: ダッシュボード

1. `GET /api/v1/dashboard/summary`
2. `GET /api/v1/dashboard/sales-funnel`
3. `GET /api/v1/dashboard/call-performance`
4. `GET /api/v1/dashboard/owner-ranking`
5. `GET /api/v1/dashboard/activity-feed`

**理由**:

* 集計対象データが揃ってから実装する方が手戻りが少ない。
* KPI 定義の確定を並行しやすい。

## Phase 7: Lark 同期

1. `GET /api/v1/lark/connections/status`
2. `POST /api/v1/lark/sync/users`
3. `GET /api/v1/lark/sync/jobs`
4. `GET /api/v1/lark/sync/jobs/{jobId}`
5. `POST /api/v1/lark/webhooks/users`

**理由**:

* 認証必須だが、業務本体の SoT ではない。
* worker 基盤と合わせて段階導入しやすい。

## 実装優先の補足

MVP の最短ルートは以下。

1. Session
2. Me
3. Accounts
4. Contacts
5. Deals
6. Calls
7. Dashboard summary

この順で実装すると、画面・業務フロー・権限制御の接続確認が最も早く進む。
