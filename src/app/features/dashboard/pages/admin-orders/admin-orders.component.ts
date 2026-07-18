import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { ColissimoService } from '../../../../core/services/colissimo.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
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

  selectedIds: Set<string> = new Set();
  confirmBulkDelete = false;

  get allSelected(): boolean {
    const filtered = this.filteredOrders();
    return filtered.length > 0 && filtered.every(o => this.selectedIds.has(o._id));
  }

  toggleSelect(order: Order): void {
    if (this.selectedIds.has(order._id)) {
      this.selectedIds.delete(order._id);
    } else {
      this.selectedIds.add(order._id);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.filteredOrders().forEach(o => this.selectedIds.add(o._id));
    }
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    this.confirmBulkDelete = true;
  }

  cancelBulkDelete(): void {
    this.confirmBulkDelete = false;
  }

  executeBulkDelete(): void {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    this.orderService.deleteMultiple(ids).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.confirmBulkDelete = false;
        this.showToast(`${ids.length} order(s) deleted`);
        this.loadOrders();
      },
      error: () => {}
    });
  }

  confirmDeleteOrder: Order | null = null;
  deleteCountdown = 0;
  private deleteTimer: any = null;

  colissimoSending = false;
  colissimoRefreshing = false;
  editColissimoPieces = 1;
  editColissimoType = 'VO';
  editColissimoDesignation = '';
  editColissimoCommentaire = '';

  private socketSub: Subscription | null = null;

  constructor(
    private orderService: OrderService,
    private colissimoService: ColissimoService,
    private ws: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.socketSub = this.ws.orderUpdates$.subscribe(() => {
      this.loadOrders();
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.deleteTimer) clearInterval(this.deleteTimer);
    this.socketSub?.unsubscribe();
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
    this.selectedIds.clear();
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.selectedIds.clear();
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
        const data = full as any;
        this.selectedOrder = data;
        this.loadingDetail = false;
        this.syncEditFields();

        const parcel = data?.colissimoParcel;
        if (parcel?.barcode) {
          this.colissimoService.verifyParcel(data._id).subscribe({
            next: (res: any) => {
              if (res?.order) {
                this.selectedOrder = res.order as any;
                this.syncEditFields();
              }
            }
          });
        }
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
    const parcel = (this.selectedOrder as any)?.colissimoParcel;
    if (parcel) {
      this.editColissimoPieces = parcel.nb_pieces ?? 1;
      this.editColissimoType = parcel.type || 'VO';
      this.editColissimoDesignation = parcel.designation || '';
      this.editColissimoCommentaire = parcel.commentaire || '';
    } else {
      this.editColissimoPieces = 1;
      this.editColissimoType = 'VO';
      this.editColissimoDesignation = '';
      this.editColissimoCommentaire = '';
    }
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

  sendToColissimo(): void {
    if (!this.selectedOrder) return;
    this.colissimoSending = true;
    this.colissimoService.createParcel(this.selectedOrder._id, {
      nb_pieces: this.editColissimoPieces,
      type: this.editColissimoType,
      designation: this.editColissimoDesignation,
      commentaire: this.editColissimoCommentaire,
    }).subscribe({
      next: (res) => {
        this.colissimoSending = false;
        this.showToast('Order sent to Colissimo');
        this.viewOrder(this.selectedOrder!);
      },
      error: (err) => {
        this.colissimoSending = false;
        this.showToast(err?.error?.message || 'Failed to send to Colissimo');
      }
    });
  }

  refreshColissimoParcel(): void {
    if (!this.selectedOrder) return;
    this.colissimoRefreshing = true;
    this.colissimoService.verifyParcel(this.selectedOrder._id).subscribe({
      next: (res) => {
        this.colissimoRefreshing = false;
        if (res.reset) {
          this.showToast(`Parcel ${res.barcode} removed from Colissimo — reset to Draft`);
          this.viewOrder(this.selectedOrder!);
        } else if (res.colissimoStatus) {
          this.showToast(`Colissimo status: ${res.colissimoStatus}`);
          this.viewOrder(this.selectedOrder!);
        }
      },
      error: () => {
        this.colissimoRefreshing = false;
        this.showToast('Failed to verify with Colissimo');
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  printColissimoLabel(): void {
    const parcel = (this.selectedOrder as any)?.colissimoParcel;
    if (!parcel?.barcode) return;
    this.colissimoService.getParcelPdf(parcel.barcode).subscribe({
      next: (blob) => this.downloadBlob(blob, `colissimo-${parcel.barcode}.pdf`),
    });
  }

  getOrderBarcode(order: any): string | null {
    return order?.colissimoParcel?.barcode || null;
  }

  printLabel(barcode: string | null | undefined): void {
    if (!barcode) return;
    this.colissimoService.getParcelPdf(barcode).subscribe({
      next: (blob) => this.downloadBlob(blob, `colissimo-${barcode}.pdf`),
    });
  }

  get colissimoParcel(): any {
    return (this.selectedOrder as any)?.colissimoParcel || null;
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
    this.selectedIds.clear();
    this.loadOrders();
  }

  clearUserFilter(): void {
    this.userFilterId = null;
    this.userFilterName = '';
    this.userFilterEmail = '';
    this.currentPage = 1;
    this.selectedIds.clear();
    this.loadOrders();
  }
}
