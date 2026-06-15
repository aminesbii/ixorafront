import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cart, CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_URL = '/api/cart';
  private readonly SESSION_KEY = 'ixora_session_token';

  // Expose an observable of the current cart so UI updates instantly
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initSessionToken();
  }

  // Retrieve or generate a guest session token
  getSessionToken(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    let token = localStorage.getItem(this.SESSION_KEY);
    if (!token) {
      token = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(this.SESSION_KEY, token);
    }
    return token;
  }

  private initSessionToken(): void {
    if (typeof window !== 'undefined') {
      this.getSessionToken();
    }
  }

  // Headers helper for guest calls (fallback if interceptor is bypassed)
  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('x-session-token', this.getSessionToken());
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.API_URL, { headers: this.getHeaders() }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(productId: string, variantId: string | null, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.API_URL}/items`, {
      product_id: productId,
      variant_id: variantId,
      quantity
    }, { headers: this.getHeaders() }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  updateItem(itemId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.API_URL}/items/${itemId}`, {
      quantity
    }, { headers: this.getHeaders() }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeItem(itemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.API_URL}/items/${itemId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  clear(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.API_URL, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.cartSubject.next(null))
    );
  }

  merge(): Observable<Cart> {
    const sessionToken = this.getSessionToken();
    return this.http.post<Cart>(`${this.API_URL}/merge`, {
      session_token: sessionToken
    }).pipe(
      tap(cart => {
        // Once merged, clear local session token and fetch new user cart
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.SESSION_KEY);
        }
        this.cartSubject.next(cart);
      })
    );
  }
}
