import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    AdminLayoutComponent,
    AuthLayoutComponent
  ]
})
export class LayoutsModule { }
