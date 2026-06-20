import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface AnalyticsSummary {
  totalVisits: number;
  totalPurchases: number;
  totalAddToCart: number;
  conversionRate: number;
  totalClicks: number;
  totalViews: number;
}

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.css'],
  standalone: false
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  summary: AnalyticsSummary = {
    totalVisits: 0,
    totalPurchases: 0,
    totalAddToCart: 0,
    conversionRate: 0,
    totalClicks: 0,
    totalViews: 0
  };

  mostClickedProducts: any[] = [];
  loading = true;
  daysAgo = 30;
  loadingSummary = true;
  private subscription = new Subscription();

  constructor(private http: HttpClient, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchMostClicked();
  }

  fetchMostClicked(): void {
    this.loading = true;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.daysAgo);
    this.dashboardService.getDailyProductClicks(startDate.toISOString().split('T')[0]).subscribe({
      next: (data) => {
        this.mostClickedProducts = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  fetchSummary(): void {
    this.loadingSummary = true;
    const params = new HttpParams().set('days', this.daysAgo.toString());
    const sub = this.http.get<any>('/api/analytics/public-analytics', { params }).subscribe({
      next: (res) => {
        if (res && res.summary) {
          this.summary = res.summary;
        }
        this.loadingSummary = false;
      },
      error: () => { this.loadingSummary = false; }
    });
    this.subscription.add(sub);
  }

  setDays(days: number): void {
    this.daysAgo = days;
    this.fetchSummary();
    this.fetchMostClicked();
  }

  getConversionColor(rate: number): string {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
