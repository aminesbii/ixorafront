import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { UserHomeComponent } from './pages/user-home/user-home.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';

@NgModule({
  declarations: [
    UserHomeComponent,
    AdminProductsComponent
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
