import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { value: token } = await Preferences.get({ key: 'auth_token' });
  if (token && token.trim().length > 0) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { value: token } = await Preferences.get({ key: 'auth_token' });
  if (token && token.trim().length > 0) {
    return router.createUrlTree(['/tabs/tab1']);
  }
  return true;
};
