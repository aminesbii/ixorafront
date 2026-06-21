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
  private fallbackProducts: FeaturedProductUI[] = [
    {
      id: 'fallback-1',
      slug: 'pure-green-tea-serum',
      variantId: 'fallback-var-1',
      name: 'Pure Green Tea Serum',
      price: '49.00 TND',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
      tag: 'New',
      description: 'Calming green tea extract serum for balanced skin'
    },
    {
      id: 'fallback-2',
      slug: 'deep-blue-hydration',
      variantId: 'fallback-var-2',
      name: 'Deep Blue Hydration',
      price: '59.00 TND',
      image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=600&auto=format&fit=crop',
      tag: 'Bestseller',
      description: '48-hour moisture with hyaluronic acid & marine botanicals'
    },
    {
      id: 'fallback-3',
      slug: 'rose-radiance-cream',
      variantId: 'fallback-var-3',
      name: 'Rose Radiance Cream',
      price: '54.00 TND',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop',
      tag: 'Popular',
      description: 'Luxurious rose-infused moisturizer for glowing skin'
    },
    {
      id: 'fallback-4',
      slug: 'vitamin-c-brightening',
      variantId: 'fallback-var-4',
      name: 'Vitamin C Brightening',
      price: '45.00 TND',
      image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b11?q=80&w=600&auto=format&fit=crop',
      tag: 'New',
      description: 'Brightening serum with stabilized vitamin C'
    }
  ];

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
            const imageUrl = mainImg?.image_url || '';
            const firstVar = prod.variants?.[0];
            const priceStr = firstVar ? `${firstVar.price} ${firstVar.currency}` : 'N/A';
            const variantId = firstVar?._id || null;

            return {
              id: prod._id,
              slug: prod.slug,
              variantId,
              name: prod.name,
              price: priceStr,
              image: imageUrl,
              tag: ''
            };
          });

          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
              this.initScrollAnimations();
              this.updateScrollState();
            }, 100);
          }
        } else {
          this.useFallbackProducts();
        }
      },
      error: (err) => {
        console.error('Failed to load featured products:', err);
        this.useFallbackProducts();
      }
    });
  }

  private useFallbackProducts() {
    this.featuredProducts = this.fallbackProducts;
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initScrollAnimations();
        this.updateScrollState();
      }, 100);
    }
  }

  addToCart(product: FeaturedProductUI) {
    if (!product.variantId || product.variantId.startsWith('fallback-')) {
      this.showFeedback('This is a demo product. Connect to backend to purchase.');
      return;
    }

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
    if (!product.id || product.id.startsWith('fallback-')) {
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
