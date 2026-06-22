import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  standalone: false
})
export class AdminSidebarComponent {
  menuItems = [
    { label: 'Home', icon: 'fa-solid fa-house', route: '/dashboard/home' },
    { label: 'Products', icon: 'fa-solid fa-cubes', route: '/dashboard/products' },
    { label: 'Orders', icon: 'fa-solid fa-truck', route: '/dashboard/orders' },
    { label: 'Analytics', icon: 'fa-solid fa-chart-bar', route: '/dashboard/analytics' },
    { label: 'Settings', icon: 'fa-solid fa-gear', route: '/dashboard/settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  logout(): void {
    this.authService.logout();
  }
}
