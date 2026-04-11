import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import { PlanFormDialogComponent, PlanFormDialogData, PlanFormDialogResult } from './plan-form-dialog.component';

export interface SubscriptionPlanRow {
  id: number;
  code: string;
  name: string;
  description?: string;
  features?: string;
  price: number | string;
  currency: string;
  billingPeriod: string;
  defaultDurationDays?: number;
  maxUsers?: number;
  /** Max active sub-agencies for main agency; null = unlimited */
  maxSubAgencies?: number | null;
  active: boolean;
  sortOrder: number;
}

@Component({
  selector: 'admin-omra-subscription-plans',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule, MatTooltipModule],
  templateUrl: './subscription-plans.component.html',
  styleUrl: './subscription-plans.component.scss',
})
export class SubscriptionPlansComponent implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private dialog = inject(MatDialog);

  plans: SubscriptionPlanRow[] = [];
  loading = false;
  displayedColumns = ['code', 'name', 'price', 'billing', 'duration', 'maxSubAgencies', 'active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<SubscriptionPlanRow[]>(this.api.subscriptionPlans.list).subscribe({
      next: (rows) => {
        this.plans = rows ?? [];
        this.loading = false;
      },
      error: () => {
        this.notif.error('Impossible de charger les forfaits.');
        this.loading = false;
      },
    });
  }

  periodLabel(p: string): string {
    const m: Record<string, string> = {
      MONTHLY: 'Mensuel',
      QUARTERLY: 'Trimestriel',
      YEARLY: 'Annuel',
      ONE_TIME: 'Ponctuel',
    };
    return m[p] ?? p;
  }

  formatPrice(row: SubscriptionPlanRow): string {
    const n = typeof row.price === 'number' ? row.price : Number(row.price);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' ' + (row.currency || 'MAD');
  }

  create(): void {
    this.openDialog(null);
  }

  edit(row: SubscriptionPlanRow): void {
    this.openDialog(row);
  }

  private openDialog(row: SubscriptionPlanRow | null): void {
    const ref = this.dialog.open<PlanFormDialogComponent, PlanFormDialogData, PlanFormDialogResult>(PlanFormDialogComponent, {
      data: { plan: row },
      width: 'min(560px, calc(100vw - 24px))',
      panelClass: 'admin-dialog-panel',
    });
    ref.afterClosed().subscribe((r) => {
      if (r?.saved) this.load();
    });
  }
}
