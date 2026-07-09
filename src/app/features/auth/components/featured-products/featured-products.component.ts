import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, ViewChild, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface FeaturedProductUI {
  id: string;
  slug: string;
  variantId: string | null;
  name: string;
  price: string;
  originalPrice?: string;
  onSale?: boolean;
  salePercentage?: number;
  image: string;
  tag: string;
  description?: string;
}

@Component({
  selector: 'app-featured-products',
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.css'],
  standalone: false
})
export class FeaturedProductsComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;
  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef;

  featuredProducts: FeaturedProductUI[] = [];
  cartFeedbackMessage = '';
  canScrollLeft = false;
  canScrollRight = false;


  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 600);
    }
  }

  loadFeaturedProducts() {
    this.productService.list({ is_featured: true, status: 'active', limit: 8 }).subscribe({
      next: (res) => {
        if (res && res.products && res.products.length > 0) {
          this.featuredProducts = res.products.map(prod => {
            const mainImg = prod.images?.find(img => img.featured1) || prod.images?.find(img => img.is_main) || prod.images?.[0];
            const imageUrl = mainImg?.thumbnail_url || mainImg?.image_url || '';
            const firstVar = prod.variants?.[0];
            const price = firstVar?.price ?? prod.base_price;
            const currency = firstVar?.currency ?? prod.currency ?? 'TND';
            const priceStr = price != null ? `${price} ${currency}` : '';
            const variantId = firstVar?._id || null;
            const isOnSale = !!(prod.on_sale && prod.sale_percentage && prod.sale_percentage > 0);
            const salePrice = isOnSale && price != null
              ? `${Math.round(price * (1 - prod.sale_percentage! / 100) * 100) / 100} ${currency}`
              : priceStr;

            return {
              id: prod._id,
              slug: prod.slug,
              variantId,
              name: prod.name,
              price: salePrice,
              originalPrice: isOnSale ? priceStr : undefined,
              onSale: isOnSale,
              salePercentage: isOnSale ? prod.sale_percentage! : undefined,
              image: imageUrl,
              tag: isOnSale ? `-${prod.sale_percentage}%` : ''
            };
          });

          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
              this.initScrollAnimations();
              this.updateScrollState();
            }, 100);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load featured products:', err);
      }
    });
  }

  addToCart(product: FeaturedProductUI) {
    this.cartService.addItem(product.id, product.variantId, 1).subscribe({
      next: () => {
        this.showFeedback(`${product.name} added to cart!`);
      },
      error: (err) => {
        console.error('Error adding product to cart:', err);
        this.showFeedback('Failed to add product to cart.');
      }
    });
  }

  trackProductClick(product: FeaturedProductUI) {
    if (!product.id) {
      return;
    }

    this.dashboardService.trackEvent({
      product_id: product.id,
      event_type: 'click'
    }).subscribe({
      error: (err) => console.error('Failed to track click:', err)
    });
  }

  showFeedback(message: string) {
    this.cartFeedbackMessage = message;
    setTimeout(() => {
      if (this.cartFeedbackMessage === message) {
        this.cartFeedbackMessage = '';
      }
    }, 3000);
  }

  onScroll() {
    this.updateScrollState();
  }

  private updateScrollState() {
    const wrapper = this.scrollWrapper?.nativeElement;
    if (!wrapper) {
      this.canScrollLeft = false;
      this.canScrollRight = false;
      return;
    }
    if (this.featuredProducts.length <= 4) {
      this.canScrollLeft = false;
      this.canScrollRight = false;
      return;
    }
    this.canScrollLeft = wrapper.scrollLeft > 4;
    this.canScrollRight = wrapper.scrollLeft + wrapper.clientWidth < wrapper.scrollWidth - 4;
  }

  scrollLeft() {
    const wrapper = this.scrollWrapper?.nativeElement;
    if (!wrapper) return;
    const card = wrapper.querySelector('.product-card--scroll');
    const cardWidth = card ? card.getBoundingClientRect().width : 0;
    const gap = 24;
    wrapper.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 350);
  }

  scrollRight() {
    const wrapper = this.scrollWrapper?.nativeElement;
    if (!wrapper) return;
    const card = wrapper.querySelector('.product-card--scroll');
    const cardWidth = card ? card.getBoundingClientRect().width : 0;
    const gap = 24;
    wrapper.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 350);
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScrollState();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.featuredProducts.length <= 4) return;
    const wrapper = this.scrollWrapper?.nativeElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    if (event.key === 'ArrowLeft') {
      this.scrollLeft();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.scrollRight();
      event.preventDefault();
    }
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Number(el.getAttribute('data-delay') || 0);
          const isCard = el.classList.contains('product-card');

          if (isCard) {
            gsap.fromTo(el,
              { opacity: 0, y: 60, scale: 0.92 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1.1,
                delay,
                ease: "power4.out"
              }
            );
          } else {
            gsap.fromTo(el,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power3.out"
              }
            );
          }

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
