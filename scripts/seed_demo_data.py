#!/usr/bin/env python3
"""Seed realistic demo data through the public LMFinanz API.

The script is intentionally API-driven, so it tests the same flows that the
frontend uses: authentication, secured endpoints, validation, balances, and
report data.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_EMAIL = "demo.lmfinanz@example.com"
DEFAULT_PASSWORD = "DemoPass#2026"
DEFAULT_NAME = "Luis Eduardo Martinez Demo"


class ApiClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.token: str | None = None

    def request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        expected: tuple[int, ...] = (200,),
    ) -> tuple[int, Any]:
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {"Accept": "application/json"}
        if payload is not None:
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        request = Request(f"{self.base_url}{path}", data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=20) as response:
                status = response.status
                raw = response.read().decode("utf-8")
                data = json.loads(raw) if raw else None
        except HTTPError as error:
            raw = error.read().decode("utf-8")
            try:
                data = json.loads(raw) if raw else {"message": error.reason}
            except json.JSONDecodeError:
                data = {"message": raw or error.reason}
            return error.code, data
        except URLError as error:
            raise SystemExit(f"Backend is not reachable at {self.base_url}: {error.reason}") from error

        if status not in expected:
            raise SystemExit(f"Unexpected {status} for {method} {path}: {data}")
        return status, data

    def register_or_login(self, email: str, password: str, full_name: str) -> None:
        status, data = self.request(
            "POST",
            "/api/auth/register",
            {"email": email, "password": password, "fullName": full_name},
            expected=(200, 201, 400, 409),
        )
        if status in (200, 201):
            self.token = data["accessToken"]
            return

        status, data = self.request(
            "POST",
            "/api/auth/login",
            {"email": email, "password": password},
            expected=(200,),
        )
        self.token = data["accessToken"]


def find_by_name(items: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    return next((item for item in items if item.get("name") == name), None)


def ensure_named(client: ApiClient, list_path: str, create_path: str, payload: dict[str, Any]) -> dict[str, Any]:
    _, items = client.request("GET", list_path)
    existing = find_by_name(items, payload["name"])
    if existing:
        return existing
    _, created = client.request("POST", create_path, payload, expected=(200, 201))
    return created


def ensure_category(
    client: ApiClient,
    name: str,
    category_type: str,
    parent_id: str | None = None,
) -> dict[str, Any]:
    _, categories = client.request("GET", "/api/categories")
    for category in categories:
        if (
            category.get("name") == name
            and category.get("type") == category_type
            and category.get("parentCategoryId") == parent_id
        ):
            return category

    _, created = client.request(
        "POST",
        "/api/categories",
        {"name": name, "type": category_type, "parentCategoryId": parent_id},
        expected=(200, 201),
    )
    return created


def existing_transaction_descriptions(client: ApiClient) -> set[str]:
    today = date.today()
    from_date = date(today.year, 1, 1).isoformat()
    to_date = today.isoformat()
    _, transactions = client.request("GET", f"/api/transactions?from={from_date}&to={to_date}")
    return {item.get("description") for item in transactions if item.get("description")}


def create_and_post_transaction(
    client: ApiClient,
    descriptions: set[str],
    payload: dict[str, Any],
) -> None:
    description = payload["description"]
    if description in descriptions:
        return
    _, transaction = client.request("POST", "/api/transactions", payload, expected=(200, 201))
    client.request("POST", f"/api/transactions/{transaction['id']}/post", {}, expected=(200,))
    descriptions.add(description)


def seed_demo_data(client: ApiClient) -> None:
    today = date.today()
    start = date(today.year, today.month, 1)
    next_month = (start + timedelta(days=40)).replace(day=1)

    accounts = {
        "n26": ensure_named(
            client,
            "/api/accounts",
            "/api/accounts",
            {
                "name": "N26 Girokonto",
                "type": "BANK_ACCOUNT",
                "currencyCode": "EUR",
                "countryCode": "DE",
                "openingBalance": 2450.75,
            },
        ),
        "cash_de": ensure_named(
            client,
            "/api/accounts",
            "/api/accounts",
            {
                "name": "Bargeld Deutschland",
                "type": "CASH_ACCOUNT",
                "currencyCode": "EUR",
                "countryCode": "DE",
                "openingBalance": 180.0,
            },
        ),
        "bancolombia": ensure_named(
            client,
            "/api/accounts",
            "/api/accounts",
            {
                "name": "Bancolombia Ahorros",
                "type": "BANK_ACCOUNT",
                "currencyCode": "COP",
                "countryCode": "CO",
                "openingBalance": 8450000.0,
            },
        ),
        "wise_usd": ensure_named(
            client,
            "/api/accounts",
            "/api/accounts",
            {
                "name": "Wise USD Wallet",
                "type": "BANK_ACCOUNT",
                "currencyCode": "USD",
                "countryCode": "DE",
                "openingBalance": 1250.0,
            },
        ),
        "visa": ensure_named(
            client,
            "/api/accounts",
            "/api/accounts",
            {
                "name": "Visa Gold",
                "type": "CREDIT_CARD",
                "currencyCode": "EUR",
                "countryCode": "DE",
                "openingBalance": -420.35,
            },
        ),
    }

    income = ensure_category(client, "Ingresos", "INCOME")
    salary = ensure_category(client, "Salario", "INCOME", income["id"])
    freelance = ensure_category(client, "Freelance", "INCOME", income["id"])

    expenses = ensure_category(client, "Gastos", "EXPENSE")
    rent = ensure_category(client, "Arriendo / Hipoteca", "EXPENSE", expenses["id"])
    groceries = ensure_category(client, "Supermercado", "EXPENSE", expenses["id"])
    transport = ensure_category(client, "Transporte", "EXPENSE", expenses["id"])
    restaurants = ensure_category(client, "Restaurantes", "EXPENSE", expenses["id"])
    health = ensure_category(client, "Salud", "EXPENSE", expenses["id"])

    descriptions = existing_transaction_descriptions(client)
    transactions = [
        {
            "type": "INCOME",
            "sourceAccountId": None,
            "targetAccountId": accounts["n26"]["id"],
            "categoryId": salary["id"],
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 4200.0,
            "transactionDate": start.isoformat(),
            "description": "Nomina mensual - Tech Consulting GmbH",
        },
        {
            "type": "EXPENSE",
            "sourceAccountId": accounts["n26"]["id"],
            "targetAccountId": None,
            "categoryId": rent["id"],
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 1250.0,
            "transactionDate": (start + timedelta(days=1)).isoformat(),
            "description": "Alquiler apartamento Berlin",
        },
        {
            "type": "EXPENSE",
            "sourceAccountId": accounts["n26"]["id"],
            "targetAccountId": None,
            "categoryId": groceries["id"],
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 286.42,
            "transactionDate": (today - timedelta(days=5)).isoformat(),
            "description": "Supermercado Rewe y DM",
        },
        {
            "type": "EXPENSE",
            "sourceAccountId": accounts["visa"]["id"],
            "targetAccountId": None,
            "categoryId": restaurants["id"],
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 74.8,
            "transactionDate": (today - timedelta(days=3)).isoformat(),
            "description": "Cena fin de semana",
        },
        {
            "type": "EXPENSE",
            "sourceAccountId": accounts["n26"]["id"],
            "targetAccountId": None,
            "categoryId": transport["id"],
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 49.0,
            "transactionDate": (today - timedelta(days=2)).isoformat(),
            "description": "Deutschlandticket",
        },
        {
            "type": "INCOME",
            "sourceAccountId": None,
            "targetAccountId": accounts["bancolombia"]["id"],
            "categoryId": salary["id"],
            "currencyCode": "COP",
            "countryCode": "CO",
            "amount": 6500000.0,
            "transactionDate": (start + timedelta(days=2)).isoformat(),
            "description": "Ingreso Colombia - consultoria local",
        },
        {
            "type": "EXPENSE",
            "sourceAccountId": accounts["bancolombia"]["id"],
            "targetAccountId": None,
            "categoryId": health["id"],
            "currencyCode": "COP",
            "countryCode": "CO",
            "amount": 320000.0,
            "transactionDate": (today - timedelta(days=6)).isoformat(),
            "description": "Medicina prepagada Colombia",
        },
        {
            "type": "INCOME",
            "sourceAccountId": None,
            "targetAccountId": accounts["wise_usd"]["id"],
            "categoryId": freelance["id"],
            "currencyCode": "USD",
            "countryCode": "DE",
            "amount": 850.0,
            "transactionDate": (today - timedelta(days=8)).isoformat(),
            "description": "Freelance USD - dashboard review",
        },
        {
            "type": "TRANSFER",
            "sourceAccountId": accounts["n26"]["id"],
            "targetAccountId": accounts["cash_de"]["id"],
            "categoryId": None,
            "currencyCode": "EUR",
            "countryCode": "DE",
            "amount": 120.0,
            "transactionDate": (today - timedelta(days=4)).isoformat(),
            "description": "Retiro efectivo Berlin",
        },
    ]
    for transaction in transactions:
        create_and_post_transaction(client, descriptions, transaction)

    ensure_named(
        client,
        "/api/debts",
        "/api/debts",
        {
            "name": "Credito vehiculo Toyota",
            "currencyCode": "COP",
            "principalAmount": 42000000.0,
            "annualInterestRate": 14.5,
            "installments": 36,
            "startDate": today.isoformat(),
            "finalDueDate": (today + timedelta(days=36 * 30)).isoformat(),
        },
    )
    ensure_named(
        client,
        "/api/debts",
        "/api/debts",
        {
            "name": "Prestamo personal Berlin",
            "currencyCode": "EUR",
            "principalAmount": 8500.0,
            "annualInterestRate": 6.2,
            "installments": 24,
            "startDate": today.isoformat(),
            "finalDueDate": (today + timedelta(days=24 * 30)).isoformat(),
        },
    )

    ensure_named(
        client,
        "/api/savings-goals",
        "/api/savings-goals",
        {
            "name": "Fondo de emergencia",
            "currencyCode": "EUR",
            "targetAmount": 10000.0,
            "deadline": (next_month + timedelta(days=365)).isoformat(),
        },
    )
    ensure_named(
        client,
        "/api/savings-goals",
        "/api/savings-goals",
        {
            "name": "Viaje Colombia",
            "currencyCode": "EUR",
            "targetAmount": 4200.0,
            "deadline": (next_month + timedelta(days=210)).isoformat(),
        },
    )

    ensure_named(
        client,
        "/api/assets",
        "/api/assets",
        {
            "name": "Apartamento Berlin",
            "type": "HOUSE",
            "currencyCode": "EUR",
            "countryCode": "DE",
            "estimatedValue": 350000.0,
            "acquisitionDate": "2022-06-15",
            "description": "Apartamento familiar usado como vivienda principal.",
        },
    )
    ensure_named(
        client,
        "/api/assets",
        "/api/assets",
        {
            "name": "Toyota Corolla",
            "type": "VEHICLE",
            "currencyCode": "COP",
            "countryCode": "CO",
            "estimatedValue": 65000000.0,
            "acquisitionDate": "2023-09-20",
            "description": "Vehiculo familiar en Colombia.",
        },
    )
    ensure_named(
        client,
        "/api/assets",
        "/api/assets",
        {
            "name": "MacBook Pro M3",
            "type": "ELECTRONICS",
            "currencyCode": "USD",
            "countryCode": "DE",
            "estimatedValue": 2200.0,
            "acquisitionDate": "2024-11-12",
            "description": "Equipo principal de trabajo.",
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LMFinanz demo data through the REST API.")
    parser.add_argument("--base-url", default="http://localhost:8080", help="Backend base URL")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="Demo user email")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Demo user password")
    parser.add_argument("--full-name", default=DEFAULT_NAME, help="Demo user full name")
    args = parser.parse_args()

    client = ApiClient(args.base_url)
    client.register_or_login(args.email, args.password, args.full_name)
    seed_demo_data(client)

    print("Demo data loaded successfully.")
    print(f"User: {args.email}")
    print(f"Password: {args.password}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("Interrupted")
