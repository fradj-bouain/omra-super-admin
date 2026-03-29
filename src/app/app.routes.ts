import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'subscription-plans',
        loadComponent: () =>
          import('./subscription-plans/subscription-plans.component').then((m) => m.SubscriptionPlansComponent),
      },
      {
        path: 'agencies',
        loadChildren: () => import('./agencies/agencies.routes').then((m) => m.AGENCIES_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
