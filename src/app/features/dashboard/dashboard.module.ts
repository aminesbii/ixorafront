import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { UserHomeComponent } from './pages/user-home/user-home.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';
import { AdminAnalyticsComponent } from './pages/admin-analytics/admin-analytics.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';
import { AdminDeliveriesComponent } from './pages/admin-deliveries/admin-deliveries.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { RecycleBinComponent } from './pages/recycle-bin/recycle-bin.component';
import { AdminCategoriesComponent } from './pages/admin-categories/admin-categories.component';

@NgModule({
  declarations: [
    UserHomeComponent,
    AdminProductsComponent,
    AdminAnalyticsComponent,
    AdminOrdersComponent,
    AdminDeliveriesComponent,
    SettingsComponent,
    RecycleBinComponent,
    AdminCategoriesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    DashboardRoutingModule,
    LayoutsModule
  ]
})
export class DashboardModule { }
