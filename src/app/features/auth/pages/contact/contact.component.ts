import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: false
})
export class ContactComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  name = '';
  email = '';
  subject = '';
  message = '';
  isLoading = false;
  submitted = false;
  errorMessage = '';

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

  onSubmit(): void {
    if (this.isLoading) return;
    this.errorMessage = '';
    if (!this.name || !this.email || !this.message) {
      this.errorMessage = 'Name, email, and message are required.';
      return;
    }
    this.isLoading = true;
    // Simulate sending
    setTimeout(() => {
      this.isLoading = false;
      this.submitted = true;
      this.name = '';
      this.email = '';
      this.subject = '';
      this.message = '';
    }, 1500);
  }
}
