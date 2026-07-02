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
  loadingHourlyChart = true;
  chart: any;
  statusChart: any;
  hourlyChart: any;
  private subscription = new Subscription();

  constructor(private http: HttpClient, private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchMostClicked();
    this.fetchEarningsChart();
    this.fetchStatusChart();
    this.fetchHourlyVisits();
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
    this.fetchHourlyVisits();
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

  fetchHourlyVisits(): void {
    this.loadingHourlyChart = true;
    const sub = this.dashboardService.getHourlyVisits(this.daysAgo).subscribe({
      next: (data) => {
        this.renderHourlyChart(data);
        this.loadingHourlyChart = false;
      },
      error: () => { this.loadingHourlyChart = false; }
    });
    this.subscription.add(sub);
  }

  renderHourlyChart(data: { hour: number; visits: number }[]): void {
    if (this.hourlyChart) {
      this.hourlyChart.destroy();
    }
    const canvas = document.getElementById('hourlyChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    const labels = data.map(d => {
      const h = d.hour;
      const suffix = h >= 12 ? 'pm' : 'am';
      const display = h % 12 === 0 ? 12 : h % 12;
      return `${display}${suffix}`;
    });
    const visits = data.map(d => d.visits);
    const maxVisits = Math.max(...visits);
    const barColors = visits.map(v =>
      v === maxVisits && maxVisits > 0 ? '#f59e0b' : 'rgba(59, 130, 246, 0.75)'
    );

    this.hourlyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visits',
          data: visits,
          backgroundColor: barColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Hour: ${labels[items[0].dataIndex]}`,
              label: (item) => ` ${item.raw} visit${(item.raw as number) !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            title: { display: true, text: 'Visits' }
          }
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
    if (this.hourlyChart) this.hourlyChart.destroy();
  }
}
