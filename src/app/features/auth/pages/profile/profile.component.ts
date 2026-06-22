import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: false
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  isLoading = true;
  isSaving = false;

  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user as any;
        this.profileForm.patchValue({
          full_name: user.full_name,
          phone: user.phone || ''
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({
        full_name: this.user.full_name,
        phone: this.user.phone || ''
      });
    }
  }

  save(): void {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (updated) => {
        this.user = updated as any;
        this.isEditing = false;
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  getInitials(): string {
    return this.user?.full_name?.charAt(0)?.toUpperCase() || 'U';
  }

  getMemberSince(): string {
    if (!this.user?.createdAt) return '';
    const d = new Date(this.user.createdAt);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
