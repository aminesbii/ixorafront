import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent {
  full_name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  nameError = '';
  emailError = '';
  passwordError = '';
  confirmError = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  private validate(): boolean {
    this.nameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmError = '';
    let valid = true;
    if (!this.full_name) {
      this.nameError = 'Full name is required.';
      valid = false;
    }
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
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters.';
      valid = false;
    }
    if (!this.confirmPassword) {
      this.confirmError = 'Please confirm your password.';
      valid = false;
    } else if (this.password !== this.confirmPassword) {
      this.confirmError = 'Passwords do not match.';
      valid = false;
    }
    return valid;
  }

  onRegister(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    if (!this.validate()) return;

    this.isLoading = true;
    this.authService.register(this.full_name, this.email, this.password, this.phone || undefined).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
