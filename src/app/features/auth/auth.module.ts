import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthRoutingModule } from './auth-routing.module';
import { LayoutsModule } from '../../layouts/layouts.module';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { ShopByCategoryComponent } from './components/shop-by-category/shop-by-category.component';
import { PromoSplitComponent } from './components/promo-split/promo-split.component';
import { FooterComponent } from './components/footer/footer.component';


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
    FooterComponent
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
