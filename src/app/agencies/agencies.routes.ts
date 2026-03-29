import { Route } from '@angular/router';

export const AGENCIES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./agency-list.component').then((m) => m.AgencyListComponent) },
  { path: 'new', loadComponent: () => import('./agency-form.component').then((m) => m.AgencyFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./agency-form.component').then((m) => m.AgencyFormComponent) },
  { path: ':id', loadComponent: () => import('./agency-detail.component').then((m) => m.AgencyDetailComponent) },
];
