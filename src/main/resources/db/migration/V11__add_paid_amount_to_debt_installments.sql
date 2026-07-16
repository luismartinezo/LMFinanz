ALTER TABLE debt_installments
    ADD COLUMN paid_amount DECIMAL(19,4) NULL AFTER paid_date;
