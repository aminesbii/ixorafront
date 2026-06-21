import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  standalone: false
})
export class HeroComponent implements AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initScrollAnimations();
        this.animateHeroLoad();
      }, 300);
    }
  }

  private animateHeroLoad(): void {
    const line = document.getElementById('hero-green-line');
    const badge = document.querySelector('.hero-badge') as HTMLElement | null;
    const floatingCard = document.querySelector('.floating-card') as HTMLElement | null;

    if (!line && !badge && !floatingCard) {
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (line) {
      tl.fromTo(
        line,
        { width: 0, opacity: 0 },
        { width: '300px', opacity: 1, duration: 0.9 },
        0
      );
    }

    if (badge) {
      tl.fromTo(
        badge,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.15
      );
    }

    if (floatingCard) {
      tl.fromTo(
        floatingCard,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.3
      );
    }
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
