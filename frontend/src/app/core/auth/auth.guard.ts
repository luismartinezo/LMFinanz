import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (tokens.isAccessTokenValid()) {
    return true;
  }

  if (tokens.refreshToken) {
    return auth.refresh().pipe(
      map(() => true),
      catchError(() => {
        auth.clearSession();
        return of(router.createUrlTree(['/auth/login']));
      })
    );
  }

  auth.clearSession();
  return router.createUrlTree(['/auth/login']);
};
