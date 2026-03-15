# FamBudget — REST API Design

Base URL: `/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

All responses follow the envelope:
```json
{ "data": <payload>, "meta": <pagination?> }
```

All errors follow:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable", "details": {} } }
```

---

## Auth `/api/v1/auth`

### POST `/register`
Register a new user and create a personal family.

**Request**
```json
{
  "name": "Ivan Petrov",
  "email": "ivan@example.com",
  "password": "Str0ng!Pass"
}
```

**Response `201`**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": "", "name": "", "email": "" }
  }
}
```

---

### POST `/login`

**Request**
```json
{ "email": "ivan@example.com", "password": "Str0ng!Pass" }
```

**Response `200`**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": "", "name": "", "email": "", "familyId": "" }
  }
}
```

---

### POST `/refresh`
Exchange refresh token for new access token.

**Request**
```json
{ "refreshToken": "<jwt>" }
```

**Response `200`**
```json
{ "data": { "accessToken": "<jwt>", "refreshToken": "<jwt>" } }
```

---

### POST `/logout`
Invalidates the refresh token server-side.

**Request**
```json
{ "refreshToken": "<jwt>" }
```

**Response `204`** No content.

---

## Families `/api/v1/families`

> All endpoints require auth. Role-restricted actions noted inline.

### GET `/me`
Return the current user's family with all members.

**Response `200`**
```json
{
  "data": {
    "id": "",
    "name": "Petrov Family",
    "members": [
      { "userId": "", "name": "", "email": "", "role": "OWNER", "joinedAt": "" }
    ]
  }
}
```

---

### PATCH `/:familyId`
Rename the family. **OWNER only.**

**Request**
```json
{ "name": "Petrov & Co" }
```

**Response `200`** — Updated family object.

---

### POST `/:familyId/members`
Invite a user by email. **OWNER only.**

**Request**
```json
{ "email": "wife@example.com", "role": "MEMBER" }
```

**Response `201`**
```json
{ "data": { "userId": "", "name": "", "email": "", "role": "MEMBER" } }
```

**Errors**
- `404 USER_NOT_FOUND` — email not registered
- `409 ALREADY_MEMBER` — user already in family

---

### PATCH `/:familyId/members/:userId/role`
Change member role. **OWNER only.**

**Request**
```json
{ "role": "MEMBER" }
```

**Response `200`** — Updated member object.

---

### DELETE `/:familyId/members/:userId`
Remove member from family. **OWNER only.** Cannot remove self.

**Response `204`** No content.

---

## Accounts `/api/v1/accounts`

### GET `/`
List all accounts for current user's family.

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "name": "Tinkoff Card",
      "type": "CHECKING",
      "balance": "125000.00",
      "currency": "RUB",
      "isActive": true
    }
  ]
}
```

---

### POST `/`

**Request**
```json
{
  "name": "Tinkoff Card",
  "type": "CHECKING",
  "balance": "125000.00",
  "currency": "RUB"
}
```

**Response `201`** — Created account object.

---

### PATCH `/:accountId`

**Request** — Any subset of: `name`, `balance`, `isActive`.

**Response `200`** — Updated account object.

---

### DELETE `/:accountId`
Soft-delete (sets `isActive = false`) if account has transactions.
Hard-delete only if no transactions exist.

**Response `204`** No content.

---

## Categories `/api/v1/categories`

### GET `/`
Return system categories + family's custom categories.

**Query params**
| Param | Type | Description |
|---|---|---|
| `type` | `INCOME \| EXPENSE` | Filter by type |

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "name": "Food",
      "icon": "🍕",
      "color": "#FF6B6B",
      "type": "EXPENSE",
      "isSystem": true,
      "parentId": null,
      "children": [
        { "id": "", "name": "Restaurants", "icon": "🍽️" }
      ]
    }
  ]
}
```

---

### POST `/`
Create a custom family category.

**Request**
```json
{
  "name": "Fitness",
  "icon": "💪",
  "color": "#4ECDC4",
  "type": "EXPENSE",
  "parentId": null
}
```

**Response `201`** — Created category object.

---

### PATCH `/:categoryId`
Update custom category. System categories are read-only (`403`).

**Request** — Any subset of: `name`, `icon`, `color`.

**Response `200`** — Updated category object.

---

### DELETE `/:categoryId`
Delete custom category. Fails if transactions reference it (`409`).

**Response `204`** No content.

---

## Transactions `/api/v1/transactions`

### GET `/`
Paginated, filterable transaction list for the family.

