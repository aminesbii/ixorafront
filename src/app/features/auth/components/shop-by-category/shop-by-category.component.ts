import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { CategoryService } from '../../../../core/services/category.service';

interface CategoryUI {
  name: string;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-shop-by-category',
  templateUrl: './shop-by-category.component.html',
  styleUrls: ['./shop-by-category.component.css'],
  standalone: false
})
export class ShopByCategoryComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  categories: CategoryUI[] = [];

  private fallbackCategories: CategoryUI[] = [
    {
      name: 'Serums & Treatments',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
      slug: 'serums-treatments'
    },
    {
      name: 'Moisturizers',
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop',
      slug: 'moisturizers'
    },
    {
      name: 'Cleansers',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
      slug: 'cleansers'
    },
    {
      name: 'Hair Care',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop',
      slug: 'hair-care'
    },
    {
      name: 'Wellness',
      image: 'https://images.unsplash.com/photo-1571781926291-c477eb31f24e?q=80&w=600&auto=format&fit=crop',
      slug: 'wellness'
    },
    {
      name: 'Body Care',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop',
      slug: 'body-care'
    }
  ];

  constructor(
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 500);
    }
  }

  loadCategories() {
    this.categoryService.list({ is_active: true }).subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categories = cats.map(cat => {
            let image = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop';
            const nameLower = cat.name.toLowerCase();
            if (nameLower.includes('serum')) {
              image = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop';
            } else if (nameLower.includes('moisturizer') || nameLower.includes('cream')) {
              image = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop';
            } else if (nameLower.includes('cleanser') || nameLower.includes('wash')) {
              image = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop';
            } else if (nameLower.includes('shampoo')) {
              image = 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop';
            } else if (nameLower.includes('oil') || nameLower.includes('mask') || nameLower.includes('hair')) {
              image = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop';
            } else if (nameLower.includes('wellness')) {
              image = 'https://images.unsplash.com/photo-1571781926291-c477eb31f24e?q=80&w=600&auto=format&fit=crop';
            }
            return { name: cat.name, image, slug: cat.slug };
          });
        } else {
          this.categories = this.fallbackCategories;
        }
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 100);
        }
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.categories = this.fallbackCategories;
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 100);
        }
      }
    });
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
