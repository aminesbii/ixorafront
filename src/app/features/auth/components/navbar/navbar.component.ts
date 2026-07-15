import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryTree } from '../../../../core/models/category.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: false
})
export class NavbarComponent implements OnInit, AfterViewInit {
  isScrolled = false;
  isMobileMenuOpen = false;
  isOnHero = false;
  isOnHomePage = false;
  isLoggedIn = false;
  isAdmin = false;
  userName = '';
  cartTotalItems = 0;
  isProfileDropdownOpen = false;
  categories: CategoryTree[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn = this.authService.isLoggedIn();
      const user = this.authService.getCurrentUser();
      if (user) {
        this.isAdmin = this.authService.isAdmin();
        this.userName = user.full_name;
      }
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.isOnHomePage = this.router.url === '/';
          this.updateHeroState();
        });

      this.cartService.cart$.subscribe(cart => {
        this.cartTotalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      });
      this.cartService.getCart().subscribe();

      this.categoryService.tree().subscribe({
        next: (cats) => { this.categories = cats; },
        error: () => { this.categories = []; }
      });

      this.isOnHomePage = this.router.url === '/';
      this.updateHeroState();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn = this.authService.isLoggedIn();
      const user = this.authService.getCurrentUser();
      if (user) {
        this.isAdmin = this.authService.isAdmin();
        this.userName = user.full_name;
      }
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
    this.updateHeroState();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateHeroState();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.isProfileDropdownOpen && !target.closest('.profile-dropdown-wrapper')) {
      this.isProfileDropdownOpen = false;
    }
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  closeProfileDropdown(): void {
    this.isProfileDropdownOpen = false;
  }

  private updateHeroState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const hero = document.getElementById('home-hero');

    if (!this.isOnHomePage || !hero) {
      this.isOnHero = false;
      return;
    }

    const heroHeight = hero.offsetHeight;
    this.isOnHero = window.scrollY < heroHeight - 80;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.userName = '';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (isPlatformBrowser(this.platformId)) {
      if (this.isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }
}
