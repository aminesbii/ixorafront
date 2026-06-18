import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Product, ProductImage } from '../../../../core/models/product.model';

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

  private fallbackProducts: Record<string, Product> = {
    'rose-radiance-cream': {
      _id: 'demo-3',
      name: 'Rose Radiance Cream',
      slug: 'rose-radiance-cream',
      brand_name: 'IXORA',
      short_description: 'Luxurious rose-infused moisturizer for glowing skin. Enriched with Damascus rose extract and shea butter for deep nourishment.',
      description: 'Experience the ultimate hydration with our Rose Radiance Cream. Formulated with the finest Damascus rose extract, this luxurious moisturizer delivers intense nourishment while restoring your skin\'s natural glow. The lightweight, non-greasy formula absorbs quickly, leaving your skin feeling silky smooth and rejuvenated.',
      status: 'active',
      is_featured: true,
      details: {
        indication: 'Suitable for all skin types, especially dry and mature skin. Ideal for daily use both morning and night.',
        composition: ['Damascus Rose Extract', 'Shea Butter', 'Squalane', 'Vitamin E', 'Hyaluronic Acid', 'Glycerin', 'Niacinamide', 'Panthenol'],
        usage: 'Apply a generous amount to cleansed face and neck each morning and evening. Gently massage in upward circular motions until fully absorbed. For best results, use after serum and before sunscreen.'
      },
      images: [
        { _id: 'dimg-1', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80', alt_text: 'Rose Radiance Cream front view', sort_order: 0, is_main: true },
        { _id: 'dimg-2', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80', alt_text: 'Rose Radiance Cream application', sort_order: 1, is_main: false },
        { _id: 'dimg-3', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b11?w=800&q=80', alt_text: 'Rose ingredients', sort_order: 2, is_main: false },
        { _id: 'dimg-4', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', alt_text: 'Skincare routine', sort_order: 3, is_main: false },
        { _id: 'dimg-5', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', alt_text: 'Product texture', sort_order: 4, is_main: false },
        { _id: 'dimg-6', product_id: 'demo-3', image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', alt_text: 'Rose petals', sort_order: 5, is_main: false }
      ],
      variants: [
        { _id: 'dvar-3', product_id: 'demo-3', sku: 'ROSE-CREAM-50', variant_name: '50ml', price: 54, currency: 'MAD', stock_qty: 25, is_active: true },
      ]
    },
    'pure-green-tea-serum': {
      _id: 'demo-1',
      name: 'Pure Green Tea Serum',
      slug: 'pure-green-tea-serum',
      brand_name: 'IXORA',
      short_description: 'Calming green tea extract serum for balanced skin. Packed with antioxidants to soothe and protect.',
      description: 'A lightweight, fast-absorbing serum powered by concentrated green tea polyphenols. Designed to calm irritation, reduce redness, and provide powerful antioxidant protection against environmental stressors.',
      status: 'active',
      is_featured: true,
      details: {
        indication: 'Ideal for sensitive, acne-prone, or combination skin. Use daily for best results.',
        composition: ['Green Tea Extract (EGCG)', 'Niacinamide', 'Zinc PCA', 'Aloe Vera', 'Hyaluronic Acid', 'Centella Asiatica'],
        usage: 'Apply 3-4 drops to cleansed skin each morning and evening. Gently pat into face and neck. Follow with moisturizer and sunscreen during the day.'
      },
      images: [
        { _id: 'dimg-7', product_id: 'demo-1', image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', alt_text: 'Green Tea Serum bottle', sort_order: 0, is_main: true },
        { _id: 'dimg-8', product_id: 'demo-1', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', alt_text: 'Serum application', sort_order: 1, is_main: false },
        { _id: 'dimg-9', product_id: 'demo-1', image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b11?w=800&q=80', alt_text: 'Green tea leaves', sort_order: 2, is_main: false },
        { _id: 'dimg-10', product_id: 'demo-1', image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80', alt_text: 'Skincare set', sort_order: 3, is_main: false }
      ],
      variants: [
        { _id: 'dvar-1', product_id: 'demo-1', sku: 'GTS-30', variant_name: '30ml', price: 49, currency: 'MAD', stock_qty: 50, is_active: true },
      ]
    },
    'deep-blue-hydration': {
      _id: 'demo-2',
      name: 'Deep Blue Hydration',
      slug: 'deep-blue-hydration',
      brand_name: 'IXORA',
      short_description: '48-hour moisture with hyaluronic acid & marine botanicals. Intense hydration for plump, radiant skin.',
      description: 'Dive into 48-hour moisture with our advanced hyaluronic acid and marine botanical complex. This deeply hydrating formula plumps fine lines, restores the skin barrier, and delivers a luminous, dewy finish.',
      status: 'active',
      is_featured: true,
      details: {
        indication: 'Perfect for dehydrated, dull, or aging skin. Excellent for use in dry or cold climates.',
        composition: ['Multi-Molecular Hyaluronic Acid', 'Seaweed Extract', 'Marine Collagen', 'Glycerin', 'Ceramides', 'Vitamin B5'],
        usage: 'Apply to damp skin after cleansing. Press gently into skin with palms. Layer under moisturizer for added hydration. Use morning and night.'
      },
      images: [
        { _id: 'dimg-11', product_id: 'demo-2', image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80', alt_text: 'Deep Blue bottle', sort_order: 0, is_main: true },
        { _id: 'dimg-12', product_id: 'demo-2', image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80', alt_text: 'Ocean inspired skincare', sort_order: 1, is_main: false },
        { _id: 'dimg-13', product_id: 'demo-2', image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b11?w=800&q=80', alt_text: 'Blue serum drops', sort_order: 2, is_main: false }
      ],
      variants: [
        { _id: 'dvar-2', product_id: 'demo-2', sku: 'DBH-50', variant_name: '50ml', price: 59, currency: 'MAD', stock_qty: 35, is_active: true },
      ]
    },
    'vitamin-c-brightening': {
      _id: 'demo-4',
      name: 'Vitamin C Brightening',
      slug: 'vitamin-c-brightening',
      brand_name: 'IXORA',
      short_description: 'Brightening serum with stabilized vitamin C for a luminous, even-toned complexion.',
      description: 'Unlock your skin\'s natural radiance with our stabilized Vitamin C serum. Formulated with 15% L-Ascorbic Acid and Ferulic Acid, this potent antioxidant blend brightens dark spots, evens skin tone, and protects against free radical damage.',
      status: 'active',
      is_featured: true,
      details: {
        indication: 'Excellent for hyperpigmentation, sun damage, and uneven skin tone. Use in your morning routine.',
        composition: ['15% L-Ascorbic Acid (Vitamin C)', 'Ferulic Acid', 'Vitamin E', 'Hyaluronic Acid', 'Witch Hazel', 'Aloe Vera'],
        usage: 'Apply 4-5 drops to dry, cleansed skin each morning. Avoid the eye area. Follow with moisturizer and broad-spectrum sunscreen. Do not mix with niacinamide or retinol in the same routine.'
      },
      images: [
        { _id: 'dimg-14', product_id: 'demo-4', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', alt_text: 'Vitamin C serum bottle', sort_order: 0, is_main: true },
        { _id: 'dimg-15', product_id: 'demo-4', image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', alt_text: 'Citrus ingredients', sort_order: 1, is_main: false },
        { _id: 'dimg-16', product_id: 'demo-4', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', alt_text: 'Brightening skincare', sort_order: 2, is_main: false },
        { _id: 'dimg-17', product_id: 'demo-4', image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b11?w=800&q=80', alt_text: 'Orange serum', sort_order: 3, is_main: false },
        { _id: 'dimg-18', product_id: 'demo-4', image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80', alt_text: 'Product lineup', sort_order: 4, is_main: false }
      ],
      variants: [
        { _id: 'dvar-4', product_id: 'demo-4', sku: 'VCB-30', variant_name: '30ml', price: 45, currency: 'MAD', stock_qty: 40, is_active: true },
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
        this.loading = false;
        this.trackProductView();
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 200);
        }
      },
      error: (err) => {
        console.error('Failed to load product from API, using fallback:', err);
        const fallback = this.fallbackProducts[slug];
        if (fallback) {
          this.product = fallback;
          this.selectedImage = this.mainImage?.image_url || null;
        }
        this.loading = false;
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initScrollAnimations(), 200);
        }
      }
    });
  }

  trackProductView() {
    if (!this.product || !this.product._id || this.product._id.startsWith('demo-')) {
      return;
    }

    this.dashboardService.trackEvent({
      product_id: this.product._id,
      event_type: 'view'
    }).subscribe({
      error: (err) => console.error('Failed to track view:', err)
    });
  }

  get mainImage(): ProductImage | undefined {
    return this.product?.images?.find(img => img.is_main) || this.product?.images?.[0];
  }

  get secondImage(): ProductImage | undefined {
    const imgs = this.product?.images || [];
    if (imgs.length > 1) {
      return this.mainImage === imgs[0] ? imgs[1] : imgs[0];
    }
    return undefined;
  }

  get galleryImages(): ProductImage[] {
    return this.product?.images?.slice(2, 10) || [];
  }

  get compositionList(): string[] {
    return this.product?.details?.composition || [];
  }

  get usage(): string {
    return this.product?.details?.usage || '';
  }

  get price(): string {
    const v = this.product?.variants?.[0];
    return v ? `${v.price} ${v.currency}` : '';
  }

  get comparePrice(): number | null {
    return this.product?.variants?.[0]?.compare_at_price || null;
  }

  selectImage(img: ProductImage) {
    this.selectedImage = img.image_url;
  }

  increaseQty() {
    const stock = this.product?.variants?.[0]?.stock_qty || 99;
    if (this.quantity < stock) this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (!this.product) return;
    const variant = this.product.variants?.[0];
    if (!variant) {
      this.showFeedback('No variant available');
      return;
    }
    this.cartService.addItem(this.product._id, variant._id!, this.quantity).subscribe({
      next: () => this.showFeedback(`${this.product!.name} added to cart!`),
      error: () => this.showFeedback('Failed to add to cart')
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
