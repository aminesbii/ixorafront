import { Component, Input, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-promo-split',
  templateUrl: './promo-split.component.html',
  styleUrls: ['./promo-split.component.css'],
  standalone: false
})
export class PromoSplitComponent implements AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  @Input() tag = '';
  @Input() title = '';
  @Input() description = '';
  @Input() buttonText = '';
  @Input() imageUrl = '';
  @Input() imageAlt = '';
  @Input() accentColor: 'green' | 'blue' = 'green';
  @Input() imageSide: 'left' | 'right' = 'right';

  get accentVar(): string {
    return this.accentColor === 'green'
      ? 'var(--color-ixora-green)'
      : 'var(--color-ixora-blue)';
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 500);
    }
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          gsap.to(el, {
            opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
            delay: Number(el.getAttribute('data-delay') || 0)
          });
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    this.revealElements.forEach(elRef => {
      if (elRef.nativeElement) observer.observe(elRef.nativeElement);
    });
  }
}
