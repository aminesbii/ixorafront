import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import gsap from 'gsap';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Product, ProductImage, ProductVariant } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  standalone: false
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef>;

  product: Product | null = null;
  loading = true;
  selectedImage: string | null = null;
  quantity = 1;
  cartFeedback = '';
  brokenImages = new Set<string>();
  selectedVariant: ProductVariant | null = null;


  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private dashboardService: DashboardService,
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadProduct(slug);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScrollAnimations(), 800);
    }
  }

  loadProduct(slug: string) {
    this.productService.getBySlug(slug).subscribe({
      next: (res: any) => {
        this.product = res.product || res;
        this.selectedImage = this.mainImage?.image_url || null;
        this.selectedVariant = null;
        this.loading = false;
        this.setSEOTags(this.product);
        this.trackProductView();
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 200);
        }
      },
      error: (err) => {
        console.error('Failed to load product from API:', err);
        this.loading = false;
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 200);
        }
      }
    });
  }

  private setSEOTags(product: Product | null): void {
    if (!product) return;
    const name = product.name;
    const description = product.short_description || '';
    const image = this.mainImage ? this.normalizeUrl(this.mainImage.image_url) : '';
    const url = `https://ixora.tn/products/${product.slug}`;

    this.title.setTitle(`${name} | IXORA`);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: `${name}, ixora, dermocosmetics, skincare` });
    this.meta.updateTag({ property: 'og:title', content: name });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:site_name', content: 'IXORA' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: name });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    if (product.base_price != null) {
      this.meta.updateTag({ property: 'product:price:amount', content: String(product.base_price) });
      this.meta.updateTag({ property: 'product:price:currency', content: product.currency || 'TND' });
    }
  }

  trackProductView() {
    const prodId = this.product ? (this.product._id || this.product.id) : undefined;
    if (!prodId) {
      return;
    }

    this.dashboardService.trackEvent({
      product_id: prodId,
      event_type: 'view'
    }).subscribe({
      error: (err) => console.error('Failed to track view:', err)
    });
  }

  normalizeUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return url;
  }

  imageError(img: ProductImage): void {
    const id = img._id || img.id || '';
    if (id) this.brokenImages.add(id);
  }

  showImage(img: ProductImage): boolean {
    const id = img._id || img.id || '';
    return !!this.normalizeUrl(img.image_url) && !this.brokenImages.has(id);
  }

  get mainImage(): ProductImage | undefined {
    return this.product?.images?.find(i => i.featured1) || this.product?.images?.find(i => i.is_main) || this.product?.images?.[0];
  }

  get mainImageUrl(): string {
    if (this.selectedVariant?.image_url) {
      return this.normalizeUrl(this.selectedVariant.image_url);
    }
    return this.mainImage ? this.normalizeUrl(this.mainImage.image_url) : '';
  }

  get secondImage(): ProductImage | undefined {
    return this.product?.images?.find(i => i.featured2) || this.product?.images?.find((i, idx, arr) => i !== this.mainImage && arr.indexOf(i) === idx) || this.product?.images?.[0];
  }

  get secondImageUrl(): string {
    return this.secondImage ? this.normalizeUrl(this.secondImage.image_url) : '';
  }

  get galleryImages(): ProductImage[] {
    const featuredIds = new Set<string>();
    const m = this.mainImage;
    const s = this.secondImage;
    const mId = m?._id || m?.id;
    const sId = s?._id || s?.id;
    if (mId) featuredIds.add(mId);
    if (sId) featuredIds.add(sId);
    return this.product?.images?.filter(i => !featuredIds.has(i._id || i.id || '')) || [];
  }

  get displayVariants(): ProductVariant[] {
    if (!this.product) return [];
    if (!this.product.variants || this.product.variants.length === 0) return [];

    // Create a fallback variant representing the base product!
    const baseVariant: ProductVariant = {
      id: 'base',
      _id: 'base',
      product_id: this.product.id || this.product._id,
      sku: this.product.slug,
      variant_name: 'Original',
      price: this.product.base_price || 0,
      currency: this.product.currency || 'TND',
      stock_qty: 99,
      is_active: true,
      image_url: this.mainImage?.image_url
    };

    return [baseVariant, ...this.product.variants];
  }

  get compositionList(): string[] {
    return this.product?.details?.composition || [];
  }

  get usage(): string {
    return this.product?.details?.usage || '';
  }

  private get priceData(): { price: number; currency: string } | null {
    if (this.selectedVariant) return { price: this.selectedVariant.price, currency: this.selectedVariant.currency };
    if (this.product?.base_price != null) return { price: this.product.base_price, currency: this.product.currency ?? 'TND' };
    return null;
  }

  get hasSale(): boolean {
    if (!this.product?.on_sale || !this.product?.sale_percentage || this.product.sale_percentage <= 0) return false;
    if (this.product.sale_end_date) {
      return this.saleDaysLeft !== null;
    }
    return true;
  }

  get saleDaysLeft(): number | null {
    if (!this.product?.sale_end_date) return null;
    const now = new Date();
    const end = new Date(this.product.sale_end_date);
    if (isNaN(end.getTime())) return null;
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }

  get salePrice(): number | null {
    const pd = this.priceData;
    if (!pd || !this.hasSale) return null;
    return Math.round(pd.price * (1 - this.product!.sale_percentage! / 100) * 100) / 100;
  }

  get price(): string {
    const pd = this.priceData;
    if (!pd) return '';
    if (this.hasSale && this.salePrice !== null) {
      return `${this.salePrice} ${pd.currency}`;
    }
    return `${pd.price} ${pd.currency}`;
  }

  get originalPrice(): string {
    const pd = this.priceData;
    return pd && this.hasSale ? `${pd.price} ${pd.currency}` : '';
  }

  get comparePrice(): number | null {
    return this.selectedVariant?.compare_at_price || this.product?.variants?.[0]?.compare_at_price || null;
  }

  variantSalePrice(v: ProductVariant): number | null {
    if (!this.hasSale) return null;
    return Math.round(v.price * (1 - this.product!.sale_percentage! / 100) * 100) / 100;
  }

  selectImage(img: ProductImage) {
    this.selectedImage = this.normalizeUrl(img.image_url);
  }

  increaseQty() {
    let stock = (this.product as any)?.stock_qty ?? 99;
    if (this.selectedVariant && this.selectedVariant.id !== 'base' && this.selectedVariant._id !== 'base') {
      stock = this.selectedVariant.stock_qty;
    }
    if (this.quantity < stock) this.quantity++;
  }

  get outOfStock(): boolean {
    let stock = (this.product as any)?.stock_qty ?? 99;
    if (this.selectedVariant && this.selectedVariant.id !== 'base' && this.selectedVariant._id !== 'base') {
      stock = this.selectedVariant.stock_qty;
    }
    return stock <= 0;
  }

  isVariantSelected(v: ProductVariant): boolean {
    if (!this.selectedVariant && v.id === 'base') return true;
    if (this.selectedVariant) {
      if (v._id && this.selectedVariant._id === v._id) return true;
      if (v.id && this.selectedVariant.id === v.id) return true;
      if (v.id && this.selectedVariant._id === v.id) return true;
      if (v._id && this.selectedVariant.id === v._id) return true;
    }
    return false;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant = v;
    this.quantity = 1;
  }

  addToCart() {
    if (!this.product) return;

    const prodId = this.product._id || this.product.id;
    if (!prodId) return;

    this.dashboardService.trackEvent({
      product_id: prodId,
      event_type: 'add_to_cart'
    }).subscribe({
      error: (err) => console.error('Failed to track add_to_cart:', err)
    });

    // Determine the ID. If selectedVariant is 'base', treat it as no variant.
    let variantId = null;
    if (this.selectedVariant && this.selectedVariant.id !== 'base' && this.selectedVariant._id !== 'base') {
      variantId = this.selectedVariant._id || this.selectedVariant.id || null;
    }

    this.cartService.addItem(prodId, variantId, this.quantity).subscribe({
      next: () => this.showFeedback(`${this.product!.name} added to cart!`),
      error: (err) => this.showFeedback(err.error?.message || 'Failed to add to cart')
    });
  }

  showFeedback(msg: string) {
    this.cartFeedback = msg;
    setTimeout(() => (this.cartFeedback = ''), 3000);
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
