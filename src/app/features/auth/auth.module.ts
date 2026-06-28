import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthRoutingModule } from './auth-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { SidebarFilterComponent } from './components/sidebar-filter/sidebar-filter.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { ProductsPageComponent } from './pages/products-page/products-page.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { ShopByCategoryComponent } from './components/shop-by-category/shop-by-category.component';
import { PromoSplitComponent } from './components/promo-split/promo-split.component';
import { FooterComponent } from './components/footer/footer.component';
import { CartComponent } from './pages/cart/cart.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RegisterComponent } from './pages/register/register.component';
import { OrderTrackerComponent } from './pages/order-tracker/order-tracker.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';


@NgModule({
  declarations: [
    LoginComponent,
    HomeComponent,
    ProductDetailComponent,
    NavbarComponent,
    HeroComponent,
    FeaturedProductsComponent,
    ShopByCategoryComponent,
    PromoSplitComponent,
    FooterComponent,
    ProductCardComponent,
    SidebarFilterComponent,
    SearchBarComponent,
    ProductsPageComponent,
    CartComponent,
    ProfileComponent,
    RegisterComponent,
    OrderTrackerComponent,
    AboutComponent,
    ContactComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AuthRoutingModule,
    LayoutsModule,
    SharedModule
  ],
  exports: [
    NavbarComponent
  ]
})
export class AuthModule { }
