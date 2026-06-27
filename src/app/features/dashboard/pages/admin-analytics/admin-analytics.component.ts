import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import Chart from 'chart.js/auto';
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
  loadingChart = true;
  loadingStatusChart = true;
  chart: any;
  statusChart: any;
  private subscription = new Subscription();

  constructor(private http: HttpClient, private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchMostClicked();
    this.fetchEarningsChart();
    this.fetchStatusChart();
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
    this.fetchEarningsChart();
    this.fetchStatusChart();
  }

  fetchEarningsChart(): void {
    this.loadingChart = true;
    const sub = this.dashboardService.getEarningsStats(this.daysAgo).subscribe({
      next: (data) => {
        this.renderChart(data);
        this.loadingChart = false;
      },
      error: () => { this.loadingChart = false; }
    });
    this.subscription.add(sub);
  }

  renderChart(data: any[]): void {
    const labels = data.map(d => d.date);
    const earnings = data.map(d => d.earnings);
    const orders = data.map(d => d.orders);

    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = document.getElementById('earningsChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Earnings (MAD)',
            data: earnings,
            type: 'line',
            borderColor: '#8b5cf6', // Purple
            backgroundColor: '#8b5cf6',
            yAxisID: 'y',
            tension: 0.3
          },
          {
            label: 'Orders',
            data: orders,
            type: 'bar',
            backgroundColor: '#3b82f6', // Blue
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Earnings (MAD)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Orders' },
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  fetchStatusChart(): void {
    this.loadingStatusChart = true;
    const sub = this.dashboardService.getOrderStatusStats(this.daysAgo).subscribe({
      next: (data) => {
        this.renderStatusChart(data);
        this.loadingStatusChart = false;
      },
      error: () => { this.loadingStatusChart = false; }
    });
    this.subscription.add(sub);
  }

  renderStatusChart(data: any[]): void {
    const labels = data.map(d => d.status);
    const counts = data.map(d => d.count);

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: [
            '#10b981', // DELIVERED, ACTIVE etc
            '#f59e0b', // PENDING
            '#ef4444', // CANCELLED
            '#3b82f6', // SHIPPED / PROCESSING
            '#8b5cf6', // Purple
            '#6b7280'  // Gray
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  getConversionColor(rate: number): string {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.chart) this.chart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
