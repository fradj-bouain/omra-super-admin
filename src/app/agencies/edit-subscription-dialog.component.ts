import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';

export interface EditableAgencySubscription {
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

export interface EditSubscriptionDialogData {
  agencyId: number;
  agencyName: string;
  sub: EditableAgencySubscription;
}

export interface EditSubscriptionDialogResult {
  saved: boolean;
}

const STATUS_OPTIONS = ['ACTIVE', 'PENDING_PAYMENT', 'CANCELLED', 'EXPIRED'] as const;

@Component({
  selector: 'admin-omra-edit-subscription-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './edit-subscription-dialog.component.html',
  styleUrl: './edit-subscription-dialog.component.scss',
})
export class EditSubscriptionDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private ref = inject(MatDialogRef<EditSubscriptionDialogComponent, EditSubscriptionDialogResult>);
  data = inject<EditSubscriptionDialogData>(MAT_DIALOG_DATA);

  readonly statusOptions = STATUS_OPTIONS;

  saving = false;

  form = this.fb.nonNullable.group(
    {
      periodStart: ['', Validators.required],
      periodEnd: ['', Validators.required],
      status: ['ACTIVE' as string, Validators.required],
      markAsPaid: [true],
      paymentReference: [''],
      amountPaid: [''],
      currency: ['MAD'],
      notes: [''],
    },
    { validators: [EditSubscriptionDialogComponent.periodOrderValidator] },
  );

  constructor() {
    const s = this.data.sub;
    const ymd = (x: string) => (x && x.length >= 10 ? x.slice(0, 10) : x);
    const amt =
      s.amountPaid != null && s.amountPaid !== ''
        ? String(typeof s.amountPaid === 'number' ? s.amountPaid : s.amountPaid)
        : '';
    const st = (s.status || 'ACTIVE').toUpperCase();
    const statusOk = (STATUS_OPTIONS as readonly string[]).includes(st);
    this.form.patchValue({
      periodStart: ymd(s.periodStart),
      periodEnd: ymd(s.periodEnd),
      status: statusOk ? st : 'ACTIVE',
      markAsPaid: !!s.paidAt,
      paymentReference: s.paymentReference ?? '',
      amountPaid: amt,
      currency: s.currency?.trim() || 'MAD',
      notes: s.notes ?? '',
    });
  }

  private static periodOrderValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('periodStart')?.value as string;
    const end = group.get('periodEnd')?.value as string;
    if (!start || !end) return null;
    if (end < start) return { periodOrder: true };
    return null;
  }

  private static parseYmd(s: string): Date | null {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  periodSummary(): string | null {
    const start = this.form.get('periodStart')?.value;
    const end = this.form.get('periodEnd')?.value;
    if (!start || !end || this.form.errors?.['periodOrder']) return null;
    const ds = EditSubscriptionDialogComponent.parseYmd(start);
    const de = EditSubscriptionDialogComponent.parseYmd(end);
    if (!ds || !de) return null;
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const days = Math.round((de.getTime() - ds.getTime()) / 86400000) + 1;
    if (days < 1) return null;
    return `Du ${fmt.format(ds)} au ${fmt.format(de)} (${days} jour${days > 1 ? 's' : ''} inclus).`;
  }

  statusLabel(code: string): string {
    const m: Record<string, string> = {
      ACTIVE: 'Actif (accès si payé et dans la période)',
      PENDING_PAYMENT: 'En attente de paiement',
      CANCELLED: 'Annulé',
      EXPIRED: 'Expiré',
    };
    return m[code] ?? code;
  }

  cancel(): void {
    this.ref.close({ saved: false });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    this.saving = true;
    const body = {
      periodStart: v.periodStart,
      periodEnd: v.periodEnd,
      status: v.status,
      markAsPaid: v.markAsPaid,
      paymentReference: v.paymentReference?.trim() || undefined,
      amountPaid: v.amountPaid?.trim() ? Number(String(v.amountPaid).replace(',', '.')) : undefined,
      currency: v.currency?.trim() || undefined,
      notes: v.notes != null ? v.notes.trim() : '',
    };
    this.http
      .put(this.api.agencySubscriptions.update(this.data.agencyId, this.data.sub.id), body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notif.success('Abonnement mis à jour');
          this.ref.close({ saved: true });
        },
        error: (err) => this.notif.error(err.error?.message || 'Erreur'),
      });
  }
}
