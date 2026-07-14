ALTER TABLE monthly_budget_items
    ADD COLUMN item_type VARCHAR(30) NOT NULL DEFAULT 'EXPENSE' AFTER name;
