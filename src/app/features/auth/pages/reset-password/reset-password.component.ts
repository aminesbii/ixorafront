import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
  standalone: false
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  passwordError = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Invalid reset link.';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.passwordError = '';
    this.successMessage = '';

    if (!this.password) {
      this.passwordError = 'Password is required.';
      return;
    }
    if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password reset successful!';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Reset failed. The link may have expired.';
      }
    });
  }
}
