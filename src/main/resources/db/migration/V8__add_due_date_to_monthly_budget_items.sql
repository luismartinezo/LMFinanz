ALTER TABLE monthly_budget_items
    ADD due_date DATE NULL AFTER due_day;

UPDATE monthly_budget_items
SET due_date = STR_TO_DATE(
        CONCAT(
            budget_year,
            '-',
            LPAD(budget_month, 2, '0'),
            '-',
            LPAD(
                LEAST(
                    due_day,
                    DAY(LAST_DAY(STR_TO_DATE(CONCAT(budget_year, '-', LPAD(budget_month, 2, '0'), '-01'), '%Y-%m-%d')))
                ),
                2,
                '0'
            )
        ),
        '%Y-%m-%d'
    )
WHERE due_day IS NOT NULL
  AND due_date IS NULL;
