import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokens = inject(TokenStorageService);
  const auth = inject(AuthService);
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

      return auth.refresh().pipe(
        switchMap((response) =>
          next(request.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }))
        ),
        catchError((refreshError) => {
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
