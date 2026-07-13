import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, tap } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse, LoginRequest, RegisterRequest } from './auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly userState = signal(this.tokens.user);
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokens.accessToken));

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, request).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, request).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken: this.tokens.refreshToken
      })
      .pipe(tap((response) => this.saveSession(response)));
  }

  logout(): void {
    const refreshToken = this.tokens.refreshToken;
    if (refreshToken) {
      this.http
        .post(`${API_BASE_URL}/api/auth/logout`, { refreshToken })
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }
    this.tokens.clear();
    this.userState.set(null);
  }

  private saveSession(response: AuthResponse): void {
    this.tokens.save(response);
    this.userState.set(this.tokens.user);
  }
}
