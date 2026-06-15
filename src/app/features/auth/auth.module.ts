import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthRoutingModule } from './auth-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';


@NgModule({
  declarations: [
    LoginComponent,
    HomeComponent,
    NavbarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthRoutingModule,
    LayoutsModule
  ],
  exports: [
    NavbarComponent
  ]
})
export class AuthModule { }
