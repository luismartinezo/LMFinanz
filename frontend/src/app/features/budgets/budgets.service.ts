import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { BudgetItem, BudgetItemRequest, CountryCode, CurrencyCode } from './budgets.models';

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private readonly http = inject(HttpClient);

  list(budgetYear: number, budgetMonth: number, countryCode?: CountryCode, currencyCode?: CurrencyCode): Observable<BudgetItem[]> {
    let params = new HttpParams().set('budgetYear', budgetYear).set('budgetMonth', budgetMonth);
    if (countryCode) {
      params = params.set('countryCode', countryCode);
    }
    if (currencyCode) {
      params = params.set('currencyCode', currencyCode);
    }
    return this.http.get<BudgetItem[]>(`${API_BASE_URL}/api/budget-items`, { params });
  }

  create(request: BudgetItemRequest): Observable<BudgetItem> {
    return this.http.post<BudgetItem>(`${API_BASE_URL}/api/budget-items`, request);
  }

  markPaid(itemId: string, actualAmount: number, paidDate: string): Observable<BudgetItem> {
    return this.http.patch<BudgetItem>(`${API_BASE_URL}/api/budget-items/${itemId}/pay`, { actualAmount, paidDate });
  }

  markUnpaid(itemId: string): Observable<BudgetItem> {
    return this.http.patch<BudgetItem>(`${API_BASE_URL}/api/budget-items/${itemId}/unpay`, {});
  }
}
