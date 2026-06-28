export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'CUSTOMER' | 'MANAGER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}
