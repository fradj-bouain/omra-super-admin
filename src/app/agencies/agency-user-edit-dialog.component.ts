import { Component, inject } from '@angular/core';
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

export interface AgencyUserEditDialogData {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    emailVerified?: boolean;
  };
  agencyId: number;
}

@Component({
  selector: 'admin-omra-agency-user-edit-dialog',
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
  templateUrl: './agency-user-edit-dialog.component.html',
  styleUrl: './agency-user-edit-dialog.component.scss',
})
export class AgencyUserEditDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private ref = inject(MatDialogRef<AgencyUserEditDialogComponent, boolean>);
  data = inject<AgencyUserEditDialogData>(MAT_DIALOG_DATA);

  loading = false;
  form = this.fb.nonNullable.group({
    name: [this.data.user.name, Validators.required],
    email: [this.data.user.email, [Validators.required, Validators.email]],
    phone: [this.data.user.phone ?? ''],
    role: [this.data.user.role, Validators.required],
    status: [this.data.user.status, Validators.required],
    password: [''],
    emailVerified: [this.data.user.emailVerified ?? false],
  });

  roles = [
    { value: 'AGENCY_ADMIN', label: 'Admin agence' },
    { value: 'AGENCY_AGENT', label: 'Agent' },
    { value: 'PILGRIM_COMPANION', label: 'Accompagnateur' },
    { value: 'PILGRIM', label: 'Pèlerin' },
  ];

  statuses = [
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'DISABLED', label: 'Désactivé' },
  ];

  cancel(): void {
    this.ref.close(false);
  }

  save(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      role: v.role,
      status: v.status,
      emailVerified: v.emailVerified,
    };
    if (v.password?.trim()) {
      body['password'] = v.password.trim();
    }
    this.http
      .put(this.api.users.byId(this.data.user.id), body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.notif.success('Utilisateur mis à jour');
          this.ref.close(true);
        },
        error: (err) => this.notif.error(err.error?.message || 'Échec de la mise à jour'),
      });
  }
}