**Query params**
| Param | Type | Description |
|---|---|---|
| `from` | `ISO date` | Start date (inclusive) |
| `to` | `ISO date` | End date (inclusive) |
| `categoryId` | `string` | Filter by category |
| `accountId` | `string` | Filter by account |
| `type` | `INCOME\|EXPENSE\|TRANSFER` | Filter by type |
| `source` | `MANUAL\|CSV_IMPORT\|RECURRING` | Filter by source |
| `page` | `number` | Default: 1 |
| `limit` | `number` | Default: 50, max: 200 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "amount": "1500.00",
      "currency": "RUB",
      "type": "EXPENSE",
      "source": "MANUAL",
      "description": "Lunch",
      "merchant": "Vkusvill",
      "date": "2024-03-15T12:00:00Z",
      "isAiClassified": true,
      "category": { "id": "", "name": "Food", "icon": "🍕", "color": "#FF6B6B" },
      "account": { "id": "", "name": "Tinkoff Card" },
      "createdAt": ""
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 248, "totalPages": 5 }
}
```

---

### POST `/`
Create a single transaction manually.

**Request**
```json
{
  "amount": "1500.00",
  "currency": "RUB",
  "type": "EXPENSE",
  "description": "Lunch at Vkusvill",
  "merchant": "Vkusvill",
  "date": "2024-03-15T12:00:00Z",
  "categoryId": "<id>",
  "accountId": "<id>",
  "toAccountId": null
}
```

**Response `201`** — Created transaction object (same shape as list item).

---

### GET `/:transactionId`

**Response `200`** — Single transaction object.

---

### PATCH `/:transactionId`
Update description, category, amount, date. Source becomes `MANUAL` after edit.

**Request** — Any subset of transaction fields.

**Response `200`** — Updated transaction object.

---

### DELETE `/:transactionId`

**Response `204`** No content.

---

## Import `/api/v1/import`

### POST `/csv`
Upload a CSV file for batch transaction import.

**Request** — `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | `File` | CSV file (max 10 MB) |
| `accountId` | `string` | Target account |
| `format` | `string` | Bank format hint: `tinkoff\|sber\|alfa\|generic` |

**Response `202`** — Job accepted, returns job ID for polling.
```json
{
  "data": {
    "jobId": "<uuid>",
    "status": "PENDING",
    "totalRows": 342
  }
}
```

---

### GET `/csv/jobs/:jobId`
Poll import job status.

**Response `200`**
```json
{
  "data": {
    "jobId": "<uuid>",
    "status": "PROCESSING | COMPLETED | FAILED",
    "totalRows": 342,
    "importedRows": 280,
    "skippedRows": 62,
    "failedRows": 0,
    "errors": [],
    "completedAt": null
  }
}
```

`skippedRows` — duplicates detected via `importHash`.

---

## Recurring Rules `/api/v1/recurring`

### GET `/`

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "name": "Netflix",
      "amount": "699.00",
      "currency": "RUB",
      "type": "EXPENSE",
      "frequency": "MONTHLY",
      "startDate": "2024-01-01",
      "endDate": null,
      "nextRunAt": "2024-04-01",
      "isActive": true,
      "category": { "id": "", "name": "Subscriptions" },
      "account": { "id": "", "name": "Tinkoff Card" }
    }
  ]
}
```

---

### POST `/`

**Request**
```json
{
  "name": "Netflix",
  "amount": "699.00",
  "currency": "RUB",
  "type": "EXPENSE",
  "frequency": "MONTHLY",
  "startDate": "2024-01-01",
  "endDate": null,
  "categoryId": "<id>",
  "accountId": "<id>"
}
```

**Response `201`** — Created rule object.

---

### PATCH `/:ruleId`

**Request** — Any subset: `name`, `amount`, `isActive`, `endDate`.

**Response `200`** — Updated rule object.

---

### DELETE `/:ruleId`
Deletes rule. Does NOT delete already-generated transactions.

**Response `204`** No content.

---

## Budgets `/api/v1/budgets`

### GET `/`
List budgets for the family.

**Query params**
| Param | Type | Description |
|---|---|---|
| `month` | `YYYY-MM` | Filter by month |

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "name": "March 2024",
      "month": "2024-03",
      "lines": [
        {
          "categoryId": "",
          "categoryName": "Food",
          "limitAmount": "30000.00",
          "spentAmount": "18500.00",
          "remainingAmount": "11500.00",
          "percentUsed": 61.7
        }
      ],
      "totalLimit": "80000.00",
      "totalSpent": "52300.00"
    }
  ]
}
```

`spentAmount` is calculated at query time from transactions.

---

### POST `/`
Create a budget for a specific month.

**Request**
```json
{
  "name": "March 2024",
  "month": "2024-03",
  "lines": [
    { "categoryId": "<id>", "limitAmount": "30000.00" },
    { "categoryId": "<id>", "limitAmount": "15000.00" }
  ]
}
```

**Response `201`** — Created budget with `lines[]`.

**Errors**
- `409 BUDGET_EXISTS` — budget for this month already exists

---

### PATCH `/:budgetId`
Update budget name or replace category lines.

**Request**
```json
{
  "name": "March (revised)",
  "lines": [
    { "categoryId": "<id>", "limitAmount": "35000.00" }
  ]
}
```

**Response `200`** — Updated budget object.

---

### DELETE `/:budgetId`

**Response `204`** No content.

---

## Analytics `/api/v1/analytics`

> All endpoints are read-only. No auth-mutating side effects.

