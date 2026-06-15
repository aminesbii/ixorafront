import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = '/api/users';

  constructor(private http: HttpClient) { }

  // Self Operations
  updateProfile(data: { full_name?: string; phone?: string }): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, data);
  }

  // Admin User Management Operations
  list(queryParams?: { page?: number; limit?: number; search?: string; role?: string; status?: string }): Observable<PaginatedUsers> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const val = (queryParams as any)[key];
        if (val !== undefined && val !== null) {
          params = params.set(key, val.toString());
        }
      });
    }
    return this.http.get<PaginatedUsers>(this.API_URL, { params });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  update(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, data);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }
}
