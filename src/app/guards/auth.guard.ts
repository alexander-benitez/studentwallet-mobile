import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');
  if (token && token.trim().length > 0) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
