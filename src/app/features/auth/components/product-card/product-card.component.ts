import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
export class ProductCardComponent implements AfterViewInit {
  @Input() product!: Product;
  @Input() loading = false;
  @Output() addToCart = new EventEmitter<ProductCardEvent>();
  @Output() viewProduct = new EventEmitter<string>();

  constructor(
    private dashboardService: DashboardService,
    private elRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  imgError = false;
  private viewTracked = false;

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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.viewTracked) {
        this.viewTracked = true;
        this.trackView();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(this.elRef.nativeElement);
  }

  private trackView(): void {
    const id = this.product._id || this.product.id;
    if (!id) return;
    this.dashboardService.trackEvent({
      product_id: id,
      event_type: 'view'
    }).subscribe({
      error: (err) => console.error('Failed to track view:', err)
    });
  }

  onImgError(): void {
    this.imgError = true;
  }

  private get priceSource(): { price: number; currency: string } | null {
    if (this.product.base_price != null) return { price: this.product.base_price, currency: this.product.currency ?? 'TND' };
    const v = this.product.variants?.[0];
    if (v) return { price: v.price, currency: v.currency };
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
    if (!this.product.on_sale || !this.product.sale_percentage || this.product.sale_percentage <= 0) return false;
    if (this.product.sale_end_date) {
      const now = new Date();
      const end = new Date(this.product.sale_end_date);
      if (!isNaN(end.getTime()) && end.getTime() - now.getTime() < 0) return false;
    }
    return true;
  }

  get isOutOfStock(): boolean {
    if (this.product.variants && this.product.variants.length > 0) {
      return this.product.variants.every(v => v.stock_qty <= 0);
    }
    return false;
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

  onAddToCart(event: MouseEvent): void {
    event.stopPropagation();
    this.trackAddToCart();
    this.addToCart.emit({ product: this.product, variantId: null as any });
  }

  private trackAddToCart(): void {
    const id = this.product._id || this.product.id;
    if (!id) return;
    this.dashboardService.trackEvent({
      product_id: id,
      event_type: 'add_to_cart'
    }).subscribe({
      error: (err) => console.error('Failed to track add_to_cart:', err)
    });
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
