import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductEvent, ProductPerformanceDaily, DashboardReport } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = '/api/analytics';

  constructor(private http: HttpClient) {}

  // Public Event Tracking
  trackEvent(event: Omit<ProductEvent, '_id' | 'created_at'>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/events`, event);
  }

  // Admin: Get daily performance history
  getDailyPerformance(startDate?: string, endDate?: string): Observable<ProductPerformanceDaily[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ProductPerformanceDaily[]>(`${this.API_URL}/performance/daily`, { params });
  }

  // Admin: Get top products report
  getTopProducts(limit?: number): Observable<any[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<any[]>(`${this.API_URL}/performance/top`, { params });
  }

  // Admin: Force aggregate calculation for a specific date
  triggerAggregation(date: string): Observable<{ message: string; data?: any }> {
    return this.http.post<{ message: string; data?: any }>(`${this.API_URL}/performance/aggregate`, { date });
  }

  // Admin: Get daily product clicks from ProductPerformanceDaily
  getDailyProductClicks(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<any[]>(`${this.API_URL}/performance/daily-clicks`, { params });
  }
}
