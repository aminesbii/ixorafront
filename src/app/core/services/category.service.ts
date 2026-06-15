import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryTree } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly API_URL = '/api/categories';

  constructor(private http: HttpClient) {}

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

  // Admin methods
  create(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.API_URL, category);
  }

  update(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.API_URL}/${id}`, category);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }
}
