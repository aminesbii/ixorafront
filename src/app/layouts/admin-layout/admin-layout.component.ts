import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: false
})
export class AdminLayoutComponent {

  menuItems = [
    { label: 'Home', icon: 'fa-solid fa-house', route: '/dashboard/home' },
    { label: 'Products', icon: 'fa-solid fa-cubes', route: '/dashboard/products' },
    { label: 'Analytics', icon: 'fa-solid fa-chart-bar', route: '/dashboard/analytics' },
    { label: 'Profile', icon: 'fa-solid fa-user', route: '/dashboard/profile' },
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
