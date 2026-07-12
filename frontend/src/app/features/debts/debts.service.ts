import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Debt, DebtInstallment, DebtInstallmentPaymentRequest, DebtRequest } from './debts.models';

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Debt[]> {
    return this.http.get<Debt[]>(`${API_BASE_URL}/api/debts`);
  }

  create(request: DebtRequest): Observable<Debt> {
    return this.http.post<Debt>(`${API_BASE_URL}/api/debts`, request);
  }

  installments(debtId: string): Observable<DebtInstallment[]> {
    return this.http.get<DebtInstallment[]>(`${API_BASE_URL}/api/debts/${debtId}/installments`);
  }

  payInstallment(debtId: string, installmentId: string, request: DebtInstallmentPaymentRequest): Observable<DebtInstallment> {
    return this.http.post<DebtInstallment>(`${API_BASE_URL}/api/debts/${debtId}/installments/${installmentId}/pay`, request);
  }
}
