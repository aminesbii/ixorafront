import { Injectable, NgZone, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

const SOCKET_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private orderSubject = new Subject<any>();
  private deliverySubject = new Subject<any>();

  orderUpdates$: Observable<any> = this.orderSubject.asObservable();
  deliveryUpdates$: Observable<any> = this.deliverySubject.asObservable();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  private connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    this.socket.on('order:updated', (data) => {
      this.ngZone.run(() => this.orderSubject.next(data));
    });

    this.socket.on('delivery:synced', (data) => {
      this.ngZone.run(() => this.deliverySubject.next(data));
    });
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
    this.orderSubject.complete();
    this.deliverySubject.complete();
  }
}
