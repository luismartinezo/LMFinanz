import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Debt, DebtInstallment, DebtInstallmentPaymentRequest, DebtInstallmentRequest, DebtRequest } from './debts.models';

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Debt[]> {
    return this.http.get<Debt[]>(`${API_BASE_URL}/api/debts`);
  }

  create(request: DebtRequest): Observable<Debt> {
    return this.http.post<Debt>(`${API_BASE_URL}/api/debts`, request);
  }

  update(debtId: string, request: DebtRequest): Observable<Debt> {
    return this.http.put<Debt>(`${API_BASE_URL}/api/debts/${debtId}`, request);
  }

  delete(debtId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/debts/${debtId}`);
  }

  installments(debtId: string): Observable<DebtInstallment[]> {
    return this.http.get<DebtInstallment[]>(`${API_BASE_URL}/api/debts/${debtId}/installments`);
  }

  payInstallment(debtId: string, installmentId: string, request: DebtInstallmentPaymentRequest): Observable<DebtInstallment> {
    return this.http.post<DebtInstallment>(`${API_BASE_URL}/api/debts/${debtId}/installments/${installmentId}/pay`, request);
  }

  updateInstallment(debtId: string, installmentId: string, request: DebtInstallmentRequest): Observable<DebtInstallment> {
    return this.http.put<DebtInstallment>(`${API_BASE_URL}/api/debts/${debtId}/installments/${installmentId}`, request);
  }

  markInstallmentUnpaid(debtId: string, installmentId: string): Observable<DebtInstallment> {
    return this.http.post<DebtInstallment>(`${API_BASE_URL}/api/debts/${debtId}/installments/${installmentId}/unpay`, {});
  }
}
