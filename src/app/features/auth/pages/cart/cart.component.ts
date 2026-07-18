import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { OrderService, CheckoutPayload } from '../../../../core/services/order.service';
import { ColissimoService, Governorate } from '../../../../core/services/colissimo.service';
import { AddressService } from '../../../../core/services/address.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Cart, CartItem } from '../../../../core/models/cart.model';
import { Product } from '../../../../core/models/product.model';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  @ViewChild('orderSuccessModal') orderSuccessModal!: ElementRef<HTMLDialogElement>;
  cart: Cart | null = null;
  loading = true;
  private productsMap = new Map<string, Product>();

  showOrderForm = false;
  isPlacingOrder = false;
  orderError = '';

  showOrderSuccess = false;
  placedOrderNumber = '';
  placedOrderCurrency = '';
  placedOrderTotal = 0;
  placedDate = '';
  placedOrderItems: { name: string; qty: number; unitPrice: number; price: number }[] = [];
  copied = false;

  customerName = '';
  customerEmail = '';
  customerPhone = '';
  nameError = '';
  phoneError = '';
  streetError = '';
  cityError = '';
  gouvernoratError = '';
  zipError = '';
  countryError = '';

  addressStreet = '';
  addressCity = '';
  addressGouvernorat = '';
  addressPostalCode = '';
  addressCountry = 'Tunisia';

  governorates: Governorate[] = [];
  availableCities: string[] = [];

  deliveryNbPieces = 1;
  deliveryDesignation = '';
  deliveryCommentaire = '';
  deliveryType = 'VO';

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService,
    private colissimoService: ColissimoService,
    private addressService: AddressService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.loading = false;
      if (cart?.items) {
        this.enrichCartItems(cart.items);
      }
    });
    this.cartService.getCart().subscribe({
      error: () => this.loading = false
    });
  }

  private enrichCartItems(items: CartItem[]): void {
    const idsNeedingFetch = items
      .filter(item => typeof item.product_id === 'string')
      .map(item => item.product_id as string)
      .filter(id => !this.productsMap.has(id));

    const uniqueIds = [...new Set(idsNeedingFetch)];
    if (uniqueIds.length === 0) return;

    forkJoin(
      uniqueIds.map(id =>
        this.productService.getById(id).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe(products => {
      products.forEach((product, i) => {
        if (product) {
          this.productsMap.set(uniqueIds[i], product);
        }
      });
    });
  }

  private getProduct(item: CartItem): Product | null {
    if (typeof item.product_id === 'object' && item.product_id !== null) {
      return item.product_id as Product;
    }
    const id = item.product_id as string;
    return this.productsMap.get(id) ?? null;
  }

  get items(): CartItem[] {
    return this.cart?.items ?? [];
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }

  get shipping(): number {
    return this.subtotal > 0 ? 10 : 0;
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getProductImage(item: CartItem): string {
    // 1. Use the variant's image if the populated variant object has one
    const variant = (item as any).variant;
    if (variant?.image_url) {
      return this.normalizeUrl(variant.image_url);
    }
    // 2. Fall back to the product's main image
    const product = this.getProduct(item);
    if (product?.images && product.images.length > 0) {
      const mainImg = product.images.find(img => img.is_main);
      return this.normalizeUrl(mainImg?.image_url || product.images[0].image_url);
    }
    return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop';
  }

  private normalizeUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return url;
  }

  getProductName(item: CartItem): string {
    const product = this.getProduct(item);
    return product?.name || 'Product';
  }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty <= 0) {
      this.removeItem(item._id || item.id);
      return;
    }
    const itemId = item._id || item.id;
    if (!itemId) return;
    this.cartService.updateItem(itemId, qty).subscribe();
  }

  removeItem(itemId: string | undefined): void {
    if (!itemId) return;
    this.cartService.removeItem(itemId).subscribe();
  }

  clearCart(): void {
    this.cartService.clear().subscribe();
  }

  // ─── Order Form ──────────────────────────────────────

  onGouvernoratChange(): void {
    const found = this.governorates.find(g => g.gouvernorat === this.addressGouvernorat);
    this.availableCities = found ? found.villes.filter(v => v !== '-') : [];
    if (this.availableCities.length > 0 && !this.availableCities.includes(this.addressCity)) {
      this.addressCity = '';
    }
  }

  openOrderForm(): void {
    const user = this.authService.getCurrentUser();

    this.colissimoService.getGovernorates().subscribe({
      next: (govs) => {
        this.governorates = govs;
      },
      error: () => {
        this.governorates = [];
      }
    });

    const items = this.items;
    this.deliveryDesignation = items.map(i => {
      const p = this.getProduct(i as any);
      return p?.name || 'Article';
    }).join(', ').substring(0, 200);

    if (user) {
      this.customerName = user.full_name || '';
      this.customerEmail = user.email || '';

      this.addressService.myAddresses().subscribe(addresses => {
        if (addresses.length > 0) {
          const addr = addresses[0];
          this.addressStreet = addr.street || '';
          this.addressCity = addr.city || '';
          this.addressGouvernorat = addr.gouvernorat || '';
          this.addressPostalCode = addr.postal_code || '';
          this.addressCountry = addr.country || 'Tunisia';
          this.customerPhone = addr.phone || '';
          if (this.addressGouvernorat) this.onGouvernoratChange();
        }
        this.showOrderForm = true;
      });
    } else {
      this.customerName = '';
      this.customerEmail = '';
      this.customerPhone = '';
      this.addressStreet = '';
      this.addressCity = '';
      this.addressGouvernorat = '';
      this.addressPostalCode = '';
      this.addressCountry = 'Tunisia';
      this.showOrderForm = true;
    }
  }

  closeOrderForm(): void {
    this.showOrderForm = false;
    this.orderError = '';
    this.nameError = '';
    this.phoneError = '';
    this.streetError = '';
    this.cityError = '';
    this.gouvernoratError = '';
    this.zipError = '';
    this.countryError = '';
  }


  closeOrderSuccess(): void {
    this.orderSuccessModal?.nativeElement.close();
    this.showOrderSuccess = false;
    this.placedOrderNumber = '';
    this.placedOrderCurrency = '';
    this.copied = false;
  }

  placeOrder(): void {
    this.orderError = '';
    this.nameError = '';
    this.phoneError = '';
    this.streetError = '';
    this.cityError = '';
    this.gouvernoratError = '';
    this.zipError = '';
    this.countryError = '';

    let hasError = false;

    if (!this.customerName) {
      this.nameError = 'Please enter your full name.';
      hasError = true;
    }
    if (!this.customerPhone) {
      this.phoneError = 'Please enter your phone number.';
      hasError = true;
    }
    if (!this.addressStreet) {
      this.streetError = 'Please enter your street address.';
      hasError = true;
    }
    if (!this.addressGouvernorat) {
      this.gouvernoratError = 'Please select your governorate.';
      hasError = true;
    }
    if (!this.addressCity) {
      this.cityError = 'Please select your city.';
      hasError = true;
    }
    if (!this.addressPostalCode) {
      this.zipError = 'Please enter your zip code.';
      hasError = true;
    }
    if (!this.addressCountry) {
      this.countryError = 'Please enter your country.';
      hasError = true;
    }

    if (hasError) return;

    const cartId = this.cart?._id || this.cart?.id;
    if (!cartId) {
      this.orderError = 'Cart not found.';
      return;
    }

    this.isPlacingOrder = true;

    const payload: CheckoutPayload = {
      cart_id: cartId,
      customer_name: this.customerName,
      customer_email: this.customerEmail,
      customer_phone: this.customerPhone || null,
      shipping_address: {
        type: 'shipping',
        full_name: this.customerName,
        phone: this.customerPhone || null,
        street: this.addressStreet,
        city: this.addressCity,
        gouvernorat: this.addressGouvernorat || null,
        postal_code: this.addressPostalCode || null,
        country: this.addressCountry
      },
      shipping_fee: this.shipping,
      currency: 'TND',
      colissimo_parcel: {
        nb_pieces: this.deliveryNbPieces || 1,
        type: this.deliveryType || 'VO',
        designation: this.deliveryDesignation || '',
        commentaire: this.deliveryCommentaire || ''
      }
    };

    this.orderService.checkout(payload).subscribe({
      next: (res) => {
        this.isPlacingOrder = false;
        this.showOrderForm = false;
        const data = res as any;
        const order = data.order || data;
        this.placedOrderNumber = order?.order_number || '';
        this.placedOrderCurrency = order?.currency || 'TND';
        this.placedOrderTotal = order?.grand_total || this.total;
        this.placedDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const orderItems = data.items || order?.items || [];
        this.placedOrderItems = orderItems.map((i: any) => ({
          name: i.product_name_snapshot || i.product_name || 'Product',
          qty: i.quantity || 0,
          unitPrice: i.unit_price_snapshot || 0,
          price: i.line_total || i.unit_price_snapshot * i.quantity || 0
        }));
        this.orderSuccessModal?.nativeElement.showModal();
        setTimeout(() => {
          confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.4 } });
          setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { x: 0.2, y: 0.5 } }), 200);
          setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { x: 0.8, y: 0.5 } }), 300);
        }, 300);
        this.cartService.getCart().subscribe();
        for (const item of this.items) {
          const pid = typeof item.product_id === 'string' ? item.product_id : (item.product_id as any)?._id;
          if (pid) {
            this.dashboardService.trackEvent({ product_id: pid, event_type: 'purchase' }).subscribe();
          }
        }
      },
      error: (err) => {
        this.isPlacingOrder = false;
        this.orderError = err?.error?.message || 'Failed to place order. Please try again.';
      }
    });
  }
}
