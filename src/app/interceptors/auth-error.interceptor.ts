import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_info');
        } catch {
          /* ignore */
        }
        void router.navigate(['/login'], { replaceUrl: true });
      }
      return throwError(() => err);
    })
  );
};
