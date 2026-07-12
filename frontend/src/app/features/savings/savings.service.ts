import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { SavingsContributionRequest, SavingsGoal, SavingsGoalRequest } from './savings.models';

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly http = inject(HttpClient);

  list(): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(`${API_BASE_URL}/api/savings-goals`);
  }

  create(request: SavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${API_BASE_URL}/api/savings-goals`, request);
  }

  contribute(goalId: string, request: SavingsContributionRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${API_BASE_URL}/api/savings-goals/${goalId}/contributions`, request);
  }

  cancel(goalId: string): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${API_BASE_URL}/api/savings-goals/${goalId}/cancel`, {});
  }
}
