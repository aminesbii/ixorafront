import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  showPromoBanner = false;
  private salesObserver: IntersectionObserver | null = null;

  testimonials = [
    { quote: "IXORA completely transformed my skincare routine. The hydration is unmatched.", author: "Amina F." },
    { quote: "I love that it's 100% local but feels like a premium international brand.", author: "Youssef T." },
    { quote: "The best serum I've used. My skin has never looked more glowing.", author: "Sonia M." }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 500);
      setTimeout(() => this.initPromoBanner(), 600);
    }
  }

  ngOnDestroy(): void {
    this.salesObserver?.disconnect();
  }

  scrollToSales(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('sales-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private initPromoBanner(): void {
    const salesSection = document.getElementById('sales-section');
    if (!salesSection) return;

    this.salesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.showPromoBanner = !entry.isIntersecting;
      });
    }, { threshold: 0.1 });

    this.salesObserver.observe(salesSection);
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
