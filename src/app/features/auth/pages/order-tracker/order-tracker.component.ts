import { Component } from '@angular/core';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-tracker',
  templateUrl: './order-tracker.component.html',
  styleUrls: ['./order-tracker.component.css'],
  standalone: false
})
export class OrderTrackerComponent {
  orderNumber = '';
  loading = false;
  error = '';
  order: any = null;

  constructor(private orderService: OrderService) {}

  trackOrder(): void {
    const num = this.orderNumber.trim();
    if (!num) {
      this.error = 'Please enter an order number.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.order = null;

    this.orderService.trackByNumber(num).subscribe({
      next: (res) => {
        this.order = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'Order not found. Please check the order number.';
        } else {
          this.error = 'Failed to track order. Please try again.';
        }
      }
    });
  }

  clear(): void {
    this.orderNumber = '';
    this.order = null;
    this.error = '';
  }

  statusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-indigo-100 text-indigo-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
