import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: 'img',
  standalone: false
})
export class ParallaxDirective implements AfterViewInit, OnDestroy {
  @Input() parallaxSpeed = 35;

  private el: HTMLElement;
  private parent: HTMLElement | null = null;
  private isBrowser: boolean;
  private ticking = false;

  constructor(
    private ref: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.el = this.ref.nativeElement;
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    if (this.el.hasAttribute('noParallax')) return;

    this.parent = this.el.parentElement;
    if (this.parent) {
      const style = getComputedStyle(this.parent);
      if (style.overflow !== 'hidden' && style.overflow !== 'clip') {
        this.parent.style.overflow = 'hidden';
      }
    }

    this.el.style.willChange = 'transform';
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private update = () => {
    this.ticking = false;
    if (!this.parent) return;

    const rect = this.parent.getBoundingClientRect();
    const winH = window.innerHeight;

    const totalTravel = winH + rect.height;
    const entered = winH - rect.top;
    let progress = entered / totalTravel;
    progress = Math.max(0, Math.min(1, progress));

    const maxT = this.parallaxSpeed;
    const translateY = (0.5 - progress) * maxT * 2;

    const parentH = rect.height || 1;
    const safeScale = 1 + (maxT / (parentH / 2)) + 0.02;
    const scale = Math.min(safeScale, 1.15);
    const roundedScale = Math.round(scale * 100) / 100;

    this.el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${roundedScale})`;
  };

  private onScroll = () => {
    if (!this.ticking) {
      requestAnimationFrame(this.update);
      this.ticking = true;
    }
  };
}
