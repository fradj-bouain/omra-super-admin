import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import {
  AGENCY_COUNTRIES,
  AGENCY_CURRENCIES,
  flagEmoji,
} from './agency-locale-options';

@Component({
  selector: 'admin-omra-agency-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './agency-form.component.html',
  styleUrl: './agency-form.component.scss',
})
export class AgencyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  isEdit = false;
  agencyId: number | null = null;

  readonly flagEmoji = flagEmoji;
  readonly countries = AGENCY_COUNTRIES;
  readonly currencies = AGENCY_CURRENCIES;
  /** Si l’API renvoie un code / libellé hors liste, on l’affiche quand même. */
  countrySelectOptions: { code: string; nameFr: string }[] = AGENCY_COUNTRIES;
  currencySelectOptions: { code: string; labelFr: string }[] = AGENCY_CURRENCIES;

  /** Filtre saisi dans le panneau du select (pas lié au FormGroup). */
  countryFilter = '';
  currencyFilter = '';

  get filteredCountryOptions(): { code: string; nameFr: string }[] {
    const q = this.countryFilter.trim().toLowerCase();
    if (!q) return this.countrySelectOptions;
    return this.countrySelectOptions.filter(
      (c) => c.nameFr.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }

  get filteredCurrencyOptions(): { code: string; labelFr: string }[] {
    const q = this.currencyFilter.trim().toLowerCase();
    if (!q) return this.currencySelectOptions;
    return this.currencySelectOptions.filter(
      (x) =>
        x.labelFr.toLowerCase().includes(q) || x.code.toLowerCase().includes(q),
    );
  }

  countryLabel(code: string | null | undefined): string {
    if (code == null || code === '') return '';
    const row = this.countrySelectOptions.find((c) => c.code === code);
    return row?.nameFr ?? code;
  }

  currencyLabel(code: string | null | undefined): string {
    if (code == null || code === '') return '';
    const row = this.currencySelectOptions.find((c) => c.code === code);
    return row?.labelFr ?? code;
  }

  onCountryPanelToggle(open: boolean): void {
    if (open) this.countryFilter = '';
  }

  onCurrencyPanelToggle(open: boolean): void {
    if (open) this.currencyFilter = '';
  }

  /** Aligné sur l’enum Spring {@code AgencyKind}. */
  readonly agencyKinds: { value: string; label: string; hint: string }[] = [
    { value: 'TRAVEL', label: 'Agence voyage (Omra)', hint: 'Voyageurs, groupes, logistique classique.' },
    { value: 'MARKETPLACE', label: 'Marketplace / boutique', hint: 'Catalogue, commandes, stock (portail boutique).' },
    { value: 'HOTEL', label: 'Opérateur hôtelier', hint: 'Établissements et offres tarifaires.' },
    {
      value: 'TRANSPORT',
      label: 'Transporteur',
      hint: 'Flotte (bus, voitures), offres à la journée / heure / trajet.',
    },
  ];

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    country: [''],
    currency: ['MAD'],
    city: [''],
    address: [''],
    status: ['ACTIVE'],
    agencyKind: ['TRAVEL'],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.agencyId = Number(id);
      this.isEdit = true;
      this.loadAgency();
    }
  }

  loadAgency(): void {
    if (this.agencyId == null) return;
    this.loading = true;
    this.http
      .get<{
        name?: string;
        email?: string;
        phone?: string;
        country?: string;
        currency?: string;
        city?: string;
        address?: string;
        status?: string;
        agencyKind?: string;
      }>(this.api.agencies.byId(this.agencyId))
      .subscribe({
        next: (res) => {
          const c = (res.country ?? '').trim();
          if (c && !AGENCY_COUNTRIES.some((x) => x.code === c)) {
            this.countrySelectOptions = [{ code: c, nameFr: c }, ...AGENCY_COUNTRIES];
          } else {
            this.countrySelectOptions = AGENCY_COUNTRIES;
          }
          const cur = (res.currency ?? '').trim();
          if (cur && !AGENCY_CURRENCIES.some((x) => x.code === cur)) {
            this.currencySelectOptions = [{ code: cur, labelFr: cur }, ...AGENCY_CURRENCIES];
          } else {
            this.currencySelectOptions = AGENCY_CURRENCIES;
          }
          const kind =
            res.agencyKind === 'MARKETPLACE' || res.agencyKind === 'HOTEL' || res.agencyKind === 'TRANSPORT'
              ? res.agencyKind
              : 'TRAVEL';
          this.form.patchValue({
            name: res.name ?? '',
            email: res.email ?? '',
            phone: res.phone ?? '',
            country: c,
            currency: cur || 'MAD',
            city: res.city ?? '',
            address: res.address ?? '',
            status: res.status ?? 'ACTIVE',
            agencyKind: kind,
          });
          this.loading = false;
        },
        error: () => {
          this.notif.error('Agence introuvable');
          this.loading = false;
          this.router.navigate(['/agencies']);
        },
      });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      country: v.country || undefined,
      currency: v.currency || undefined,
      city: v.city || undefined,
      address: v.address || undefined,
      status: v.status || 'ACTIVE',
      agencyKind: v.agencyKind || 'TRAVEL',
    };
    if (this.isEdit && this.agencyId != null) {
      this.http.put(this.api.agencies.byId(this.agencyId), body).subscribe({
        next: () => {
          this.notif.success('Agence mise à jour');
          this.router.navigate(['/agencies']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur mise à jour');
        },
      });
    } else {
      this.http.post(this.api.agencies.list, body).subscribe({
        next: () => {
          this.notif.success('Agence créée');
          this.router.navigate(['/agencies']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur création');
        },
      });
    }
  }
}
