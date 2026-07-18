import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { UserHomeComponent } from './pages/user-home/user-home.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';
import { RecycleBinComponent } from './pages/recycle-bin/recycle-bin.component';
import { AdminAnalyticsComponent } from './pages/admin-analytics/admin-analytics.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';
import { AdminDeliveriesComponent } from './pages/admin-deliveries/admin-deliveries.component';
import { AdminCategoriesComponent } from './pages/admin-categories/admin-categories.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminGuard } from '../../core/guards/admin.guard';
import { AdminOnlyGuard } from '../../core/guards/admin-only.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: UserHomeComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'home' }
      },
      {
        path: 'products',
        component: AdminProductsComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'products' }
      },
      {
        path: 'recycle-bin',
        component: RecycleBinComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'products' }
      },
      {
        path: 'categories',
        component: AdminCategoriesComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'products' }
      },
      {
        path: 'analytics',
        component: AdminAnalyticsComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'analytics' }
      },
      {
        path: 'orders',
        component: AdminOrdersComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'orders' }
      },
      {
        path: 'deliveries',
        component: AdminDeliveriesComponent,
        canActivate: [AuthGuard, AdminGuard],
        data: { permission: 'orders' }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard, AdminOnlyGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
