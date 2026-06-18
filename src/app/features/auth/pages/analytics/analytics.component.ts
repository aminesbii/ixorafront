import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

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

interface DailyMetric {
  date: string;
  visits: number;
  purchases: number;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  standalone: false
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  summary: AnalyticsSummary = {
    totalVisits: 0,
    totalPurchases: 0,
    totalAddToCart: 0,
    conversionRate: 0,
    totalClicks: 0,
    totalViews: 0
  };

  topProducts: TopProduct[] = [];
  dailyMetrics: DailyMetric[] = [];
  loading = true;
  daysAgo = 30;

  private subscription = new Subscription();

  chartLabels: string[] = [];
  chartVisitsData: number[] = [];
  chartPurchaseData: number[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAnalytics();
  }

  fetchAnalytics(): void {
    this.loading = true;
    const params = new HttpParams().set('days', this.daysAgo.toString());
    const sub = this.http.get<any[]>('/api/analytics/public-analytics', { params }).subscribe({
      next: (res: any) => {
        if (res && res.summary) {
          this.summary = res.summary;
          this.topProducts = res.topProducts || [];
          this.dailyMetrics = res.dailyMetrics || [];
          this.updateChartData();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.subscription.add(sub);
  }

  updateChartData(): void {
    this.chartLabels = this.dailyMetrics.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    this.chartVisitsData = this.dailyMetrics.map(d => d.visits);
    this.chartPurchaseData = this.dailyMetrics.map(d => d.purchases);
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
