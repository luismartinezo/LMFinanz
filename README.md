# LMFinanz

LMFinanz is a personal finance backend built with Java 21 and Spring Boot 3. The project is designed as a production-ready foundation for managing accounts, transactions, categories, debts, savings goals, assets, countries, currencies, and financial reports.

The current repository contains the backend only. The Angular frontend will be added later.

## Tech Stack

- Java 21
- Spring Boot 3.3
- Spring Security
- JWT authentication
- Spring Data JPA
- MySQL 8
- Flyway
- Docker and Docker Compose
- Maven

## Architecture

The backend follows a hexagonal architecture style:

- `domain`: business entities and domain concepts
- `application`: use cases and ports
- `adapter/in/web`: REST controllers and DTOs
- `adapter/out/persistence`: database adapters and Spring Data repositories
- `shared`: cross-cutting concerns such as security, errors, and base domain models

Main bounded modules:

- `identity`: users, roles, authentication
- `accounts`: bank accounts, cash accounts, credit cards
- `transactions`: income, expenses, transfers
- `categories`: parent categories and subcategories
- `reference`: currencies and countries
- `debts`: debts and installments
- `savings`: savings goals and contributions
- `assets`: inventory of personal assets
- `reports`: reporting ports and DTOs
- `shared`: common infrastructure and reusable domain objects

## Current API

Implemented endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `POST` | `/api/accounts` | Create an account |
| `GET` | `/api/accounts` | List authenticated user's accounts |
| `GET` | `/api/accounts/{accountId}` | Get one authenticated user's account |
| `GET` | `/actuator/health` | Application health check |

## Requirements

- JDK 21
- Maven 3.9+
- Docker Desktop

Check Java version:

```bash
java -version
```

## Local Setup

Start MySQL:

```bash
docker compose up -d mysql
```

The local MySQL container is exposed on port `3307` to avoid conflicts with other local MySQL instances.

Build the backend:

```bash
mvn clean package
```

Run the backend:

```bash
java -jar target/lmfinanz-backend-0.1.0-SNAPSHOT.jar
```

Health check:

```bash
curl http://localhost:8080/actuator/health
```

Expected response:

```json
{
  "status": "UP",
  "groups": ["liveness", "readiness"]
}
```

## Docker Setup

Create a local `.env` file:

```bash
cp .env.example .env
```

Update `JWT_SECRET` with a strong private value.

Start the full stack:

```bash
docker compose up --build
```

Backend URL:

```text
http://localhost:8080
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3307/lmfinanz?...` | JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | `lmfinanz` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `lmfinanz` | Database password |
| `JWT_SECRET` | Development fallback in `application.yml` | JWT signing secret |
| `JWT_EXPIRATION_MINUTES` | `60` | JWT expiration time |
| `SERVER_PORT` | `8080` | Backend HTTP port |

For production, always provide a strong `JWT_SECRET` through the deployment environment.

## Database Migrations

Flyway migrations are stored in:

```text
src/main/resources/db/migration
```

Current migrations:

- `V1__initial_schema.sql`: creates the initial financial domain schema
- `V2__align_code_columns_with_jpa.sql`: aligns currency and country code columns with JPA validation

Hibernate is configured with:

```yaml
spring.jpa.hibernate.ddl-auto: validate
```

This means the database schema must be managed through Flyway migrations.

## Tests

Run tests:

```bash
mvn test
```

Current test coverage focuses on:

- Authentication service
- Account service

## Repository

Remote repository:

```text
https://github.com/luismartinezo/LMFinanz
```

## Roadmap

- Complete CRUD endpoints for categories, transactions, debts, savings goals, assets, and reports
- Add refresh tokens
- Add role management endpoints
- Add integration tests with Testcontainers
- Add Angular frontend
- Add CI pipeline
- Add production deployment configuration
