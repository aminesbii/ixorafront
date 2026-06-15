import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly API_URL = '/api/addresses';

  constructor(private http: HttpClient) { }

  myAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.API_URL);
  }

  getById(id: string): Observable<Address> {
    return this.http.get<Address>(`${this.API_URL}/${id}`);
  }

  create(address: Partial<Address>): Observable<Address> {
    return this.http.post<Address>(this.API_URL, address);
  }

  update(id: string, address: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.API_URL}/${id}`, address);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }
}
