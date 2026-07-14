import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import {
  DashboardAccount,
  DashboardAsset,
  DashboardBudgetSummary,
  DashboardDebt,
  DashboardSavingsGoal,
  DashboardTransaction,
  FinancialReport
} from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  monthlySummary(from: string, to: string): Observable<FinancialReport> {
    const params = new HttpParams()
      .set('period', 'MONTHLY')
      .set('from', from)
      .set('to', to);

    return this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/summary`, { params });
  }

  overview(from: string, to: string): Observable<{
    report: FinancialReport;
    accounts: DashboardAccount[];
    debts: DashboardDebt[];
    savingsGoals: DashboardSavingsGoal[];
    assets: DashboardAsset[];
    transactions: DashboardTransaction[];
    incomeSummaries: DashboardBudgetSummary[];
  }> {
    const periodDate = new Date(`${from}T00:00:00`);
    const year = periodDate.getFullYear();
    const month = periodDate.getMonth() + 1;
    const params = new HttpParams()
      .set('period', 'MONTHLY')
      .set('from', from)
      .set('to', to);

    return forkJoin({
      report: this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/summary`, { params }),
      accounts: this.http.get<DashboardAccount[]>(`${API_BASE_URL}/api/accounts`),
      debts: this.http.get<DashboardDebt[]>(`${API_BASE_URL}/api/debts`),
      savingsGoals: this.http.get<DashboardSavingsGoal[]>(`${API_BASE_URL}/api/savings-goals`),
      assets: this.http.get<DashboardAsset[]>(`${API_BASE_URL}/api/assets`),
      transactions: this.http.get<DashboardTransaction[]>(`${API_BASE_URL}/api/transactions`, {
        params: this.dateParams(from, to)
      }),
      incomeSummaries: forkJoin([
        this.budgetSummary(year, month, 'DE', 'EUR'),
        this.budgetSummary(year, month, 'CO', 'COP')
      ])
    });
  }

  saveBudgetSummary(request: {
    budgetYear: number;
    budgetMonth: number;
    countryCode: string;
    currencyCode: string;
    incomeAmount: number;
    notes: string | null;
  }): Observable<DashboardBudgetSummary> {
    return this.http.put<DashboardBudgetSummary>(`${API_BASE_URL}/api/budget-summaries`, request);
  }

  private dateParams(from: string, to: string): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }

  private budgetSummary(
    budgetYear: number,
    budgetMonth: number,
    countryCode: string,
    currencyCode: string
  ): Observable<DashboardBudgetSummary> {
    const params = new HttpParams()
      .set('budgetYear', budgetYear)
      .set('budgetMonth', budgetMonth)
      .set('countryCode', countryCode)
      .set('currencyCode', currencyCode);

    return this.http.get<DashboardBudgetSummary>(`${API_BASE_URL}/api/budget-summaries`, { params });
  }
}
