import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isTutor: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'ixora_token';
  private readonly USER_KEY = 'ixora_user';

  constructor(private http: HttpClient, private router: Router) { }

  // ── HTTP calls ───────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => this.persist(res))
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password }).pipe(
      tap(res => this.persist(res))
    );
  }

  // ── Token / session helpers ──────────────────────────────────────────────────

  private persist(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      userId: res.userId,
      name: res.name,
      email: res.email,
      isAdmin: res.isAdmin,
      isTutor: res.isTutor,
    }));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): Omit<AuthResponse, 'token'> | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/auth/login']);
  }
}
