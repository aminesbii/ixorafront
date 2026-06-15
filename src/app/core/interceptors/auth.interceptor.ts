import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let headers = request.headers;

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ixora_token');
      const sessionToken = localStorage.getItem('ixora_session_token');

      // 1. Add JWT Authorization header if token exists
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }

      // 2. Add Guest Session Token if it exists
      if (sessionToken) {
        headers = headers.set('x-session-token', sessionToken);
      }
    }

    const authReq = request.clone({ headers });
    return next.handle(authReq);
  }
}
