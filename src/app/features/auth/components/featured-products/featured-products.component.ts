import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';

interface FeaturedProductUI {
  id: string;
  variantId: string | null;
  name: string;
  price: string;
  image: string;
  tag: string;
}

@Component({
  selector: 'app-featured-products',
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.css'],
  standalone: false
})
export class FeaturedProductsComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  featuredProducts: FeaturedProductUI[] = [];
  cartFeedbackMessage = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 500);
    }
  }

  loadFeaturedProducts() {
    this.productService.list({ is_featured: true, status: 'active', limit: 8 }).subscribe({
      next: (res) => {
        if (res && res.products) {
          this.featuredProducts = res.products.map(prod => {
            const mainImg = prod.images?.find(img => img.is_main) || prod.images?.[0];
            const imageUrl = mainImg?.image_url || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop';
            const firstVar = prod.variants?.[0];
            const priceStr = firstVar ? `${firstVar.price} ${firstVar.currency}` : 'N/A';
            const variantId = firstVar?._id || null;

            return {
              id: prod._id,
              variantId,
              name: prod.name,
              price: priceStr,
              image: imageUrl,
              tag: prod.brand_name || 'Xora'
            };
          });

          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.initScrollAnimations(), 100);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load featured products:', err);
      }
    });
  }

  addToCart(product: FeaturedProductUI) {
    if (!product.variantId) {
      this.showFeedback('This product is currently unavailable.');
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

  showFeedback(message: string) {
    this.cartFeedbackMessage = message;
    setTimeout(() => {
      if (this.cartFeedbackMessage === message) {
        this.cartFeedbackMessage = '';
      }
    }, 3000);
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const lineInners = el.querySelectorAll('.line-reveal-inner');
          if (lineInners.length > 0) {
            gsap.to(lineInners, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out",
              delay: Number(el.getAttribute('data-delay') || 0)
            });
            gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1 });
          } else {
            gsap.to(el, {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              duration: 1.2,
              ease: "power3.out",
              delay: Number(el.getAttribute('data-delay') || 0)
            });
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
