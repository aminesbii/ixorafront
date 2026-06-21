import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';
import { DashboardService } from '../../../../core/services/dashboard.service';

export interface ProductCardEvent {
  product: Product;
  variantId: string;
}

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  standalone: false
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() loading = false;
  @Output() addToCart = new EventEmitter<ProductCardEvent>();
  @Output() viewProduct = new EventEmitter<string>();

  constructor(private dashboardService: DashboardService) {}

  imgError = false;

  get mainImage(): string {
    if (this.imgError) return '';
    const img = this.product.images?.find(i => i.featured1) || this.product.images?.find(i => i.is_main) || this.product.images?.[0];
    return this.normalizeUrl(img?.image_url);
  }

  private normalizeUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('/api/uploads/')) return url;
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return url;
  }

  get hasImage(): boolean {
    return !!this.mainImage;
  }

  onImgError(): void {
    this.imgError = true;
  }

  get firstPrice(): string {
    const v = this.product.variants?.[0];
    return v ? `${v.price} ${v.currency}` : '';
  }

  get firstVariantId(): string {
    const v = this.product.variants?.[0];
    return v ? (v._id || v.id || '') : '';
  }

  onAddToCart(event: MouseEvent): void {
    event.stopPropagation();
    const vid = this.firstVariantId;
    if (!vid) return;
    this.addToCart.emit({ product: this.product, variantId: vid });
  }

  onClick(): void {
    this.trackClick();
    this.viewProduct.emit(this.product.slug);
  }

  private trackClick(): void {
    const id = this.product._id || this.product.id;
    if (!id) return;
    this.dashboardService.trackEvent({
      product_id: id,
      event_type: 'click'
    }).subscribe({
      error: (err) => console.error('Failed to track click:', err)
    });
  }
}
