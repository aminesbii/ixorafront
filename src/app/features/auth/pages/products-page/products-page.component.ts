import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { Product } from '../../../../core/models/product.model';
import { FilterState } from '../../components/sidebar-filter/sidebar-filter.component';
import { ProductCardEvent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css'],
  standalone: false
})
export class ProductsPageComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error = '';
  mobileFilterOpen = false;
  sidebarVisible = true;
  productsFade = false;
  private animTimeout: any;

  currentFilters: FilterState = {
    category_id: null,
    sort: '-createdAt',
  };
  searchQuery = '';
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  cartFeedback = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  onSaleFilter = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = 1;
      const categoryId = params['category'];
      this.currentFilters.category_id = categoryId || null;
      this.onSaleFilter = params['on_sale'] === 'true';
      this.searchQuery = params['search'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      status: 'active',
      page: this.currentPage,
      limit: 12,
      sort: this.currentFilters.sort
    };

    if (this.currentFilters.category_id) {
      params.category_id = this.currentFilters.category_id;
    }
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }
    if (this.onSaleFilter) {
      params.on_sale = true;
    }
    this.productService.list(params).subscribe({
      next: (res) => {
        this.products = res.products;
        this.totalPages = res.pagination.pages;
        this.totalProducts = res.pagination.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadProducts();
  }

  onFilterChange(filters: FilterState): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onAddToCart(event: ProductCardEvent): void {
    const prodId = event.product._id || event.product.id;
    if (!prodId) return;

    this.cartService.addItem(prodId, event.variantId, 1).subscribe({
      next: () => this.showCartFeedback(`${event.product.name} added to cart!`),
      error: () => this.showCartFeedback('Failed to add to cart')
    });
  }

  showCartFeedback(msg: string): void {
    this.cartFeedback = msg;
    setTimeout(() => this.cartFeedback = '', 3000);
  }

  onViewProduct(slug: string): void {
    this.router.navigate(['/products', slug]);
  }

  toggleMobileFilter(): void {
    this.mobileFilterOpen = !this.mobileFilterOpen;
  }

  onHideSidebar(): void {
    this.sidebarVisible = false;
    this.triggerFade();
  }

  onShowSidebar(): void {
    this.sidebarVisible = true;
    this.triggerFade();
  }

  private triggerFade(): void {
    this.productsFade = true;
    clearTimeout(this.animTimeout);
    this.animTimeout = setTimeout(() => this.productsFade = false, 300);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * 12 + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * 12, this.totalProducts);
  }
}
