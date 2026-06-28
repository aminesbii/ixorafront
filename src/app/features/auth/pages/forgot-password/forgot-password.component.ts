import { Component } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
  standalone: false
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  emailError = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.emailError = '';
    this.successMessage = '';

    if (!this.email) {
      this.emailError = 'Email is required.';
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'If that email exists, a reset link has been sent.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }
}
