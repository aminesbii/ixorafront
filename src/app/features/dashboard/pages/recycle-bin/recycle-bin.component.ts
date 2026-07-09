import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recycle-bin',
  templateUrl: './recycle-bin.component.html',
  styleUrls: ['./recycle-bin.component.css'],
  standalone: false
})
export class RecycleBinComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  selectedIds: Set<string> = new Set();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadDeletedProducts();
  }

  get allSelected(): boolean {
    return this.products.length > 0 && this.products.every(p => this.selectedIds.has(this.productId(p)));
  }

  productId(p: Product): string {
    return (p.id ?? (p as any)._id) as string;
  }

  loadDeletedProducts(): void {
    this.loading = true;
    this.productService.list({ is_deleted: true, limit: 100 }).subscribe({
      next: (res) => {
        this.products = res.products;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  toggleSelect(product: Product): void {
    const id = this.productId(product);
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.products.forEach(p => this.selectedIds.add(this.productId(p)));
    }
  }

  restoreProduct(product: Product): void {
    this.productService.restore(this.productId(product)).subscribe({
      next: () => {
        this.selectedIds.delete(this.productId(product));
        this.loadDeletedProducts();
      }
    });
  }

  restoreSelected(): void {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    this.productService.restoreMultiple(ids).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.loadDeletedProducts();
      }
    });
  }

  async hardDeleteProduct(product: Product): Promise<void> {
    const result = await Swal.fire({
      title: 'Permanently delete?',
      text: `This will permanently delete "${product.name}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Forever',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    this.productService.hardDelete(this.productId(product)).subscribe({
      next: () => {
        this.selectedIds.delete(this.productId(product));
        this.loadDeletedProducts();
      }
    });
  }

  async hardDeleteSelected(): Promise<void> {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    const result = await Swal.fire({
      title: `Permanently delete ${ids.length} product(s)?`,
      text: 'Products with order history will be skipped. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Forever',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    this.productService.hardDeleteMultiple(ids).subscribe({
      next: (res) => {
        this.selectedIds.clear();
        this.loadDeletedProducts();
        if (res.failed?.length) {
          Swal.fire('Skipped', `${res.failed.length} product(s) with order history were not deleted.`, 'info');
        }
      }
    });
  }

  async emptyBin(): Promise<void> {
    if (!this.products.length) return;
    const result = await Swal.fire({
      title: 'Empty recycle bin?',
      text: `Permanently delete all ${this.products.length} product(s) in the bin. Products with order history will be skipped.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Empty Bin',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    this.productService.emptyBin().subscribe({
      next: (res) => {
        this.loadDeletedProducts();
        if (res.failed?.length) {
          Swal.fire('Partially Emptied', `${res.deleted.length} deleted. ${res.failed.length} product(s) with order history skipped.`, 'info');
        } else {
          Swal.fire('Emptied!', 'Recycle bin has been emptied.', 'success');
        }
      }
    });
  }

  getMainImage(product: Product): string | null {
    if (!product.images?.length) return null;
    const img = product.images.find(i => i.featured1) || product.images.find(i => i.is_main) || product.images[0];
    return this.getImageUrl(img);
  }

  getImageUrl(img: any): string {
    const url = img.image_url;
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) return '/api' + parsed.pathname;
      if (parsed.pathname.startsWith('/api/uploads/')) return parsed.pathname;
      return parsed.pathname;
    }
    if (url.startsWith('/api/uploads/')) return url;
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return '/api/uploads/' + url;
  }

  showMainImage(product: Product): boolean {
    const url = this.getMainImage(product);
    return !!url;
  }

  brokenImages: Set<string> = new Set();

  onImageError(product: Product): void {
    this.brokenImages.add(this.productId(product));
  }

  getProductPrice(product: Product): string {
    if (product.base_price != null) return `${product.base_price} ${product.currency || 'TND'}`;
    const v = product.variants;
    if (v?.length) {
      const prices = v.map(x => x.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return `${min} ${product.currency || 'TND'}`;
      return `${min} - ${max} ${product.currency || 'TND'}`;
    }
    return '-';
  }
}
