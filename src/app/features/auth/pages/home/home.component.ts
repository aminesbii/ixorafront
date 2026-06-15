import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  featuredProducts = [
    { name: 'IXORA Cleansing Gel', price: '45 TND', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop', tag: 'New' },
    { name: 'IXORA Hydrating Serum', price: '65 TND', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop', tag: 'Bestseller' },
    { name: 'IXORA Night Cream', price: '55 TND', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop', tag: '' },
    { name: 'IXORA Sunscreen SPF 50', price: '40 TND', image: 'https://images.unsplash.com/photo-1556228720-192a6af4e180?q=80&w=600&auto=format&fit=crop', tag: 'Sale' },
    { name: 'IXORA Vitamin C', price: '70 TND', image: 'https://images.unsplash.com/photo-1601049541289-9b1b7ce82fc3?q=80&w=600&auto=format&fit=crop', tag: 'Hot' },
    { name: 'IXORA Eye Contour', price: '50 TND', image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=600&auto=format&fit=crop', tag: '' }
  ];

  categories = [
    { name: 'Cleansers', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop' },
    { name: 'Serums', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop' },
    { name: 'Moisturizers', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=400&auto=format&fit=crop' },
    { name: 'Sun Care', image: 'https://images.unsplash.com/photo-1556228720-192a6af4e180?q=80&w=400&auto=format&fit=crop' },
    { name: 'Body Care', image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=400&auto=format&fit=crop' },
    { name: 'Sets', image: 'https://images.unsplash.com/photo-1571781926291-c477eb31f24e?q=80&w=400&auto=format&fit=crop' }
  ];

  testimonials = [
    { quote: "IXORA completely transformed my skincare routine. The hydration is unmatched.", author: "Amina F." },
    { quote: "I love that it's 100% local but feels like a premium international brand.", author: "Youssef T." },
    { quote: "The best serum I've used. My skin has never looked more glowing.", author: "Sonia M." }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 100);
    }
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;

          const lineInners = el.querySelectorAll('.line-reveal-inner');
          if (lineInners.length > 0) {
            // Line by line reveal animation
            gsap.to(lineInners, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out",
              delay: Number(el.getAttribute('data-delay') || 0)
            });
            // Ensure the container is visible if it had initial hiding
            gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1 });
          } else {
            // Standard block reveal
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
      observer.observe(elRef.nativeElement);
    });
  }

  getStarted() {
    this.router.navigate(['/auth/login']);
  }
}
