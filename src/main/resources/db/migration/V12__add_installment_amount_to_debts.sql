ALTER TABLE debts
    ADD COLUMN installment_amount DECIMAL(19,4) NULL AFTER annual_interest_rate;

UPDATE debts
SET installment_amount = ROUND(
    CASE
        WHEN installments > 0 THEN (principal_amount + (principal_amount * annual_interest_rate / 100)) / installments
        ELSE principal_amount
    END,
    4
)
WHERE installment_amount IS NULL;

ALTER TABLE debts
    MODIFY COLUMN installment_amount DECIMAL(19,4) NOT NULL;
