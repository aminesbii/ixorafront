import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { UserHomeComponent } from './pages/user-home/user-home.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';
import { AdminAnalyticsComponent } from './pages/admin-analytics/admin-analytics.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';

@NgModule({
  declarations: [
    UserHomeComponent,
    AdminProductsComponent,
    AdminAnalyticsComponent,
    AdminOrdersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    LayoutsModule
  ]
})
export class DashboardModule { }
