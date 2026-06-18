import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    AdminSidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    AdminSidebarComponent
  ]
})
export class LayoutsModule { }
