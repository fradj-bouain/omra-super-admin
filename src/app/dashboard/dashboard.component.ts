import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';

interface DashboardStats {
  totalPilgrims: number;
  activeGroups: number;
  pendingVisas: number;
  paymentsReceived: number | string;
  totalRevenue: number | string;
  totalAgencies?: number;
  activeAgencies?: number;
  suspendedAgencies?: number;
  expiredAgencies?: number;
  totalAgencyUsers?: number;
}

interface ChartData {
  paymentsOverTime: { period: string; amount: number | string }[];
  visaDistribution: { status: string; count: number }[];
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

interface AgencyMini {
  id: number;
  name: string;
  email: string;
  status: string;
  city?: string;
}

interface PaymentRow {
  id: number;
  agencyId?: number;
  amount: number | string;
  currency?: string;
  status: string;
  paymentDate?: string;
  reference?: string;
}

@Component({
  selector: 'admin-omra-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  loading = true;
  stats: DashboardStats | null = null;
  chart: ChartData | null = null;
  recentAgencies: AgencyMini[] = [];
  recentPayments: PaymentRow[] = [];

  ngOnInit(): void {
    forkJoin({
      stats: this.http.get<DashboardStats>(this.api.dashboard.stats),
      chart: this.http.get<ChartData>(this.api.dashboard.chartData),
      agencies: this.http.get<PageResponse<AgencyMini>>(this.api.agencies.list, {
        params: { page: '0', size: '8' },
      }),
      payments: this.http.get<PageResponse<PaymentRow>>(this.api.payments.list, {
        params: { page: '1', size: '12' },
      }),
    }).subscribe({
      next: ({ stats, chart, agencies, payments }) => {
        this.stats = stats;
        this.chart = chart;
        this.recentAgencies = agencies.content ?? [];
        this.recentPayments = payments.content ?? [];
        this.loading = false;
      },
      error: () => {
        this.notif.error('Impossible de charger le tableau de bord.');
        this.loading = false;
      },
    });
  }

  num(v: number | string | undefined | null): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }

  formatMoney(v: number | string | undefined | null, currency = 'MAD'): string {
    const n = this.num(v);
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) +
      ' ' +
      currency
    );
  }

  agencyStatusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Actif', SUSPENDED: 'Suspendu', EXPIRED: 'Expiré' };
    return m[s] ?? s;
  }

  paymentStatusLabel(s: string): string {
    const m: Record<string, string> = {
      PAID: 'Payé',
      PENDING: 'En attente',
      PARTIAL: 'Partiel',
      REFUNDED: 'Remboursé',
    };
    return m[s] ?? s;
  }

  visaLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'En attente',
      SUBMITTED: 'Soumis',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
    };
    return m[s] ?? s;
  }

  chartMax(): number {
    const rows = this.chart?.paymentsOverTime ?? [];
    if (!rows.length) return 1;
    return Math.max(...rows.map((r) => this.num(r.amount)), 1);
  }

  visaMax(): number {
    const rows = this.chart?.visaDistribution ?? [];
    if (!rows.length) return 1;
    return Math.max(...rows.map((r) => r.count), 1);
  }
}
