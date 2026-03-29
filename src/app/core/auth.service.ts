import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  telephone?: string;
  cin?: string;
  active?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  admin?: AdminUser;
}

const ACCESS = 'omra_platform_admin_access';
const REFRESH = 'omra_platform_admin_refresh';
const ADMIN_JSON = 'omra_platform_admin_profile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly admin = signal<AdminUser | null>(this.readAdmin());

  readonly currentAdmin = this.admin.asReadonly();

  /** Ne pas utiliser computed(localStorage) : sans signal, la valeur ne se met jamais à jour après login. */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private router: Router
  ) {}

  getToken(): string | null {
    return localStorage.getItem(ACCESS);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.api.adminAuth.login, { email, password }).pipe(tap((r) => this.persist(r)));
  }

  logout(): void {
    const rt = this.getRefreshToken();
    if (rt) {
      this.http.post(this.api.adminAuth.logout, { refresh_token: rt }).subscribe();
    }
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(ADMIN_JSON);
    this.admin.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse | null> {
    const rt = this.getRefreshToken();
    if (!rt) return of(null);
    return this.http.post<AuthResponse>(this.api.adminAuth.refresh, { refresh_token: rt }).pipe(
      tap((r) => this.persist(r)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(ACCESS, res.accessToken);
    localStorage.setItem(REFRESH, res.refreshToken);
    if (res.admin) {
      localStorage.setItem(ADMIN_JSON, JSON.stringify(res.admin));
      this.admin.set(res.admin);
    }
  }

  private readAdmin(): AdminUser | null {
    const raw = localStorage.getItem(ADMIN_JSON);
    return raw ? JSON.parse(raw) : null;
  }
}
