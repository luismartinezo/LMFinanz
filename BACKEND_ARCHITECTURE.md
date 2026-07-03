# LMFinanz Backend Architecture

## Architecture Style

The backend follows hexagonal architecture. Each business module is split into:

- `domain`: entities, enums, and domain rules.
- `application.port.in`: use case interfaces called by inbound adapters.
- `application.port.out`: outbound interfaces implemented by persistence, security, or external adapters.
- `adapter.in.web.dto`: API request and response DTOs with validation.
- `adapter.out`: infrastructure implementations, added only where architecture requires an executable adapter now.

## Modules

### `identity`

Owns users, roles, authentication contracts, and role-based security identity.

Entities:

- `User`
- `Role`

Ports:

- `AuthUseCase`
- `UserRepositoryPort`

### `accounts`

Owns bank accounts, cash accounts, and credit cards. Accounts carry a single currency and country context.

Entities:

- `Account`

Ports:

- `AccountUseCase`
- `AccountRepositoryPort`

### `transactions`

Owns income, expenses, and transfers. Transactions reference accounts and categories by ID to keep aggregate boundaries clear.

Entities:

- `Transaction`

Ports:

- `TransactionUseCase`
- `TransactionRepositoryPort`

### `categories`

Owns parent categories and subcategories for income and expense classification.

Entities:

- `Category`

Ports:

- `CategoryUseCase`
- `CategoryRepositoryPort`

### `reference`

Owns reference data for currencies and countries. These are database-backed so future countries and currencies can be added without code changes.

Entities:

- `Currency`
- `Country`

Ports:

- `ReferenceDataUseCase`
- `ReferenceDataRepositoryPort`

### `debts`

Owns structured debts and installment schedules.

Entities:

- `Debt`
- `DebtInstallment`

Ports:

- `DebtUseCase`
- `DebtRepositoryPort`

### `savings`

Owns savings goals and contributions. Contributions can optionally link back to transactions.

Entities:

- `SavingsGoal`
- `SavingsContribution`

Ports:

- `SavingsGoalUseCase`
- `SavingsGoalRepositoryPort`

### `assets`

Owns asset inventory for houses, vehicles, electronics, furniture, and other assets.

Entities:

- `Asset`

Ports:

- `AssetUseCase`
- `AssetRepositoryPort`

### `reports`

Reports are read models, not domain aggregates. They summarize transactions, assets, debts, and savings by period, currency, and country.

Ports:

- `ReportQueryUseCase`
- `ReportReadModelPort`

### `shared`

Contains cross-cutting technical building blocks.

Includes:

- `BaseEntity`
- `Money`
- domain exceptions
- global API error response
- global exception handler
- JWT principal, token port, authentication filter, and security configuration

## Persistence

Flyway owns the database schema. Hibernate is configured with `ddl-auto: validate`, so schema evolution must happen through migrations.

Initial migration:

- `src/main/resources/db/migration/V1__initial_schema.sql`

## Docker

Docker support includes:

- `Dockerfile`
- `docker-compose.yml`

The compose file starts MySQL 8.4 and the Spring Boot backend.
