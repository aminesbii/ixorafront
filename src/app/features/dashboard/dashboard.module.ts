import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { UserHomeComponent } from './pages/user-home/user-home.component';

@NgModule({
  declarations: [
    UserHomeComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    LayoutsModule
  ]
})
export class DashboardModule { }
