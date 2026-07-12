import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { DashboardAccount, DashboardAsset, DashboardDebt, DashboardSavingsGoal, FinancialReport } from './dashboard.models';

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
  }> {
    const params = new HttpParams()
      .set('period', 'MONTHLY')
      .set('from', from)
      .set('to', to);

    return forkJoin({
      report: this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/summary`, { params }),
      accounts: this.http.get<DashboardAccount[]>(`${API_BASE_URL}/api/accounts`),
      debts: this.http.get<DashboardDebt[]>(`${API_BASE_URL}/api/debts`),
      savingsGoals: this.http.get<DashboardSavingsGoal[]>(`${API_BASE_URL}/api/savings-goals`),
      assets: this.http.get<DashboardAsset[]>(`${API_BASE_URL}/api/assets`)
    });
  }
}
