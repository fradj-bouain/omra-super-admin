import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import { AgencyUserEditDialogComponent, AgencyUserEditDialogData } from './agency-user-edit-dialog.component';
import {
  AssignSubscriptionDialogComponent,
  AssignSubscriptionDialogData,
  AssignSubscriptionDialogResult,
} from './assign-subscription-dialog.component';
import {
  EditSubscriptionDialogComponent,
  EditSubscriptionDialogData,
  EditSubscriptionDialogResult,
} from './edit-subscription-dialog.component';
import { AGENCY_COUNTRIES, flagEmoji } from './agency-locale-options';

interface AgencyDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  currency?: string;
  city?: string;
  address?: string;
  status: string;
  agencyKind?: string;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  createdAt?: string;
}

interface AgencyMetrics {
  userCount: number;
  pilgrimCount: number;
  groupCount: number;
  revenuePaid: number | string;
}

interface UserRow {
  id: number;
  agencyId?: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLogin?: string;
  emailVerified?: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

interface AgencySubscriptionDto {
  id: number;
  planId: number;
  planCode?: string;
  planName?: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  paidAt?: string;
  paymentReference?: string;
  amountPaid?: number | string;
  currency?: string;
  notes?: string;
}

interface SubscriptionSummaryResponse {
  latest: AgencySubscriptionDto | null;
  currentValid: AgencySubscriptionDto | null;
}

@Component({
  selector: 'admin-omra-agency-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
  ],
  templateUrl: './agency-detail.component.html',
  styleUrl: './agency-detail.component.scss',
})
export class AgencyDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  agency: AgencyDto | null = null;
  metrics: AgencyMetrics | null = null;
  loading = true;
  usersLoading = false;

  dataSource = new MatTableDataSource<UserRow>([]);
  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];
  totalUsers = 0;
  userPage = 1;
  userSize = 15;
  agencyId!: number;
  subscriptionSummary: SubscriptionSummaryResponse | null = null;
  subscriptionHistory: AgencySubscriptionDto[] = [];
  historyLoading = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.agencyId = Number(id);
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.http.get<AgencyDto>(this.api.agencies.byId(this.agencyId)).subscribe({
      next: (a) => {
        this.agency = a;
        this.loading = false;
      },
      error: () => {
        this.notif.error('Agence introuvable.');
        this.loading = false;
      },
    });
    this.http.get<AgencyMetrics>(this.api.agencies.metrics(this.agencyId)).subscribe({
      next: (m) => (this.metrics = m),
      error: () => (this.metrics = null),
    });
    this.loadSubscriptionSummary();
    this.loadSubscriptionHistory();
    this.loadUsers();
  }

  loadSubscriptionSummary(): void {
    this.http.get<SubscriptionSummaryResponse>(this.api.agencySubscriptions.summary(this.agencyId)).subscribe({
      next: (s) => (this.subscriptionSummary = s),
      error: () => (this.subscriptionSummary = null),
    });
  }

  loadSubscriptionHistory(): void {
    this.historyLoading = true;
    this.http
      .get<PageResponse<AgencySubscriptionDto>>(this.api.agencySubscriptions.list(this.agencyId), {
        params: { page: '0', size: '50' },
      })
      .subscribe({
        next: (r) => {
          this.subscriptionHistory = r.content ?? [];
          this.historyLoading = false;
        },
        error: () => {
          this.subscriptionHistory = [];
          this.historyLoading = false;
        },
      });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.http
      .get<PageResponse<UserRow>>(this.api.users.list, {
        params: {
          page: String(this.userPage),
          size: String(this.userSize),
          agencyId: String(this.agencyId),
        },
      })
      .subscribe({
        next: (res) => {
          this.dataSource.data = res.content ?? [];
          this.totalUsers = res.totalElements;
          this.usersLoading = false;
        },
        error: () => {
          this.notif.error('Impossible de charger les utilisateurs.');
          this.usersLoading = false;
        },
      });
  }

  onUserPage(e: PageEvent): void {
    this.userPage = e.pageIndex + 1;
    this.userSize = e.pageSize;
    this.loadUsers();
  }

  countryFlag(code?: string | null): string {
    return flagEmoji(code ?? '');
  }

  countryLabel(code?: string | null): string {
    if (!code) return '—';
    const f = AGENCY_COUNTRIES.find((c) => c.code === code);
    return f ? f.nameFr : code;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Actif', SUSPENDED: 'Suspendu', EXPIRED: 'Expiré' };
    return m[s] ?? s;
  }

  agencyKindLabel(kind?: string | null): string {
    const m: Record<string, string> = {
      TRAVEL: 'Voyage',
      MARKETPLACE: 'Marketplace',
      HOTEL: 'Hôtel',
    };
    const k = kind === 'MARKETPLACE' || kind === 'HOTEL' ? kind : 'TRAVEL';
    return m[k] ?? k;
  }

  userStatusLabel(s: string): string {
    return s === 'ACTIVE' ? 'Actif' : s === 'DISABLED' ? 'Désactivé' : s;
  }

  roleLabel(r: string): string {
    const m: Record<string, string> = {
      AGENCY_ADMIN: 'Admin agence',
      AGENCY_AGENT: 'Agent',
      PILGRIM_COMPANION: 'Accompagnateur',
      PILGRIM: 'Pèlerin',
      SUPER_ADMIN: 'Super admin',
    };
    return m[r] ?? r;
  }

  formatMoney(v: number | string | undefined | null): string {
    const cur = this.agency?.currency ?? 'MAD';
    if (v == null) return `0 ${cur}`;
    const n = typeof v === 'number' ? v : Number(v);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' ' + cur;
  }

  subStatusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING_PAYMENT: 'En attente de paiement',
      ACTIVE: 'Actif',
      EXPIRED: 'Expiré',
      CANCELLED: 'Annulé',
    };
    return m[s] ?? s;
  }

  openAssignSubscription(): void {
    if (!this.agency) return;
    const ref = this.dialog.open<
      AssignSubscriptionDialogComponent,
      AssignSubscriptionDialogData,
      AssignSubscriptionDialogResult
    >(AssignSubscriptionDialogComponent, {
      data: { agencyId: this.agencyId, agencyName: this.agency.name },
      width: 'min(520px, calc(100vw - 24px))',
      panelClass: 'admin-dialog-panel',
    });
    ref.afterClosed().subscribe((r) => {
      if (r?.saved) this.refreshAfterSubscriptionChange();
    });
  }

  openEditSubscription(sub: AgencySubscriptionDto): void {
    if (!this.agency) return;
    const ref = this.dialog.open<
      EditSubscriptionDialogComponent,
      EditSubscriptionDialogData,
      EditSubscriptionDialogResult
    >(EditSubscriptionDialogComponent, {
      data: { agencyId: this.agencyId, agencyName: this.agency.name, sub },
      width: 'min(540px, calc(100vw - 24px))',
      panelClass: 'admin-dialog-panel',
    });
    ref.afterClosed().subscribe((r) => {
      if (r?.saved) this.refreshAfterSubscriptionChange();
    });
  }

  /** Abonnement encore « vivant » côté métier (peut être annulé manuellement). */
  canDeactivateSub(sub: AgencySubscriptionDto): boolean {
    return sub.status === 'ACTIVE' || sub.status === 'PENDING_PAYMENT';
  }

  deactivateSubscription(sub: AgencySubscriptionDto): void {
    const msg = `Annuler cet abonnement (${sub.planName}, ${sub.periodStart} → ${sub.periodEnd}) ? L’accès sera coupé s’il n’existe pas d’autre période valide payée.`;
    if (!confirm(msg)) return;
    this.http.put(this.api.agencySubscriptions.update(this.agencyId, sub.id), { status: 'CANCELLED' }).subscribe({
      next: () => {
        this.notif.success('Abonnement annulé');
        this.refreshAfterSubscriptionChange();
      },
      error: (err) => this.notif.error(err.error?.message || 'Erreur'),
    });
  }

  private refreshAfterSubscriptionChange(): void {
    this.loadSubscriptionSummary();
    this.loadSubscriptionHistory();
    this.http.get<AgencyDto>(this.api.agencies.byId(this.agencyId)).subscribe({
      next: (a) => (this.agency = a),
      error: () => {},
    });
  }

  editUser(row: UserRow): void {
    const ref = this.dialog.open<AgencyUserEditDialogComponent, AgencyUserEditDialogData, boolean>(
      AgencyUserEditDialogComponent,
      {
        data: { user: row, agencyId: this.agencyId },
        width: 'min(520px, calc(100vw - 24px))',
        panelClass: 'admin-dialog-panel',
      }
    );
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.loadUsers();
    });
  }
}
