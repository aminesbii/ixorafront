import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-tracker',
  templateUrl: './order-tracker.component.html',
  styleUrls: ['./order-tracker.component.css'],
  standalone: false
})
export class OrderTrackerComponent implements OnInit {
  // Single order track (guest)
  orderNumber = '';
  loading = false;
  error = '';
  order: any = null;

  // All orders (authenticated)
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  allOrdersLoaded = false;
  loadingOrders = false;
  ordersError = '';

  // Filters & sort
  searchCode = '';
  statusFilter = 'all';
  sortBy = '-createdAt';

  // Expand
  expandedOrderId: string | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderParam = params['order'];
      if (orderParam) {
        this.orderNumber = orderParam;
        this.trackOrder();
      }
    });

    if (this.authService.isLoggedIn()) {
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.loadingOrders = true;
    this.ordersError = '';
    this.orderService.myOrders({ limit: 50 }).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.applyFilters();
        this.loadingOrders = false;
        this.allOrdersLoaded = true;
      },
      error: () => {
        this.loadingOrders = false;
        this.ordersError = 'Failed to load orders.';
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    if (this.searchCode.trim()) {
      const q = this.searchCode.trim().toLowerCase();
      filtered = filtered.filter(o => o.order_number.toLowerCase().includes(q));
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === this.statusFilter);
    }

    if (this.sortBy === '-createdAt') {
      filtered.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    }

    this.filteredOrders = filtered;
  }

  toggleExpand(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded'
    };
    return labels[status] || status;
  }

  getItemImage(item: any): string {
    return item.product_image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop';
  }
}
