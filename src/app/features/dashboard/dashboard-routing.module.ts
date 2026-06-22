import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { UserHomeComponent } from './pages/user-home/user-home.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';
import { AdminAnalyticsComponent } from './pages/admin-analytics/admin-analytics.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminGuard } from '../../core/guards/admin.guard';

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
        canActivate: [AuthGuard, AdminGuard]
      },
      {
        path: 'products',
        component: AdminProductsComponent,
        canActivate: [AuthGuard, AdminGuard]
      },
      {
        path: 'analytics',
        component: AdminAnalyticsComponent,
        canActivate: [AuthGuard, AdminGuard]
      },
      {
        path: 'orders',
        component: AdminOrdersComponent,
        canActivate: [AuthGuard, AdminGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
