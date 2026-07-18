import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, merge } from 'rxjs';
import { ColissimoService } from '../../../../core/services/colissimo.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-admin-deliveries',
  templateUrl: './admin-deliveries.component.html',
  styleUrls: ['./admin-deliveries.component.css'],
  standalone: false
})
export class AdminDeliveriesComponent implements OnInit, OnDestroy {
  deliveries: any[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalDeliveries = 0;

  toastMessage = '';
  toastVisible = false;
  private toastTimer: any = null;
  private socketSub: Subscription | null = null;

  orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    tried: 'bg-orange-100 text-orange-800',
  };

  constructor(
    private colissimoService: ColissimoService,
    private ws: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.socketSub = merge(
      this.ws.orderUpdates$,
      this.ws.deliveryUpdates$
    ).subscribe(() => {
      this.loadDeliveries();
    });
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  colissimoStatusBadge(status: string | null): { bg: string; text: string; label: string } {
    if (!status) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inconnu' };
    const s = status.toLowerCase();
    if (/livr/i.test(s)) return { bg: 'bg-green-100', text: 'text-green-800', label: status };
    if (/attente|encours|en cours|transit|prepar/i.test(s)) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: status };
    if (/erreur|annul/i.test(s)) return { bg: 'bg-red-100', text: 'text-red-800', label: status };
    if (/retour/i.test(s)) return { bg: 'bg-orange-100', text: 'text-orange-800', label: status };
    return { bg: 'bg-blue-100', text: 'text-blue-800', label: status };
  }

  orderStatusColorClass(status: string): string {
    return this.orderStatusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  loadDeliveries(): void {
    this.loading = true;
    this.colissimoService.listDeliveries({ page: this.currentPage, limit: 20 }).subscribe({
      next: (res) => {
        this.deliveries = res.deliveries;
        this.totalPages = res.pages;
        this.totalDeliveries = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadDeliveries();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadDeliveries();
  }

  filteredDeliveries(): any[] {
    if (!this.searchTerm) return this.deliveries;
    const q = this.searchTerm.toLowerCase();
    return this.deliveries.filter(
      (d) =>
        d.barcode?.toLowerCase().includes(q) ||
        d.reference?.toLowerCase().includes(q) ||
        d.client?.toLowerCase().includes(q) ||
        d.order?.order_number?.toLowerCase().includes(q) ||
        d.order?.customer_name?.toLowerCase().includes(q)
    );
  }

  formatDate(d?: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  selectedBarcodes: Set<string> = new Set();

  get allSelected(): boolean {
    const filtered = this.filteredDeliveries();
    return filtered.length > 0 && filtered.every(d => this.selectedBarcodes.has(d.barcode));
  }

  toggleSelect(d: any): void {
    if (this.selectedBarcodes.has(d.barcode)) {
      this.selectedBarcodes.delete(d.barcode);
    } else {
      this.selectedBarcodes.add(d.barcode);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedBarcodes.clear();
    } else {
      this.filteredDeliveries().forEach(d => d.barcode && this.selectedBarcodes.add(d.barcode));
    }
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

  printLabel(barcode: string): void {
    this.colissimoService.getParcelPdf(barcode).subscribe({
      next: (blob) => this.downloadBlob(blob, `colissimo-${barcode}.pdf`),
      error: () => this.showToast(`Failed to download label for ${barcode}`),
    });
  }

  printSelected(): void {
    const barcodes = Array.from(this.selectedBarcodes).filter(Boolean);
    if (barcodes.length === 0) {
      this.showToast('No parcels selected');
      return;
    }
    if (barcodes.length === 1) {
      this.printLabel(barcodes[0]);
      return;
    }
    this.colissimoService.getBatchParcelPdf(barcodes).subscribe({
      next: (blob) => this.downloadBlob(blob, 'colissimo-labels.zip'),
      error: () => this.showToast('Failed to generate batch labels'),
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
}
