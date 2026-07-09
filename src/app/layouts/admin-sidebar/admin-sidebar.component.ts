import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminPrefsService } from '../../core/services/admin-prefs.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  standalone: false
})
export class AdminSidebarComponent {
  allMenuItems = [
    { label: 'Home', icon: 'fa-solid fa-house', route: '/dashboard/home', key: 'home' },
    { label: 'Products', icon: 'fa-solid fa-cubes', route: '/dashboard/products', key: 'products' },
    { label: 'Recycle Bin', icon: 'fa-solid fa-trash-can', route: '/dashboard/recycle-bin', key: 'products' },
    { label: 'Orders', icon: 'fa-solid fa-truck', route: '/dashboard/orders', key: 'orders' },
    { label: 'Analytics', icon: 'fa-solid fa-chart-bar', route: '/dashboard/analytics', key: 'analytics' },
    { label: 'Settings', icon: 'fa-solid fa-gear', route: '/dashboard/settings', key: 'settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    public prefs: AdminPrefsService
  ) {}

  get menuItems() {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return this.allMenuItems;
    }

    if (user.role === 'MANAGER') {
      const perms = user.permissions || [];
      return this.allMenuItems.filter(item => {
        if (item.key === 'settings') return false;
        return perms.includes(item.key);
      });
    }

    return [];
  }

  toggleSidebar(): void {
    this.prefs.setSidebarCollapsed(!this.prefs.sidebarCollapsed);
  }

  logout(): void {
    this.authService.logout();
  }
}
