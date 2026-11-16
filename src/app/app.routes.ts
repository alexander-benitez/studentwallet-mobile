import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
  },
  {
    path: 'tab4',
    canActivate: [authGuard],
    loadComponent: () => import('./tab4/tab4.page').then(m => m.Tab4Page),
  },
];
