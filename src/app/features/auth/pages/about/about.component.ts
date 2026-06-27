import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  standalone: false
})
export class AboutComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  stats = [
    { value: '5K+', label: 'Happy Customers' },
    { value: '50+', label: 'Premium Ingredients' },
    { value: '12+', label: 'Years of Expertise' },
    { value: '3', label: 'Countries Served' }
  ];

  values = [
    {
      title: 'Clean Science',
      desc: 'Every formula is backed by dermatological research. We use proven active ingredients at optimal concentrations for real, visible results.'
    },
    {
      title: 'Tunisian Heritage',
      desc: 'Rooted in the Mediterranean, we harness local botanicals and traditional knowledge blended with modern cosmetic science.'
    },
    {
      title: 'Sustainability',
      desc: 'From eco-friendly packaging to responsible sourcing, we minimize our environmental footprint at every step.'
    },
    {
      title: 'Inclusive Care',
      desc: 'Skincare is not one-size-fits-all. Our products are designed for all skin types, tones, and concerns.'
    }
  ];

  team = [
    { name: 'Dr. Nadia Belhaj', role: 'Founder & Formulator', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
    { name: 'Ahmed Karray', role: 'Chief Scientist', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
    { name: 'Salma Mejri', role: 'Creative Director', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80' },
    { name: 'Yassine Trabelsi', role: 'Operations Lead', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

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
