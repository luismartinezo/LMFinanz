import { Injectable } from '@angular/core';
import { AuthResponse } from './auth.models';

const ACCESS_TOKEN_KEY = 'lmfinanz.accessToken';
const REFRESH_TOKEN_KEY = 'lmfinanz.refreshToken';
const USER_KEY = 'lmfinanz.user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  get user(): Pick<AuthResponse, 'userId' | 'email' | 'fullName' | 'roles'> | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  save(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        roles: response.roles
      })
    );
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
