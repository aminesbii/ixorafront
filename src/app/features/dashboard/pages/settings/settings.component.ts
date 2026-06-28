import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminPrefsService, ThemePreset } from '../../../../core/services/admin-prefs.service';

interface Manager {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  permissions: string[];
  createdAt: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: false
})
export class SettingsComponent implements OnInit {
  activeTab: 'managers' | 'appearance' | 'dashboard' = 'managers';

  managers: Manager[] = [];
  availablePages = ['home', 'products', 'orders', 'analytics'];
  loading = false;
  showForm = false;
  editingManager: Manager | null = null;
  formData = {
    full_name: '',
    email: '',
    password: '',
    phone: '',
    permissions: ['home'] as string[],
  };
  deletingManagerId: string | null = null;

  allStatCards = ['Total Projects', 'Active Nodes', 'Monthly Queries', 'Resource Usage'];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public prefs: AdminPrefsService
  ) {}

  ngOnInit(): void {
    this.loadManagers();
  }

  setTab(tab: 'managers' | 'appearance' | 'dashboard'): void {
    this.activeTab = tab;
  }

  setTheme(preset: string): void {
    this.prefs.setTheme(preset as ThemePreset);
  }

  toggleStatCard(title: string): void {
    this.prefs.toggleStatCard(title);
  }

  statCardVisible(title: string): boolean {
    return this.prefs.statCardVisible(title);
  }

  setRowsPerPage(n: number): void {
    this.prefs.setDefaultRowsPerPage(n);
  }

  // ── Managers ──

  loadManagers(): void {
    this.loading = true;
    this.http.get<{ users: Manager[] }>('/api/settings/managers').subscribe({
      next: (res) => { this.managers = res.users; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  togglePermission(page: string): void {
    const idx = this.formData.permissions.indexOf(page);
    if (idx > -1) {
      this.formData.permissions.splice(idx, 1);
    } else {
      this.formData.permissions.push(page);
    }
  }

  hasPermission(page: string): boolean {
    return this.formData.permissions.includes(page);
  }

  openCreateForm(): void {
    this.editingManager = null;
    this.formData = { full_name: '', email: '', password: '', phone: '', permissions: ['home'] };
    this.showForm = true;
  }

  openEditForm(manager: Manager): void {
    this.editingManager = manager;
    this.formData = {
      full_name: manager.full_name,
      email: manager.email,
      password: '',
      phone: manager.phone || '',
      permissions: [...manager.permissions],
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingManager = null;
  }

  submitForm(): void {
    if (!this.formData.full_name || !this.formData.email) return;
    if (!this.editingManager && !this.formData.password) return;

    if (this.editingManager) {
      const body: any = {
        full_name: this.formData.full_name,
        phone: this.formData.phone || null,
        permissions: this.formData.permissions,
      };
      if (this.formData.password) body.password = this.formData.password;

      this.http.put<Manager>(`/api/settings/managers/${this.editingManager.id}`, body).subscribe({
        next: () => { this.loadManagers(); this.cancelForm(); },
        error: (err) => alert(err.error?.message || 'Failed to update manager.'),
      });
    } else {
      this.http.post<Manager>('/api/settings/managers', {
        full_name: this.formData.full_name,
        email: this.formData.email,
        password: this.formData.password,
        phone: this.formData.phone || null,
        permissions: this.formData.permissions,
      }).subscribe({
        next: () => { this.loadManagers(); this.cancelForm(); },
        error: (err) => alert(err.error?.message || 'Failed to create manager.'),
      });
    }
  }

  confirmDelete(id: string): void {
    this.deletingManagerId = id;
  }

  cancelDelete(): void {
    this.deletingManagerId = null;
  }

  executeDelete(): void {
    if (!this.deletingManagerId) return;
    this.http.delete(`/api/settings/managers/${this.deletingManagerId}`).subscribe({
      next: () => { this.loadManagers(); this.deletingManagerId = null; },
      error: (err) => alert(err.error?.message || 'Failed to delete manager.'),
    });
  }

  isCurrentUser(userId: string): boolean {
    return this.authService.getCurrentUser()?.userId === userId;
  }
}
