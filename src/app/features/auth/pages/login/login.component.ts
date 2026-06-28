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
  emailError = '';
  passwordError = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) { }

  private validate(): boolean {
    this.emailError = '';
    this.passwordError = '';
    let valid = true;
    if (!this.email) {
      this.emailError = 'Email is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address.';
      valid = false;
    }
    if (!this.password) {
      this.passwordError = 'Password is required.';
      valid = false;
    }
    return valid;
  }

  onLogin() {
    if (this.isLoading) return;

    this.errorMessage = '';
    if (!this.validate()) return;

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.role === 'ADMIN' || res.role === 'MANAGER') {
          this.router.navigate(['/dashboard/home']);
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
