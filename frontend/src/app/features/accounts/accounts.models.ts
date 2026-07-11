export type AccountType = 'BANK_ACCOUNT' | 'CASH_ACCOUNT' | 'CREDIT_CARD';
export type CurrencyCode = 'EUR' | 'COP' | 'USD';
export type CountryCode = 'DE' | 'CO';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  countryCode: CountryCode;
  currentBalance: number;
  active: boolean;
}

export interface AccountRequest {
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  countryCode: CountryCode;
  openingBalance: number;
}
