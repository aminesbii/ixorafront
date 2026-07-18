import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Governorate {
  gouvernorat: string;
  villes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ColissimoService {
  private readonly API_URL = '/api/colissimo';

  constructor(private http: HttpClient) { }

  getGovernorates(): Observable<Governorate[]> {
    return this.http.get<Governorate[]>(`${this.API_URL}/governorates`);
  }

  createParcel(orderId: string, parcelData?: { nb_pieces?: number; type?: string; designation?: string; commentaire?: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/parcels`, { orderId, ...parcelData });
  }

  listParcels(page: number = 1): Observable<any> {
    return this.http.get(`${this.API_URL}/parcels`, {
      params: new HttpParams().set('page', String(page))
    });
  }

  getParcel(barcode: string): Observable<any> {
    return this.http.get(`${this.API_URL}/parcels/${barcode}`);
  }

  modifyParcel(barcode: string, data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/parcels/${barcode}`, data);
  }

  deleteParcel(barcode: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/parcels/${barcode}`);
  }

  getParcelPdf(barcode: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/parcels/${barcode}/pdf`, {
      responseType: 'blob'
    });
  }

  listDeliveries(params?: { page?: number; limit?: number; status?: string; search?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get(`${this.API_URL}/deliveries`, { params: httpParams });
  }

  syncDeliveries(): Observable<any> {
    return this.http.post(`${this.API_URL}/deliveries/sync`, {});
  }

  verifyParcel(orderId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-parcel`, { orderId });
  }

  getBatchParcelPdf(barcodes: string[]): Observable<Blob> {
    return this.http.post(`${this.API_URL}/parcels/batch-pdf`, { barcodes }, {
      responseType: 'blob'
    });
  }
}
