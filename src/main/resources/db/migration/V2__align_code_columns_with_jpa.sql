ALTER TABLE currencies
    MODIFY code VARCHAR(3) NOT NULL;

ALTER TABLE countries
    MODIFY code VARCHAR(2) NOT NULL,
    MODIFY default_currency_code VARCHAR(3) NOT NULL;

ALTER TABLE accounts
    MODIFY currency_code VARCHAR(3) NOT NULL,
    MODIFY country_code VARCHAR(2) NOT NULL;

ALTER TABLE transactions
    MODIFY currency_code VARCHAR(3) NOT NULL,
    MODIFY country_code VARCHAR(2) NOT NULL;

ALTER TABLE debts
    MODIFY currency_code VARCHAR(3) NOT NULL;

ALTER TABLE savings_goals
    MODIFY currency_code VARCHAR(3) NOT NULL;

ALTER TABLE assets
    MODIFY currency_code VARCHAR(3) NOT NULL,
    MODIFY country_code VARCHAR(2) NOT NULL;