### GET `/summary`
Totals for a given period.

**Query params**
| Param | Type | Required |
|---|---|---|
| `from` | `ISO date` | Yes |
| `to` | `ISO date` | Yes |

**Response `200`**
```json
{
  "data": {
    "totalIncome": "150000.00",
    "totalExpense": "87300.00",
    "netBalance": "62700.00",
    "transactionCount": 84,
    "currency": "RUB"
  }
}
```

---

### GET `/by-category`
Breakdown of expenses/income by category for a period.

**Query params** — same as `/summary` + `type: INCOME | EXPENSE`

**Response `200`**
```json
{
  "data": [
    {
      "categoryId": "",
      "categoryName": "Food",
      "color": "#FF6B6B",
      "total": "18500.00",
      "percentage": 35.2,
      "transactionCount": 22
    }
  ]
}
```

---

### GET `/trends`
Monthly aggregates over a time range (for line/bar charts).

**Query params**
| Param | Type | Description |
|---|---|---|
| `from` | `YYYY-MM` | Start month |
| `to` | `YYYY-MM` | End month |

**Response `200`**
```json
{
  "data": [
    {
      "month": "2024-01",
      "totalIncome": "150000.00",
      "totalExpense": "92000.00",
      "netBalance": "58000.00"
    },
    {
      "month": "2024-02",
      "totalIncome": "150000.00",
      "totalExpense": "78500.00",
      "netBalance": "71500.00"
    }
  ]
}
```

---

### GET `/forecast`
3-month rolling average forecast based on historical spending.

**Query params**
| Param | Type | Description |
|---|---|---|
| `months` | `number` | Months to forecast (default: 3, max: 6) |

**Response `200`**
```json
{
  "data": {
    "method": "rolling_average_3m",
    "forecast": [
      {
        "month": "2024-04",
        "predictedExpense": "88200.00",
        "predictedIncome": "150000.00",
        "confidenceNote": "Based on last 3 months average"
      }
    ]
  }
}
```

---

## AI Insights `/api/v1/insights`

### GET `/`
List generated insights for the family.

**Query params**
| Param | Type | Description |
|---|---|---|
| `type` | `InsightType` | Filter by insight type |
| `limit` | `number` | Default: 10 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "",
      "type": "SPENDING_PATTERN",
      "content": "Your food spending increased 28% vs last month...",
      "periodStart": "2024-03-01",
      "periodEnd": "2024-03-31",
      "generatedAt": "2024-04-01T08:00:00Z"
    }
  ]
}
```

---

### POST `/generate`
Trigger AI insight generation for a period. Idempotent by `(familyId, month, type)`.

**Request**
```json
{
  "month": "2024-03",
  "types": ["SPENDING_PATTERN", "BUDGET_WARNING", "SAVING_OPPORTUNITY"]
}
```

**Response `202`**
```json
{
  "data": {
    "jobId": "<uuid>",
    "status": "PENDING",
    "requestedTypes": ["SPENDING_PATTERN", "BUDGET_WARNING"]
  }
}
```

---

### GET `/generate/jobs/:jobId`
Poll insight generation job.

**Response `200`**
```json
{
  "data": {
    "jobId": "",
    "status": "COMPLETED",
    "insightIds": ["<id1>", "<id2>"]
  }
}
```

---

### DELETE `/:insightId`

**Response `204`** No content.

---

## Service Responsibilities

| Service | Responsibilities |
|---|---|
| `AuthService` | Hash passwords (bcrypt), sign/verify JWT, refresh token rotation |
| `FamilyService` | CRUD family, manage members, enforce OWNER-only actions |
| `AccountService` | CRUD accounts, balance recalculation on transaction create/delete |
| `CategoryService` | Return merged system + family categories, guard system category mutation |
| `TransactionService` | CRUD with pagination/filter, trigger AI classification after create |
| `CsvImportService` | Parse CSV by bank format, compute `importHash`, batch upsert, report duplicates |
| `RecurringService` | CRUD rules, calculate `nextRunAt`, generate transactions on schedule |
| `BudgetService` | CRUD budgets + lines, join with transaction totals for `spentAmount` |
| `AnalyticsService` | Raw SQL / Prisma aggregations — summary, breakdown, trends |
| `ForecastService` | 3-month rolling average, returns structured forecast (no AI — deterministic) |
| `AiClassifierService` | Send transaction description to OpenAI, return matched `categoryId` |
| `AiInsightsService` | Build prompt from analytics data, call OpenAI, persist result |

---

## HTTP Status Codes Used

| Code | When |
|---|---|
| `200` | Successful GET / PATCH |
| `201` | Resource created |
| `202` | Async job accepted |
| `204` | Successful DELETE |
| `400` | Validation error (Zod) |
| `401` | Missing / invalid token |
| `403` | Authenticated but forbidden (role check) |
| `404` | Resource not found |
| `409` | Conflict (duplicate, constraint) |
| `422` | Business rule violation |
| `500` | Unexpected server error |
