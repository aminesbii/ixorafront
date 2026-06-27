import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AddressService } from '../../../../core/services/address.service';
import { OrderService } from '../../../../core/services/order.service';
import { Address } from '../../../../core/models/address.model';
import { Order } from '../../../../core/models/order.model';

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

  addresses: Address[] = [];
  isLoadingAddresses = false;
  showAddressForm = false;
  editingAddressId: string | null = null;
  isSavingAddress = false;
  addressForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private addressService: AddressService,
    private orderService: OrderService
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['']
    });
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      postal_code: [''],
      country: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
    this.loadOrders();
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

  // ─── Address Management ────────────────────────────────────

  loadAddresses(): void {
    this.isLoadingAddresses = true;
    this.addressService.myAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.isLoadingAddresses = false;
      },
      error: () => {
        this.isLoadingAddresses = false;
      }
    });
  }

  openAddAddress(): void {
    this.editingAddressId = null;
    this.addressForm.reset({
      street: '',
      city: '',
      postal_code: '',
      country: ''
    });
    this.showAddressForm = true;
  }

  openEditAddress(address: Address): void {
    this.editingAddressId = address.id || null;
    this.addressForm.patchValue({
      street: address.street,
      city: address.city,
      postal_code: address.postal_code || '',
      country: address.country
    });
    this.showAddressForm = true;
  }

  closeAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;

    this.isSavingAddress = true;
    const data: Partial<Address> = {
      type: 'shipping',
      full_name: this.user?.full_name || '',
      ...this.addressForm.value
    };

    if (this.editingAddressId) {
      this.addressService.update(this.editingAddressId, data).subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: () => {
          this.isSavingAddress = false;
        }
      });
    } else {
      this.addressService.create(data).subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: () => {
          this.isSavingAddress = false;
        }
      });
    }
  }

  deleteAddress(id: string): void {
    this.addressService.remove(id).subscribe({
      next: () => {
        this.loadAddresses();
      }
    });
  }

  getFullAddressDisplay(a: Address): string {
    return [a.street, a.city, a.postal_code, a.country].filter(Boolean).join(', ');
  }

  // ─── Order History ────────────────────────────────────

  orders: Order[] = [];
  ordersLoading = false;
  ordersTotal = 0;
  ordersPage = 1;
  ordersPages = 1;

  loadOrders(): void {
    this.ordersLoading = true;
    this.orderService.myOrders({ page: this.ordersPage, limit: 10 }).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.ordersTotal = res.total;
        this.ordersPages = res.pages;
        this.ordersLoading = false;
      },
      error: () => {
        this.ordersLoading = false;
      }
    });
  }

  ordersPagePrev(): void {
    if (this.ordersPage > 1) {
      this.ordersPage--;
      this.loadOrders();
    }
  }

  ordersPageNext(): void {
    if (this.ordersPage < this.ordersPages) {
      this.ordersPage++;
      this.loadOrders();
    }
  }

  orderStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(d?: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
