import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

// Import Services
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CartService } from '../../../../core/services/cart.service';

// Import Types
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';

interface FeaturedProductUI {
  id: string;
  variantId: string | null;
  name: string;
  price: string;
  image: string;
  tag: string;
}

interface CategoryUI {
  name: string;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  featuredProducts: FeaturedProductUI[] = [];
  categories: CategoryUI[] = [];

  testimonials = [
    { quote: "IXORA completely transformed my skincare routine. The hydration is unmatched.", author: "Amina F." },
    { quote: "I love that it's 100% local but feels like a premium international brand.", author: "Youssef T." },
    { quote: "The best serum I've used. My skin has never looked more glowing.", author: "Sonia M." }
  ];

  // Simple feedback message
  cartFeedbackMessage = '';

  constructor(
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadCategories();
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
            // Find main image
            const mainImg = prod.images?.find(img => img.is_main) || prod.images?.[0];
            const imageUrl = mainImg?.image_url || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop';
            
            // Get first variant price
            const firstVar = prod.variants?.[0];
            const priceStr = firstVar ? `${firstVar.price} ${firstVar.currency}` : 'N/A';
            const variantId = firstVar?._id || null;

            return {
              id: prod._id,
              variantId,
              name: prod.name,
              price: priceStr,
              image: imageUrl.startsWith('http') ? imageUrl : imageUrl, // Handles local path or remote URL
              tag: prod.brand_name || 'Xora'
            };
          });
          
          // Re-trigger scroll animations after DOM updates
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

  loadCategories() {
    this.categoryService.list({ is_active: true }).subscribe({
      next: (cats) => {
        // Map category list with premium cover images
        this.categories = cats.map(cat => {
          let image = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop';
          const nameLower = cat.name.toLowerCase();
          
          if (nameLower.includes('serum')) {
            image = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('moisturizer') || nameLower.includes('cream')) {
            image = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('cleanser') || nameLower.includes('wash')) {
            image = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('shampoo')) {
            image = 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('oil') || nameLower.includes('mask') || nameLower.includes('hair')) {
            image = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('skin')) {
            image = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop';
          } else if (nameLower.includes('wellness')) {
            image = 'https://images.unsplash.com/photo-1571781926291-c477eb31f24e?q=80&w=400&auto=format&fit=crop';
          }

          return {
            name: cat.name,
            image,
            slug: cat.slug
          };
        });
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
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

  getStarted() {
    this.router.navigate(['/auth/login']);
  }
}
