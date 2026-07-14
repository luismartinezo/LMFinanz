import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthResponse } from './auth.models';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

let refreshRequest$: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokens = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = request.url.startsWith(API_BASE_URL);
  const isPublicAuthRequest =
    request.url.endsWith('/api/auth/login') ||
    request.url.endsWith('/api/auth/register') ||
    request.url.endsWith('/api/auth/refresh') ||
    request.url.endsWith('/api/auth/logout');
  const accessToken = tokens.accessToken;

  const authorizedRequest =
    isApiRequest && accessToken && !isPublicAuthRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !tokens.refreshToken || isPublicAuthRequest) {
        return throwError(() => error);
      }

      refreshRequest$ ??= auth.refresh().pipe(
        finalize(() => {
          refreshRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );

      return refreshRequest$.pipe(
        switchMap((response) =>
          next(request.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }))
        ),
        catchError((refreshError) => {
          auth.clearSession();
          router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
          return throwError(() => refreshError);
        })
      );
    })
  );
};
