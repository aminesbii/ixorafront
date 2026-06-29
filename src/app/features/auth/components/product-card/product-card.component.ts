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
    return this.normalizeUrl(img?.thumbnail_url || img?.image_url);
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

  private get priceSource(): { price: number; currency: string } | null {
    const v = this.product.variants?.[0];
    if (v) return { price: v.price, currency: v.currency };
    if (this.product.base_price != null) return { price: this.product.base_price, currency: this.product.currency ?? 'TND' };
    return null;
  }

  get hasPrice(): boolean {
    return this.priceSource !== null;
  }

  get firstPrice(): string {
    const ps = this.priceSource;
    return ps ? `${ps.price} ${ps.currency}` : '';
  }

  get hasSale(): boolean {
    return !!this.product.on_sale && !!this.product.sale_percentage && this.product.sale_percentage > 0;
  }

  get salePrice(): number | null {
    const ps = this.priceSource;
    if (!ps || !this.hasSale) return null;
    return Math.round(ps.price * (1 - this.product.sale_percentage! / 100) * 100) / 100;
  }

  get salePriceStr(): string {
    const ps = this.priceSource;
    if (!this.salePrice || !ps) return '';
    return `${this.salePrice} ${ps.currency}`;
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
