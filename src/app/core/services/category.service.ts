import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryTree } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly API_URL = '/api/categories';

  constructor(private http: HttpClient) { }

  // Public methods
  list(params?: { is_active?: boolean; parent_id?: string | null }): Observable<Category[]> {
    return this.http.get<Category[]>(this.API_URL, { params: params as any });
  }

  tree(): Observable<CategoryTree[]> {
    return this.http.get<CategoryTree[]>(`${this.API_URL}/tree`);
  }

  getBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.API_URL}/slug/${slug}`);
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.API_URL}/${id}`);
  }

  // Admin methods — use FormData so we can attach an image file
  create(data: Partial<Category>, imageFile?: File): Observable<Category> {
    const fd = this.buildFormData(data, imageFile);
    return this.http.post<Category>(this.API_URL, fd);
  }

  update(id: string, data: Partial<Category>, imageFile?: File): Observable<Category> {
    const fd = this.buildFormData(data, imageFile);
    return this.http.put<Category>(`${this.API_URL}/${id}`, fd);
  }

  uploadImage(id: string, file: File): Observable<Category> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<Category>(`${this.API_URL}/${id}/image`, fd);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private buildFormData(data: Partial<Category>, imageFile?: File): FormData {
    const fd = new FormData();
    if (data.name !== undefined) fd.append('name', data.name);
    if (data.slug !== undefined) fd.append('slug', data.slug);
    if (data.parent_id !== undefined) fd.append('parent_id', data.parent_id ?? '');
    if (data.sort_order !== undefined) fd.append('sort_order', String(data.sort_order));
    if (data.is_active !== undefined) fd.append('is_active', String(data.is_active));
    if (imageFile) fd.append('image', imageFile);
    return fd;
  }
}
