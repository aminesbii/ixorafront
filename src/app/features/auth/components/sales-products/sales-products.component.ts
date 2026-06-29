import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
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
export class SalesProductsComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  products: Product[] = [];
  loading = false;

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
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 100);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getMainImage(product: Product): string | null {
    const img = product.images?.find(i => i.featured1) || product.images?.find(i => i.is_main) || product.images?.[0];
    return img?.image_url || null;
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

  salePrice(product: Product): string | null {
    const ps = this.priceSource(product);
    if (!ps || !product.on_sale || !product.sale_percentage) return null;
    const sp = Math.round(ps.price * (1 - product.sale_percentage / 100) * 100) / 100;
    return `${sp} ${ps.currency}`;
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
