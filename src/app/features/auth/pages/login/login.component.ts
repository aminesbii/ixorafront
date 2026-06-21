import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) { }

  onLogin() {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.role === 'ADMIN') {
          this.router.navigate(['/dashboard/products']);
        } else {
          this.cartService.merge().subscribe({
            next: () => {
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Failed to merge cart on login:', err);
              this.router.navigate(['/']);
            }
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
