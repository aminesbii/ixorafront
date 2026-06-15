import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: false
})
export class AdminLayoutComponent {

  menuItems = [
    { label: 'Home', icon: 'home', route: '/dashboard/home' },
    { label: 'Analytics', icon: 'bar_chart', route: '/dashboard/analytics' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile' },
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings' }
  ];

  constructor(private router: Router) {}

}
