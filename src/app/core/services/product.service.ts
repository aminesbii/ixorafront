import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductImage, ProductVariant } from '../models/product.model';

export interface Suggestion {
  id: string;
  name: string;
  slug: string;
  base_price: number | null;
  images: { image_url: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = '/api/products';

  constructor(private http: HttpClient) { }

  // ─── Products (Public & Admin) ──────────────────────────────────────────────
  list(queryParams?: {
    category_id?: string;
    status?: 'draft' | 'active' | 'archived';
    is_deleted?: boolean;
    is_featured?: boolean;
    on_sale?: boolean;
    search?: string;
    limit?: number;
    skip?: number;
    page?: number;
    sort?: string;
    priceMin?: number;
    priceMax?: number;
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

  suggestions(q: string, limit = 5): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.API_URL}/suggestions`, {
      params: { q, limit: limit.toString() }
    });
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

  restore(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API_URL}/${id}/restore`, {});
  }

  hardDelete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}/hard`);
  }

  restoreMultiple(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/restore-multiple`, { ids });
  }

  softDeleteMultiple(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/soft-delete-multiple`, { ids });
  }

  hardDeleteMultiple(ids: string[]): Observable<{ message: string; deleted: string[]; failed: { id: string; message: string }[] }> {
    return this.http.post<{ message: string; deleted: string[]; failed: { id: string; message: string }[] }>(`${this.API_URL}/hard-delete-multiple`, { ids });
  }

  emptyBin(): Observable<{ message: string; deleted: string[]; failed: { id: string; message: string }[] }> {
    return this.http.post<{ message: string; deleted: string[]; failed: { id: string; message: string }[] }>(`${this.API_URL}/empty-bin`, {});
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

  uploadVariantImage(productId: string, variantId: string, imageFile: File): Observable<ProductVariant> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<ProductVariant>(`${this.API_URL}/${productId}/variants/${variantId}/image`, formData);
  }

  // ─── Category-specific product listing & reorder ──────────────────────────
  getByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/by-category/${categoryId}`);
  }

  reorderInCategory(categoryId: string, productIds: string[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/reorder-in-category`, {
      category_id: categoryId,
      product_ids: productIds,
    });
  }

  // ─── Bulk Category Assignment ───────────────────────────────────────────────
  bulkAssignCategory(productIds: string[], categoryId: string | null): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API_URL}/bulk-assign-category`, {
      product_ids: productIds,
      category_id: categoryId
    });
  }
}
