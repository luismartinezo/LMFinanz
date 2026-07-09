# LMFinanz API Endpoints

Base URL:

```text
http://localhost:8080
```

All endpoints return JSON.

Interactive documentation:

```text
http://localhost:8080/swagger-ui.html
```

Generated OpenAPI document:

```text
http://localhost:8080/v3/api-docs
```

## Authentication

Public endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /actuator/health`

All other endpoints require a JWT access token:

```http
Authorization: Bearer <accessToken>
```

## Common Error Response

Validation and domain errors use this structure:

```json
{
  "timestamp": "2026-07-07T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "violations": [
    {
      "field": "email",
      "message": "must be a well-formed email address"
    }
  ]
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200` | Successful request |
| `201` | Resource created |
| `400` | Request validation failed |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Conflict, such as duplicate user |
| `422` | Domain rule violation |

## Enums

```text
AccountType: BANK_ACCOUNT, CASH_ACCOUNT, CREDIT_CARD
CategoryType: INCOME, EXPENSE
TransactionType: INCOME, EXPENSE, TRANSFER
TransactionStatus: DRAFT, POSTED, CANCELLED
DebtStatus: ACTIVE, PAID, DEFAULTED, CANCELLED
InstallmentStatus: PENDING, PAID, OVERDUE
SavingsGoalStatus: ACTIVE, COMPLETED, CANCELLED
AssetType: HOUSE, VEHICLE, ELECTRONICS, FURNITURE, OTHER
ReportPeriod: DAILY, MONTHLY, YEARLY, CUSTOM
```

Supported reference data:

```text
Currencies: EUR, COP, USD
Countries: DE, CO
```

## Auth

### Register User

```http
POST /api/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "fullName": "Luis Martinez"
}
```

Response `200`:

```json
{
  "userId": "0d3bb389-4317-40a1-b7e9-e242b70f4c94",
  "email": "user@example.com",
  "fullName": "Luis Martinez",
  "roles": ["ROLE_USER"],
  "accessToken": "<jwt>"
}
```

Validation:

- `email`: required, valid email
- `password`: required, 10 to 120 characters
- `fullName`: required, max 140 characters

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Response `200`:

```json
{
  "userId": "0d3bb389-4317-40a1-b7e9-e242b70f4c94",
  "email": "user@example.com",
  "fullName": "Luis Martinez",
  "roles": ["ROLE_USER"],
  "accessToken": "<jwt>"
}
```

## Reference Data

Reference data endpoints are public and do not require JWT authentication.

### List Currencies

```http
GET /api/reference/currencies
```

Response `200`:

```json
[
  {
    "code": "EUR",
    "name": "Euro",
    "symbol": "EUR",
    "decimalPlaces": 2
  }
]
```

### List Countries

```http
GET /api/reference/countries
```

Response `200`:

```json
[
  {
    "code": "DE",
    "name": "Germany",
    "defaultCurrencyCode": "EUR",
    "active": true
  }
]
```

## Accounts

### Create Account

```http
POST /api/accounts
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "name": "Main bank account",
  "type": "BANK_ACCOUNT",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "openingBalance": 1000.00
}
```

Response `201`:

```json
{
  "id": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "name": "Main bank account",
  "type": "BANK_ACCOUNT",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "currentBalance": 1000.0000,
  "active": true
}
```

Validation:

- `name`: required, max 120 characters
- `type`: required
- `currencyCode`: required, 3 uppercase letters
- `countryCode`: required, 2 uppercase letters
- `openingBalance`: required

### List Accounts

```http
GET /api/accounts
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
    "name": "Main bank account",
    "type": "BANK_ACCOUNT",
    "currencyCode": "EUR",
    "countryCode": "DE",
    "currentBalance": 1000.0000,
    "active": true
  }
]
```

### Get Account

```http
GET /api/accounts/{accountId}
Authorization: Bearer <accessToken>
```

Response `200`: same shape as create account response.

## Categories

### Create Category

```http
POST /api/categories
Authorization: Bearer <accessToken>
```

Request for a root category:

```json
{
  "parentCategoryId": null,
  "name": "Food",
  "type": "EXPENSE"
}
```

Request for a subcategory:

```json
{
  "parentCategoryId": "99a451a6-8e58-4e3e-a739-f8d53bf8a7b4",
  "name": "Groceries",
  "type": "EXPENSE"
}
```

Response `201`:

```json
{
  "id": "d46e4b77-0c54-4e5b-9b75-348d05e8886f",
  "parentCategoryId": null,
  "name": "Food",
  "type": "EXPENSE",
  "systemDefined": false,
  "active": true
}
```

Domain rules:

- Subcategory parent must belong to the same authenticated user.
- Subcategory type must match parent category type.

### List Categories

```http
GET /api/categories
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "d46e4b77-0c54-4e5b-9b75-348d05e8886f",
    "parentCategoryId": null,
    "name": "Food",
    "type": "EXPENSE",
    "systemDefined": false,
    "active": true
  }
]
```

### Get Category

```http
GET /api/categories/{categoryId}
Authorization: Bearer <accessToken>
```

Response `200`: same shape as create category response.

## Transactions

Transactions are created as `DRAFT`. Posting a transaction changes its status to `POSTED` and updates account balances.

### Create Income Transaction

```http
POST /api/transactions
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "type": "INCOME",
  "sourceAccountId": null,
  "targetAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "categoryId": "34952fd7-5467-4c18-a925-cf6f61392ee2",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "amount": 1000.00,
  "transactionDate": "2026-07-07",
  "description": "Salary"
}
```

Response `201`:

```json
{
  "id": "aa590e04-7a5a-49e1-b57b-1683211af948",
  "type": "INCOME",
  "sourceAccountId": null,
  "targetAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "categoryId": "34952fd7-5467-4c18-a925-cf6f61392ee2",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "amount": 1000.0000,
  "transactionDate": "2026-07-07",
  "description": "Salary",
  "status": "DRAFT"
}
```

### Create Expense Transaction

```http
POST /api/transactions
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "type": "EXPENSE",
  "sourceAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "targetAccountId": null,
  "categoryId": "d46e4b77-0c54-4e5b-9b75-348d05e8886f",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "amount": 25.50,
  "transactionDate": "2026-07-07",
  "description": "Lunch"
}
```

### Create Transfer Transaction

```http
POST /api/transactions
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "type": "TRANSFER",
  "sourceAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "targetAccountId": "6af47eb4-fc4d-460a-8e2a-df2d2f54ba2f",
  "categoryId": null,
  "currencyCode": "EUR",
  "countryCode": "DE",
  "amount": 150.00,
  "transactionDate": "2026-07-07",
  "description": "Move to savings account"
}
```

Domain rules:

- `INCOME`: requires `targetAccountId`, no `sourceAccountId`, category type `INCOME`.
- `EXPENSE`: requires `sourceAccountId`, no `targetAccountId`, category type `EXPENSE`.
- `TRANSFER`: requires source and target accounts, no category.
- Source and target accounts must be different.
- Transaction currency and country must match involved account currency and country.
- Posting an expense or transfer debits the source account.
- Non-credit-card accounts cannot go below zero.

### Post Transaction

```http
POST /api/transactions/{transactionId}/post
Authorization: Bearer <accessToken>
```

Response `200`:

```json
{
  "id": "aa590e04-7a5a-49e1-b57b-1683211af948",
  "type": "INCOME",
  "sourceAccountId": null,
  "targetAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
  "categoryId": "34952fd7-5467-4c18-a925-cf6f61392ee2",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "amount": 1000.0000,
  "transactionDate": "2026-07-07",
  "description": "Salary",
  "status": "POSTED"
}
```

### List Transactions

```http
GET /api/transactions?from=2026-07-01&to=2026-07-31
Authorization: Bearer <accessToken>
```

Query parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `from` | No | Start date, defaults to `1970-01-01` |
| `to` | No | End date, defaults to current date |

Response `200`:

```json
[
  {
    "id": "aa590e04-7a5a-49e1-b57b-1683211af948",
    "type": "INCOME",
    "sourceAccountId": null,
    "targetAccountId": "7cc650f0-cce9-4756-adcc-65b757dc8fa0",
    "categoryId": "34952fd7-5467-4c18-a925-cf6f61392ee2",
    "currencyCode": "EUR",
    "countryCode": "DE",
    "amount": 1000.0000,
    "transactionDate": "2026-07-07",
    "description": "Salary",
    "status": "POSTED"
  }
]
```

## Reports

Reports include only `POSTED` transactions.

### Summary Report

```http
GET /api/reports/summary?period=MONTHLY&from=2026-07-01&to=2026-07-31
Authorization: Bearer <accessToken>
```

Query parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `period` | No | `DAILY`, `MONTHLY`, `YEARLY`, `CUSTOM`; defaults to `MONTHLY` |
| `from` | No | Start date |
| `to` | No | End date |

Response `200`:

```json
{
  "period": "MONTHLY",
  "from": "2026-07-01",
  "to": "2026-07-31",
  "totalIncome": 1000.0000,
  "totalExpenses": 250.0000,
  "netCashFlow": 750.0000,
  "breakdown": [
    {
      "label": "2026-07",
      "currencyCode": "EUR",
      "countryCode": "DE",
      "amount": 750.0000
    }
  ]
}
```

### Report By Currency

```http
GET /api/reports/by-currency/EUR?from=2026-07-01&to=2026-07-31
Authorization: Bearer <accessToken>
```

Response `200`: same shape as summary report.

### Report By Country

```http
GET /api/reports/by-country/DE?from=2026-07-01&to=2026-07-31
Authorization: Bearer <accessToken>
```

Response `200`: same shape as summary report.

## Debts

### Create Debt

```http
POST /api/debts
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "name": "Car loan",
  "currencyCode": "EUR",
  "principalAmount": 1000.00,
  "annualInterestRate": 12.00,
  "installments": 2,
  "startDate": "2026-07-01",
  "finalDueDate": "2026-08-01"
}
```

Response `201`:

```json
{
  "id": "1d50da64-504a-4707-a168-86c62c31e0fa",
  "name": "Car loan",
  "currencyCode": "EUR",
  "principalAmount": 1000.0000,
  "annualInterestRate": 12.0000,
  "installments": 2,
  "startDate": "2026-07-01",
  "finalDueDate": "2026-08-01",
  "remainingBalance": 1000.0000,
  "status": "ACTIVE"
}
```

Domain rules:

- Currency must be supported.
- Final due date must be after or equal to start date.
- Installment count cannot exceed the number of months in the debt period.
- Creating a debt automatically creates its installment schedule.

### List Debts

```http
GET /api/debts
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "1d50da64-504a-4707-a168-86c62c31e0fa",
    "name": "Car loan",
    "currencyCode": "EUR",
    "principalAmount": 1000.0000,
    "annualInterestRate": 12.0000,
    "installments": 2,
    "startDate": "2026-07-01",
    "finalDueDate": "2026-08-01",
    "remainingBalance": 1000.0000,
    "status": "ACTIVE"
  }
]
```

### Get Debt

```http
GET /api/debts/{debtId}
Authorization: Bearer <accessToken>
```

Response `200`: same shape as create debt response.

### List Debt Installments

```http
GET /api/debts/{debtId}/installments
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "f3e6d2ee-1468-4532-9aaa-633f54fb2bc5",
    "debtId": "1d50da64-504a-4707-a168-86c62c31e0fa",
    "installmentNumber": 1,
    "amount": 560.0000,
    "principalAmount": 500.0000,
    "interestAmount": 60.0000,
    "dueDate": "2026-07-01",
    "paidDate": null,
    "paymentTransactionId": null,
    "status": "PENDING"
  }
]
```

## Savings Goals

### Create Savings Goal

```http
POST /api/savings-goals
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "name": "Emergency fund",
  "currencyCode": "EUR",
  "targetAmount": 1000.00,
  "deadline": "2026-12-31"
}
```

Response `201`:

```json
{
  "id": "c641db8a-ccaa-4e6c-9777-3926dc30f912",
  "name": "Emergency fund",
  "currencyCode": "EUR",
  "targetAmount": 1000.0000,
  "currentAmount": 0,
  "deadline": "2026-12-31",
  "status": "ACTIVE"
}
```

Validation:

- `deadline`: must be a future date.
- `currencyCode`: must be supported.

### Add Savings Contribution

```http
POST /api/savings-goals/{goalId}/contributions
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "transactionId": null,
  "amount": 400.00,
  "contributionDate": "2026-07-07"
}
```

Response `200`:

```json
{
  "id": "c641db8a-ccaa-4e6c-9777-3926dc30f912",
  "name": "Emergency fund",
  "currencyCode": "EUR",
  "targetAmount": 1000.0000,
  "currentAmount": 400.0000,
  "deadline": "2026-12-31",
  "status": "ACTIVE"
}
```

Domain rules:

- Only active savings goals can receive contributions.
- When `currentAmount >= targetAmount`, status becomes `COMPLETED`.

### List Savings Goals

```http
GET /api/savings-goals
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "c641db8a-ccaa-4e6c-9777-3926dc30f912",
    "name": "Emergency fund",
    "currencyCode": "EUR",
    "targetAmount": 1000.0000,
    "currentAmount": 400.0000,
    "deadline": "2026-12-31",
    "status": "ACTIVE"
  }
]
```

### Get Savings Goal

```http
GET /api/savings-goals/{goalId}
Authorization: Bearer <accessToken>
```

Response `200`: same shape as create savings goal response.

## Assets

### Create Asset

```http
POST /api/assets
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "name": "Car",
  "type": "VEHICLE",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "estimatedValue": 12000.00,
  "acquisitionDate": "2025-01-10",
  "description": "Primary vehicle"
}
```

Response `201`:

```json
{
  "id": "6126e5e2-d90b-4469-967f-80dc0c7d8ac2",
  "name": "Car",
  "type": "VEHICLE",
  "currencyCode": "EUR",
  "countryCode": "DE",
  "estimatedValue": 12000.0000,
  "acquisitionDate": "2025-01-10",
  "description": "Primary vehicle",
  "active": true
}
```

Validation:

- `name`: required, max 140 characters
- `type`: required
- `currencyCode`: required, supported 3-letter code
- `countryCode`: required, supported 2-letter code
- `estimatedValue`: required, minimum `0.0000`
- `acquisitionDate`: optional, must be past or present
- `description`: optional, max 500 characters

### List Assets

```http
GET /api/assets
Authorization: Bearer <accessToken>
```

Response `200`:

```json
[
  {
    "id": "6126e5e2-d90b-4469-967f-80dc0c7d8ac2",
    "name": "Car",
    "type": "VEHICLE",
    "currencyCode": "EUR",
    "countryCode": "DE",
    "estimatedValue": 12000.0000,
    "acquisitionDate": "2025-01-10",
    "description": "Primary vehicle",
    "active": true
  }
]
```

### Get Asset

```http
GET /api/assets/{assetId}
Authorization: Bearer <accessToken>
```

Response `200`: same shape as create asset response.

## Health Check

```http
GET /actuator/health
```

Response `200`:

```json
{
  "status": "UP",
  "groups": ["liveness", "readiness"]
}
```

## Quick Test Flow

1. Register or login and copy `accessToken`.
2. Create an account.
3. Create an income category and an expense category.
4. Create a draft transaction.
5. Post the transaction.
6. Check account balance.
7. Query reports.

Minimal curl example:

```bash
TOKEN=$(curl --silent --request POST http://localhost:8080/api/auth/login \
  --header 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"StrongPass123!"}' \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

curl --silent http://localhost:8080/api/accounts \
  --header "Authorization: Bearer $TOKEN"
```
