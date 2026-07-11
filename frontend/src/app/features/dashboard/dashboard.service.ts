import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { FinancialReport } from './dashboard.models';

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
}
