import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductImage, ProductVariant } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = '/api/products';

  constructor(private http: HttpClient) {}

  // ─── Products (Public & Admin) ──────────────────────────────────────────────
  list(queryParams?: {
    category_id?: string;
    brand_name?: string;
    status?: 'draft' | 'active' | 'archived';
    is_featured?: boolean;
    search?: string;
    limit?: number;
    skip?: number;
    page?: number;
    sort?: string;
  }): Observable<{ products: Product[]; pagination: any }> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const val = (queryParams as any)[key];
        if (val !== undefined && val !== null) {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<{ products: Product[]; pagination: any }>(this.API_URL, { params });
  }

  getBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/slug/${slug}`);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.API_URL, product);
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, product);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }

  // ─── Product Images (Nested) ────────────────────────────────────────────────
  listImages(productId: string): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.API_URL}/${productId}/images`);
  }

  addImage(productId: string, imageFile: File, altText?: string, sortOrder?: number): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (altText) formData.append('alt_text', altText);
    if (sortOrder !== undefined) formData.append('sort_order', sortOrder.toString());

    return this.http.post<ProductImage>(`${this.API_URL}/${productId}/images`, formData);
  }

  updateImage(productId: string, imageId: string, data: { alt_text?: string; sort_order?: number }): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.API_URL}/${productId}/images/${imageId}`, data);
  }

  deleteImage(productId: string, imageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${productId}/images/${imageId}`);
  }

  setMainImage(productId: string, imageId: string): Observable<ProductImage> {
    return this.http.patch<ProductImage>(`${this.API_URL}/${productId}/images/${imageId}/main`, {});
  }

  uploadFeatured1(productId: string, imageFile: File): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<ProductImage>(`${this.API_URL}/${productId}/images/featured1`, formData);
  }

  uploadFeatured2(productId: string, imageFile: File): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<ProductImage>(`${this.API_URL}/${productId}/images/featured2`, formData);
  }

  // ─── Product Variants (Nested) ──────────────────────────────────────────────
  listVariants(productId: string): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(`${this.API_URL}/${productId}/variants`);
  }

  addVariant(productId: string, variant: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.API_URL}/${productId}/variants`, variant);
  }

  updateVariant(productId: string, variantId: string, variant: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.API_URL}/${productId}/variants/${variantId}`, variant);
  }

  deleteVariant(productId: string, variantId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${productId}/variants/${variantId}`);
  }

  adjustStock(productId: string, variantId: string, quantityAdjustment: number): Observable<ProductVariant> {
    return this.http.patch<ProductVariant>(`${this.API_URL}/${productId}/variants/${variantId}/stock`, {
      delta: quantityAdjustment
    });
  }
}
