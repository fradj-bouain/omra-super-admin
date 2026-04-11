import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import type { SubscriptionPlanRow } from './subscription-plans.component';

export interface PlanFormDialogData {
  plan: SubscriptionPlanRow | null;
}

export interface PlanFormDialogResult {
  saved: boolean;
}

@Component({
  selector: 'admin-omra-plan-form-dialog',
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
  templateUrl: './plan-form-dialog.component.html',
  styleUrl: './plan-form-dialog.component.scss',
})
export class PlanFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private ref = inject(MatDialogRef<PlanFormDialogComponent, PlanFormDialogResult>);
  data = inject<PlanFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  isEdit = !!this.data.plan;

  form = this.fb.nonNullable.group({
    code: [{ value: this.data.plan?.code ?? '', disabled: this.isEdit }, [Validators.required]],
    name: [this.data.plan?.name ?? '', Validators.required],
    description: [this.data.plan?.description ?? ''],
    price: [this.data.plan != null ? String(this.data.plan.price) : '0', Validators.required],
    currency: [this.data.plan?.currency ?? 'MAD'],
    billingPeriod: [this.data.plan?.billingPeriod ?? 'YEARLY', Validators.required],
    defaultDurationDays: [this.data.plan?.defaultDurationDays != null ? String(this.data.plan.defaultDurationDays) : '365'],
    maxUsers: [this.data.plan?.maxUsers != null ? String(this.data.plan.maxUsers) : ''],
    maxSubAgencies: [
      this.data.plan?.maxSubAgencies != null && this.data.plan.maxSubAgencies !== undefined
        ? String(this.data.plan.maxSubAgencies)
        : '',
    ],
    features: [this.data.plan?.features ?? ''],
    active: [this.data.plan?.active ?? true],
    sortOrder: [this.data.plan != null ? String(this.data.plan.sortOrder) : '10'],
  });

  billingOptions = [
    { v: 'MONTHLY', l: 'Mensuel' },
    { v: 'QUARTERLY', l: 'Trimestriel' },
    { v: 'YEARLY', l: 'Annuel' },
    { v: 'ONE_TIME', l: 'Ponctuel' },
  ];

  ngOnInit(): void {
    if (this.isEdit && this.data.plan) {
      this.http.get<SubscriptionPlanRow>(this.api.subscriptionPlans.byId(this.data.plan.id)).subscribe({
        next: (p) =>
          this.form.patchValue({
            description: p.description ?? '',
            features: p.features ?? '',
          }),
        error: () => {},
      });
    }
  }

  cancel(): void {
    this.ref.close({ saved: false });
  }

  save(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const raw = this.form.getRawValue();
    const body = {
      code: raw.code?.trim(),
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      price: Number(String(raw.price).replace(',', '.')),
      currency: raw.currency?.trim() || 'MAD',
      billingPeriod: raw.billingPeriod,
      defaultDurationDays: raw.defaultDurationDays ? Number(raw.defaultDurationDays) : undefined,
      maxUsers: raw.maxUsers ? Number(raw.maxUsers) : undefined,
      maxSubAgencies: raw.maxSubAgencies !== '' && raw.maxSubAgencies != null ? Number(raw.maxSubAgencies) : undefined,
      features: raw.features?.trim() || undefined,
      active: raw.active,
      sortOrder: raw.sortOrder ? Number(raw.sortOrder) : 0,
    };
    if (this.isEdit && this.data.plan) {
      this.http
        .put(this.api.subscriptionPlans.byId(this.data.plan.id), body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.notif.success('Forfait mis à jour');
            this.ref.close({ saved: true });
          },
          error: (err) => this.notif.error(err.error?.message || 'Erreur'),
        });
    } else {
      this.http
        .post(this.api.subscriptionPlans.list, body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.notif.success('Forfait créé');
            this.ref.close({ saved: true });
          },
          error: (err) => this.notif.error(err.error?.message || 'Erreur'),
        });
    }
  }
}
