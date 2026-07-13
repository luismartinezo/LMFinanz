CREATE TABLE monthly_budget_summaries (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    budget_year INT NOT NULL,
    budget_month INT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    income_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
    notes VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    created_by BINARY(16) NULL,
    updated_by BINARY(16) NULL,
    UNIQUE KEY uk_monthly_budget_summary_period (user_id, budget_year, budget_month, country_code, currency_code),
    INDEX idx_monthly_budget_summary_user_period (user_id, budget_year, budget_month)
);
