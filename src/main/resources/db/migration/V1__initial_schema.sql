CREATE TABLE roles (
    id BINARY(16) PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE users (
    id BINARY(16) PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(140) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE user_roles (
    user_id BINARY(16) NOT NULL,
    role_id BINARY(16) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE currencies (
    id BINARY(16) PRIMARY KEY,
    code CHAR(3) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL,
    symbol VARCHAR(8) NOT NULL,
    decimal_places INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE countries (
    id BINARY(16) PRIMARY KEY,
    code CHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    default_currency_code CHAR(3) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE accounts (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(30) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    country_code CHAR(2) NOT NULL,
    opening_balance DECIMAL(19,4) NOT NULL,
    current_balance DECIMAL(19,4) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_accounts_user (user_id)
);

CREATE TABLE categories (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    parent_category_id BINARY(16),
    name VARCHAR(120) NOT NULL,
    type VARCHAR(20) NOT NULL,
    system_defined BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_categories_user (user_id),
    INDEX idx_categories_parent (parent_category_id)
);

CREATE TABLE transactions (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    type VARCHAR(20) NOT NULL,
    source_account_id BINARY(16),
    target_account_id BINARY(16),
    category_id BINARY(16),
    currency_code CHAR(3) NOT NULL,
    country_code CHAR(2) NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    transaction_date DATE NOT NULL,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_transactions_user_date (user_id, transaction_date),
    INDEX idx_transactions_source_account (source_account_id),
    INDEX idx_transactions_target_account (target_account_id),
    INDEX idx_transactions_category (category_id)
);

CREATE TABLE debts (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    name VARCHAR(140) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    principal_amount DECIMAL(19,4) NOT NULL,
    annual_interest_rate DECIMAL(8,4) NOT NULL,
    installments INT NOT NULL,
    start_date DATE NOT NULL,
    final_due_date DATE NOT NULL,
    remaining_balance DECIMAL(19,4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_debts_user (user_id)
);

CREATE TABLE debt_installments (
    id BINARY(16) PRIMARY KEY,
    debt_id BINARY(16) NOT NULL,
    installment_number INT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    principal_amount DECIMAL(19,4) NOT NULL,
    interest_amount DECIMAL(19,4) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    paid_amount DECIMAL(19,4),
    payment_transaction_id BINARY(16),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_installments_debt (debt_id),
    INDEX idx_installments_due_date (due_date)
);

CREATE TABLE savings_goals (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    name VARCHAR(140) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    target_amount DECIMAL(19,4) NOT NULL,
    current_amount DECIMAL(19,4) NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_savings_goals_user (user_id)
);

CREATE TABLE savings_contributions (
    id BINARY(16) PRIMARY KEY,
    savings_goal_id BINARY(16) NOT NULL,
    transaction_id BINARY(16),
    amount DECIMAL(19,4) NOT NULL,
    contribution_date DATE NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_savings_contributions_goal (savings_goal_id)
);

CREATE TABLE assets (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    name VARCHAR(140) NOT NULL,
    type VARCHAR(30) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    country_code CHAR(2) NOT NULL,
    estimated_value DECIMAL(19,4) NOT NULL,
    acquisition_date DATE,
    description VARCHAR(500),
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_assets_user (user_id)
);

INSERT INTO currencies (id, code, name, symbol, decimal_places, created_at, updated_at)
VALUES
    (UUID_TO_BIN(UUID()), 'EUR', 'Euro', 'EUR', 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (UUID_TO_BIN(UUID()), 'COP', 'Colombian Peso', 'COP', 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (UUID_TO_BIN(UUID()), 'USD', 'US Dollar', 'USD', 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

INSERT INTO countries (id, code, name, default_currency_code, active, created_at, updated_at)
VALUES
    (UUID_TO_BIN(UUID()), 'DE', 'Germany', 'EUR', true, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (UUID_TO_BIN(UUID()), 'CO', 'Colombia', 'COP', true, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

INSERT INTO roles (id, name, created_at, updated_at)
VALUES
    (UUID_TO_BIN(UUID()), 'ROLE_ADMIN', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (UUID_TO_BIN(UUID()), 'ROLE_USER', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
