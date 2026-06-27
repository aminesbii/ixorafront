import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderItem } from '../models/order.model';
import { Address } from '../models/address.model';

export interface CheckoutPayload {
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: Omit<Address, '_id' | 'user_id' | 'order_id'>;
  billing_address?: Omit<Address, '_id' | 'user_id' | 'order_id'> | null;
  shipping_fee?: number;
  discount_total?: number;
  tax_total?: number;
  currency?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = '/api/orders';

  constructor(private http: HttpClient) { }

  // Checkout (Public & Auth)
  checkout(payload: CheckoutPayload): Observable<{ order: Order; items: OrderItem[] }> {
    return this.http.post<{ order: Order; items: OrderItem[] }>(`${this.API_URL}/checkout`, payload);
  }

  // Public Order Tracking by Number
  trackByNumber(orderNumber: string): Observable<{
    order_number: string;
    status: Order['status'];
    grand_total: number;
    currency: string;
    createdAt: string;
    items: Array<{ product_name: string; quantity: number; line_total: number }>;
  }> {
    return this.http.get<any>(`${this.API_URL}/track/${orderNumber}`);
  }

  // Authenticated Customer - My Orders
  myOrders(queryParams?: { page?: number; limit?: number; status?: Order['status'] }): Observable<PaginatedOrders> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const val = (queryParams as any)[key];
        if (val !== undefined && val !== null) {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<PaginatedOrders>(`${this.API_URL}/mine`, { params });
  }

  // Get Order By ID (Requires Auth)
  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/${id}`);
  }

  // Admin - List orders by user
  listByUser(userId: string, queryParams?: { page?: number; limit?: number; status?: Order['status']; sort?: string }): Observable<PaginatedOrders> {
    let params = new HttpParams().set('userId', userId);
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const val = (queryParams as any)[key];
        if (val !== undefined && val !== null) {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<PaginatedOrders>(this.API_URL, { params });
  }

  // Admin - List All Orders
  listAll(queryParams?: { page?: number; limit?: number; status?: Order['status']; sort?: string }): Observable<PaginatedOrders> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const val = (queryParams as any)[key];
        if (val !== undefined && val !== null) {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<PaginatedOrders>(this.API_URL, { params });
  }

  // Admin - Update Order Status
  updateStatus(id: string, status: Order['status']): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${id}/status`, { status });
  }

  // Admin - Update Order Details
  update(id: string, data: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.API_URL}/${id}`, data);
  }

  // Admin - Delete Order
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
