import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorageService);
  const router = inject(Router);

  if (tokens.accessToken) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
