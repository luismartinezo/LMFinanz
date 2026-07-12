# Demo Data

Use this data set to test the application with realistic financial information for Germany, Colombia, EUR, COP, and USD.

## Demo User

```text
Email: demo.lmfinanz@example.com
Password: DemoPass#2026
```

## Load Data

Start MySQL and the backend first:

```bash
docker compose up -d mysql backend
```

Then run:

```bash
python3 scripts/seed_demo_data.py
```

If the user already exists, the script logs in and reuses it. Named accounts, categories, debts, savings goals, and assets are reused to avoid duplicates. Transactions are skipped when the same description already exists in the current year.

## Included Data

- Accounts:
  - N26 Girokonto, EUR, Germany
  - Bargeld Deutschland, EUR, Germany
  - Bancolombia Ahorros, COP, Colombia
  - Wise USD Wallet, USD, Germany
  - Visa Gold, EUR, Germany

- Categories:
  - Income: Salario, Freelance
  - Expenses: Arriendo / Hipoteca, Supermercado, Transporte, Restaurantes, Salud

- Transactions:
  - Salary, rent, groceries, restaurants, transport, Colombian income, health payment, USD freelance income, and a cash transfer.

- Debts:
  - Credito vehiculo Toyota
  - Prestamo personal Berlin

- Savings goals:
  - Fondo de emergencia
  - Viaje Colombia

- Assets:
  - Apartamento Berlin
  - Toyota Corolla
  - MacBook Pro M3
