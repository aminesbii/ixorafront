import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-sales-products',
  templateUrl: './sales-products.component.html',
  styleUrls: ['./sales-products.component.css'],
  standalone: false
})
export class SalesProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  products: Product[] = [];
  loading = false;

  countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  hasCountdown = false;
  private countdownInterval: any;
  private earliestEndDate: Date | null = null;

  constructor(
    private productService: ProductService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadSaleProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 600);
    }
  }

  loadSaleProducts() {
    this.loading = true;
    this.productService.list({ on_sale: true, status: 'active', limit: 4 }).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.loading = false;
        this.computeCountdown();
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 100);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getMainImage(product: Product): string | null {
    const img = product.images?.find(i => i.featured1) || product.images?.find(i => i.is_main) || product.images?.[0];
    return img?.thumbnail_url || img?.image_url || null;
  }

  normalizeUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('/api/uploads/')) return url;
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return url;
  }

  private priceSource(product: Product): { price: number; currency: string } | null {
    const v = product.variants?.[0];
    if (v) return { price: v.price, currency: v.currency };
    if (product.base_price != null) return { price: product.base_price, currency: product.currency ?? 'TND' };
    return null;
  }

  productHasPrice(product: Product): boolean {
    return this.priceSource(product) !== null;
  }

  firstVariantPrice(product: Product): string {
    const ps = this.priceSource(product);
    return ps ? `${ps.price} ${ps.currency}` : '';
  }

  private isSaleActive(product: Product): boolean {
    if (!product.on_sale || !product.sale_percentage) return false;
    if (product.sale_end_date) {
      const now = new Date();
      const end = new Date(product.sale_end_date);
      if (!isNaN(end.getTime()) && end.getTime() - now.getTime() < 0) return false;
    }
    return true;
  }

  salePrice(product: Product): string | null {
    const ps = this.priceSource(product);
    if (!ps || !this.isSaleActive(product)) return null;
    const sp = Math.round(ps.price * (1 - product.sale_percentage! / 100) * 100) / 100;
    return `${sp} ${ps.currency}`;
  }

  private computeCountdown(): void {
    const now = new Date();
    let earliest: Date | null = null;

    for (const p of this.products) {
      if (p.sale_end_date) {
        const end = new Date(p.sale_end_date);
        if (!isNaN(end.getTime()) && end.getTime() > now.getTime()) {
          if (!earliest || end.getTime() < earliest.getTime()) {
            earliest = end;
          }
        }
      }
    }

    if (earliest) {
      this.earliestEndDate = earliest;
      this.hasCountdown = true;
      this.updateCountdown();
      if (isPlatformBrowser(this.platformId)) {
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
      }
    } else {
      this.hasCountdown = false;
    }
  }

  private updateCountdown(): void {
    if (!this.earliestEndDate) return;
    const now = new Date();
    const diff = this.earliestEndDate.getTime() - now.getTime();

    if (diff <= 0) {
      this.hasCountdown = false;
      clearInterval(this.countdownInterval);
      return;
    }

    this.countdown = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Number(el.getAttribute('data-delay') || 0);
          gsap.fromTo(el,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              delay,
              ease: "power3.out"
            }
          );
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    this.revealElements.forEach(elRef => {
      if (elRef.nativeElement) {
        observer.observe(elRef.nativeElement);
      }
    });
  }
}
