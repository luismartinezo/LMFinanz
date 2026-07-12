import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { FinancialReport, ReportFilters } from './reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  load(filters: ReportFilters): Observable<FinancialReport> {
    const params = this.dateParams(filters);

    if (filters.mode === 'CURRENCY') {
      return this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/by-currency/${filters.currencyCode}`, { params });
    }

    if (filters.mode === 'COUNTRY') {
      return this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/by-country/${filters.countryCode}`, { params });
    }

    return this.http.get<FinancialReport>(`${API_BASE_URL}/api/reports/summary`, {
      params: params.set('period', filters.period)
    });
  }

  private dateParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams();
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    return params;
  }
}
