import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Debt, DebtRequest } from './debts.models';

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Debt[]> {
    return this.http.get<Debt[]>(`${API_BASE_URL}/api/debts`);
  }

  create(request: DebtRequest): Observable<Debt> {
    return this.http.post<Debt>(`${API_BASE_URL}/api/debts`, request);
  }
}
