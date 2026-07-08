import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderItem } from '../../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css'],
  standalone: false
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = false;

  searchTerm = '';
  filterStatus = '';
  sortDate = '';
  currentPage = 1;
  totalPages = 1;
  totalOrders = 0;

  userFilterId: string | null = null;
  userFilterName = '';
  userFilterEmail = '';

  selectedOrder: (Order & { items?: OrderItem[] }) | null = null;
  loadingDetail = false;

  isSaving = false;
  statusDropdownOpen = false;
  editName = '';
  editEmail = '';
  editPhone = '';
  editStatus = '';
  editTryCount = 0;
  editShippingFee = 0;
  editDiscountTotal = 0;
  editTaxTotal = 0;

  allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'tried'];

  statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    tried: 'bg-orange-100 text-orange-800'
  };

  statusColorClass(status: string): string {
    return this.statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  editingStatusId: string | null = null;
  editingStatusValue = '';



  toastMessage = '';
  toastVisible = false;
  private toastTimer: any = null;

  confirmDeleteOrder: Order | null = null;
  deleteCountdown = 0;
  private deleteTimer: any = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.deleteTimer) clearInterval(this.deleteTimer);
  }

  loadOrders(): void {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: 20 };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.sortDate === 'newest') params.sort = '-createdAt';
    else if (this.sortDate === 'oldest') params.sort = 'createdAt';

    const obs = this.userFilterId
      ? this.orderService.listByUser(this.userFilterId, params)
      : this.orderService.listAll(params);

    obs.subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.totalPages = res.pages;
        this.totalOrders = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  filteredOrders(): Order[] {
    if (!this.searchTerm) return this.orders;
    const q = this.searchTerm.toLowerCase();
    return this.orders.filter(o =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.order_number?.toLowerCase().includes(q)
    );
  }

  startInlineEdit(order: Order): void {
    this.editingStatusId = order._id;
    this.editingStatusValue = order.status;
  }

  cancelInlineEdit(): void {
    this.editingStatusId = null;
  }

  updateTryCount(order: Order, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = Math.max(0, Math.floor(Number(input.value) || 0));
    input.value = String(val);
    if (val === (order.try_count ?? 0)) return;
    this.orderService.update(order._id, { try_count: val } as any).subscribe({
      next: () => {
        order.try_count = val;
        this.showToast(`Try count updated to ${val}`);
      },
      error: () => {}
    });
  }

  commitInlineEdit(order: Order, status: string): void {
    this.editingStatusId = null;
    if (status === order.status) return;
    this.orderService.updateStatus(order._id, status as Order['status']).subscribe({
      next: () => {
        order.status = status as Order['status'];
        this.showToast(`Order updated to: ${status}`);
        this.loadOrders();
      },
      error: () => {}
    });
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.toastMessage = '';
    }, 3000);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  confirmDelete(order: Order): void {
    this.cancelInlineEdit();
    this.confirmDeleteOrder = order;
    this.deleteCountdown = 3;
    if (this.deleteTimer) clearInterval(this.deleteTimer);
    this.deleteTimer = setInterval(() => {
      this.deleteCountdown--;
      if (this.deleteCountdown <= 0) {
        if (this.deleteTimer) clearInterval(this.deleteTimer);
        this.deleteTimer = null;
      }
    }, 1000);
  }

  cancelDelete(): void {
    if (this.deleteTimer) clearInterval(this.deleteTimer);
    this.deleteTimer = null;
    this.confirmDeleteOrder = null;
    this.deleteCountdown = 0;
    this.cancelInlineEdit();
  }

  executeDelete(): void {
    if (!this.confirmDeleteOrder) return;
    const id = this.confirmDeleteOrder._id;
    this.orderService.delete(id).subscribe({
      next: () => {
        this.showToast('Order deleted');
        this.confirmDeleteOrder = null;
        this.deleteCountdown = 0;
        if (this.deleteTimer) clearInterval(this.deleteTimer);
        this.deleteTimer = null;
        this.loadOrders();
      },
      error: () => {}
    });
  }

  // ─── Detail Modal ────────────────────────────────────────────────────────────

  viewOrder(order: Order): void {
    this.loadingDetail = true;
    this.selectedOrder = null;
    this.cancelDelete();
    this.cancelInlineEdit();
    this.orderService.getById(order._id).subscribe({
      next: (full) => {
        this.selectedOrder = full as any;
        this.loadingDetail = false;
        this.syncEditFields();
      },
      error: () => (this.loadingDetail = false)
    });
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.cancelInlineEdit();
  }

  private syncEditFields(): void {
    if (!this.selectedOrder) return;
    this.editName = this.selectedOrder.customer_name || '';
    this.editEmail = this.selectedOrder.customer_email || '';
    this.editPhone = this.selectedOrder.customer_phone || '';
    this.editStatus = this.selectedOrder.status || '';
    this.editTryCount = this.selectedOrder.try_count ?? 0;
    this.editShippingFee = this.selectedOrder.shipping_fee || 0;
    this.editDiscountTotal = this.selectedOrder.discount_total || 0;
    this.editTaxTotal = this.selectedOrder.tax_total || 0;
  }

  saveOrder(): void {
    if (!this.selectedOrder) return;
    this.isSaving = true;

    const data: any = {
      customer_name: this.editName,
      customer_email: this.editEmail,
      customer_phone: this.editPhone || null,
      status: this.editStatus,
      try_count: this.editTryCount,
      shipping_fee: this.editShippingFee,
      discount_total: this.editDiscountTotal,
      tax_total: this.editTaxTotal
    };

    this.orderService.update(this.selectedOrder._id, data).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToast('Order updated');
        this.loadOrders();
        this.closeDetail();
      },
      error: () => (this.isSaving = false)
    });
  }

  formatDate(d?: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  orderTotal(order: Order): number {
    return order.grand_total ?? 0;
  }

  // ─── User Order History ─────────────────────────────────────────────────────

  viewUserOrders(order: Order): void {
    this.userFilterId = order.user_id || null;
    this.userFilterName = order.customer_name || '';
    this.userFilterEmail = order.customer_email || '';
    this.searchTerm = '';
    this.filterStatus = '';
    this.currentPage = 1;
    this.loadOrders();
  }

  clearUserFilter(): void {
    this.userFilterId = null;
    this.userFilterName = '';
    this.userFilterEmail = '';
    this.currentPage = 1;
    this.loadOrders();
  }
}
