import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Transaction, TransactionRequest } from './transactions.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);

  list(from: string, to: string): Observable<Transaction[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Transaction[]>(`${API_BASE_URL}/api/transactions`, { params });
  }

  create(request: TransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_BASE_URL}/api/transactions`, request);
  }

  post(transactionId: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_BASE_URL}/api/transactions/${transactionId}/post`, {});
  }

  cancel(transactionId: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_BASE_URL}/api/transactions/${transactionId}/cancel`, {});
  }
}
