/** ISO 3166-1 alpha-2 → drapeau (Unicode regional indicators). */
export function flagEmoji(iso2: string | null | undefined): string {
  if (!iso2 || iso2.length !== 2) return '';
  const c = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + c.charCodeAt(0) - 65, base + c.charCodeAt(1) - 65);
}

/** Pays courants (Omra / agences voyage) — tri par nom FR. */
export const AGENCY_COUNTRIES: { code: string; nameFr: string }[] = [
  { code: 'DZ', nameFr: 'Algérie' },
  { code: 'DE', nameFr: 'Allemagne' },
  { code: 'SA', nameFr: 'Arabie saoudite' },
  { code: 'BE', nameFr: 'Belgique' },
  { code: 'BA', nameFr: 'Bosnie-Herzégovine' },
  { code: 'CA', nameFr: 'Canada' },
  { code: 'CN', nameFr: 'Chine' },
  { code: 'KR', nameFr: 'Corée du Sud' },
  { code: 'CI', nameFr: "Côte d'Ivoire" },
  { code: 'EG', nameFr: 'Égypte' },
  { code: 'AE', nameFr: 'Émirats arabes unis' },
  { code: 'ES', nameFr: 'Espagne' },
  { code: 'US', nameFr: 'États-Unis' },
  { code: 'FR', nameFr: 'France' },
  { code: 'GB', nameFr: 'Royaume-Uni' },
  { code: 'IT', nameFr: 'Italie' },
  { code: 'JP', nameFr: 'Japon' },
  { code: 'KW', nameFr: 'Koweït' },
  { code: 'LB', nameFr: 'Liban' },
  { code: 'LU', nameFr: 'Luxembourg' },
  { code: 'MA', nameFr: 'Maroc' },
  { code: 'MU', nameFr: 'Maurice' },
  { code: 'NL', nameFr: 'Pays-Bas' },
  { code: 'QA', nameFr: 'Qatar' },
  { code: 'SN', nameFr: 'Sénégal' },
  { code: 'CH', nameFr: 'Suisse' },
  { code: 'TN', nameFr: 'Tunisie' },
  { code: 'TR', nameFr: 'Turquie' },
].sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));

/** Devises courantes (ISO 4217). */
export const AGENCY_CURRENCIES: { code: string; labelFr: string }[] = [
  { code: 'MAD', labelFr: 'MAD — Dirham marocain' },
  { code: 'EUR', labelFr: 'EUR — Euro' },
  { code: 'USD', labelFr: 'USD — Dollar US' },
  { code: 'GBP', labelFr: 'GBP — Livre sterling' },
  { code: 'CHF', labelFr: 'CHF — Franc suisse' },
  { code: 'SAR', labelFr: 'SAR — Riyal saoudien' },
  { code: 'AED', labelFr: 'AED — Dirham émirati' },
  { code: 'TND', labelFr: 'TND — Dinar tunisien' },
  { code: 'DZD', labelFr: 'DZD — Dinar algérien' },
  { code: 'EGP', labelFr: 'EGP — Livre égyptienne' },
  { code: 'QAR', labelFr: 'QAR — Riyal qatari' },
  { code: 'KWD', labelFr: 'KWD — Dinar koweïtien' },
  { code: 'CAD', labelFr: 'CAD — Dollar canadien' },
];
