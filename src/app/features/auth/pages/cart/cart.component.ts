import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { Cart, CartItem } from '../../../../core/models/cart.model';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;
  private productsMap = new Map<string, Product>();

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

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
    const product = this.getProduct(item);
    if (product?.images && product.images.length > 0) {
      const mainImg = product.images.find(img => img.is_main);
      return mainImg?.image_url || product.images[0].image_url;
    }
    return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop';
  }

  getProductName(item: CartItem): string {
    const product = this.getProduct(item);
    return product?.name || 'Product';
  }

  removeItem(itemId: string | undefined): void {
    if (!itemId) return;
    this.cartService.removeItem(itemId).subscribe();
  }

  clearCart(): void {
    this.cartService.clear().subscribe();
  }
}
