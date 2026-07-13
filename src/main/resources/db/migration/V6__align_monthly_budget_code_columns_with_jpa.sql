ALTER TABLE monthly_budget_items
    MODIFY currency_code VARCHAR(3) NOT NULL,
    MODIFY country_code VARCHAR(2) NOT NULL;
