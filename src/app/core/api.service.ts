import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  adminAuth = {
    login: `${this.base}/api/admin/auth/login`,
    refresh: `${this.base}/api/admin/auth/refresh`,
    logout: `${this.base}/api/admin/auth/logout`,
  };

  agencies = {
    list: `${this.base}/api/agencies`,
    byId: (id: number) => `${this.base}/api/agencies/${id}`,
    metrics: (id: number) => `${this.base}/api/agencies/${id}/metrics`,
  };

  dashboard = {
    stats: `${this.base}/api/dashboard/stats`,
    chartData: `${this.base}/api/dashboard/chart-data`,
  };

  users = {
    list: `${this.base}/api/users`,
    byId: (id: number) => `${this.base}/api/users/${id}`,
  };

  payments = {
    list: `${this.base}/api/payments`,
  };

  subscriptionPlans = {
    list: `${this.base}/api/subscription-plans`,
    active: `${this.base}/api/subscription-plans/active`,
    byId: (id: number) => `${this.base}/api/subscription-plans/${id}`,
  };

  agencySubscriptions = {
    summary: (agencyId: number) => `${this.base}/api/agencies/${agencyId}/subscriptions/summary`,
    list: (agencyId: number) => `${this.base}/api/agencies/${agencyId}/subscriptions`,
    assign: (agencyId: number) => `${this.base}/api/agencies/${agencyId}/subscriptions`,
    update: (agencyId: number, subId: number) => `${this.base}/api/agencies/${agencyId}/subscriptions/${subId}`,
  };
}
