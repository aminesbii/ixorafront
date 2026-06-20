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

interface TopProduct {
  product_id: string;
  name: string;
  slug: string;
  brand_name?: string | null;
  image_url: string;
  clicks: number;
  views: number;
  add_to_cart: number;
  purchases: number;
  conversion_rate: number;
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

  topProducts: TopProduct[] = [];
  loading = true;
  daysAgo = 30;
  private subscription = new Subscription();

  dailyProductClicks: any[] = [];
  loadingDailyClicks = false;
  dailyClicksDays = 30;

  constructor(private http: HttpClient, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.fetchAnalytics();
    this.fetchDailyProductClicks();
  }

  fetchDailyProductClicks(): void {
    this.loadingDailyClicks = true;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.dailyClicksDays);
    this.dashboardService.getDailyProductClicks(startDate.toISOString().split('T')[0]).subscribe({
      next: (data) => {
        this.dailyProductClicks = data;
        this.loadingDailyClicks = false;
      },
      error: () => { this.loadingDailyClicks = false; }
    });
  }

  setDailyClicksDays(days: number): void {
    this.dailyClicksDays = days;
    this.fetchDailyProductClicks();
  }

  fetchAnalytics(): void {
    this.loading = true;
    const params = new HttpParams().set('days', this.daysAgo.toString());
    const sub = this.http.get<any>('/api/analytics/public-analytics', { params }).subscribe({
      next: (res) => {
        if (res && res.summary) {
          this.summary = res.summary;
          this.topProducts = res.topProducts || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.subscription.add(sub);
  }

  setDays(days: number): void {
    this.daysAgo = days;
    this.fetchAnalytics();
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
