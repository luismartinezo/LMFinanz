import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Account, AccountRequest, AccountUpdateRequest } from './accounts.models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(`${API_BASE_URL}/api/accounts`);
  }

  create(request: AccountRequest): Observable<Account> {
    return this.http.post<Account>(`${API_BASE_URL}/api/accounts`, request);
  }

  update(accountId: string, request: AccountUpdateRequest): Observable<Account> {
    return this.http.put<Account>(`${API_BASE_URL}/api/accounts/${accountId}`, request);
  }

  close(accountId: string): Observable<Account> {
    return this.http.patch<Account>(`${API_BASE_URL}/api/accounts/${accountId}/close`, {});
  }

  reopen(accountId: string): Observable<Account> {
    return this.http.patch<Account>(`${API_BASE_URL}/api/accounts/${accountId}/reopen`, {});
  }

  delete(accountId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/accounts/${accountId}`);
  }
}
