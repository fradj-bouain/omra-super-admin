import { Component, OnInit, inject } from '@angular/core';
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
import type { SubscriptionPlanRow } from '../subscription-plans/subscription-plans.component';

export interface AssignSubscriptionDialogData {
  agencyId: number;
  agencyName: string;
}

export interface AssignSubscriptionDialogResult {
  saved: boolean;
}

@Component({
  selector: 'admin-omra-assign-subscription-dialog',
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
  templateUrl: './assign-subscription-dialog.component.html',
  styleUrl: './assign-subscription-dialog.component.scss',
})
export class AssignSubscriptionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private ref = inject(MatDialogRef<AssignSubscriptionDialogComponent, AssignSubscriptionDialogResult>);
  data = inject<AssignSubscriptionDialogData>(MAT_DIALOG_DATA);

  plans: SubscriptionPlanRow[] = [];
  loadingPlans = true;
  saving = false;

  form = this.fb.nonNullable.group(
    {
      planId: [null as number | null, Validators.required],
      periodStart: ['', Validators.required],
      periodEnd: ['', Validators.required],
      markAsPaid: [true],
      paymentReference: [''],
      amountPaid: [''],
      currency: ['MAD'],
      notes: [''],
    },
    { validators: [AssignSubscriptionDialogComponent.periodOrderValidator] },
  );

  private static periodOrderValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('periodStart')?.value as string;
    const end = group.get('periodEnd')?.value as string;
    if (!start || !end) return null;
    if (end < start) return { periodOrder: true };
    return null;
  }

  /** Date du jour au fuseau local (évite le décalage UTC de toISOString()). */
  private static localYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private static parseYmd(s: string): Date | null {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  /** Récap lisible : du … au … (durée en jours). */
  periodSummary(): string | null {
    const start = this.form.get('periodStart')?.value;
    const end = this.form.get('periodEnd')?.value;
    if (!start || !end || this.form.errors?.['periodOrder']) return null;
    const ds = AssignSubscriptionDialogComponent.parseYmd(start);
    const de = AssignSubscriptionDialogComponent.parseYmd(end);
    if (!ds || !de) return null;
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const days =
      Math.round((de.getTime() - ds.getTime()) / 86400000) + 1;
    if (days < 1) return null;
    return `Du ${fmt.format(ds)} au ${fmt.format(de)} (${days} jour${days > 1 ? 's' : ''} inclus).`;
  }

  ngOnInit(): void {
    this.http.get<SubscriptionPlanRow[]>(this.api.subscriptionPlans.active).subscribe({
      next: (p) => {
        this.plans = p ?? [];
        this.loadingPlans = false;
        if (this.plans.length === 1) {
          this.form.patchValue({ planId: this.plans[0].id });
        }
      },
      error: () => {
        this.notif.error('Impossible de charger les forfaits actifs.');
        this.loadingPlans = false;
      },
    });
    const today = new Date();
    const end = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    this.form.patchValue({
      periodStart: AssignSubscriptionDialogComponent.localYmd(today),
      periodEnd: AssignSubscriptionDialogComponent.localYmd(end),
    });
  }

  applyDefaultDuration(): void {
    const id = this.form.get('planId')?.value;
    const plan = this.plans.find((x) => x.id === id);
    const startStr = this.form.get('periodStart')?.value;
    if (!plan?.defaultDurationDays || !startStr) return;
    const start = new Date(startStr + 'T12:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + plan.defaultDurationDays);
    this.form.patchValue({ periodEnd: AssignSubscriptionDialogComponent.localYmd(end) });
  }

  cancel(): void {
    this.ref.close({ saved: false });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    this.saving = true;
    const body = {
      planId: v.planId,
      periodStart: v.periodStart,
      periodEnd: v.periodEnd,
      markAsPaid: v.markAsPaid,
      paymentReference: v.paymentReference?.trim() || undefined,
      amountPaid: v.amountPaid?.trim() ? Number(String(v.amountPaid).replace(',', '.')) : undefined,
      currency: v.currency?.trim() || 'MAD',
      notes: v.notes?.trim() || undefined,
    };
    this.http
      .post(this.api.agencySubscriptions.assign(this.data.agencyId), body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notif.success('Abonnement affecté');
          this.ref.close({ saved: true });
        },
        error: (err) => this.notif.error(err.error?.message || 'Erreur'),
      });
  }
}
