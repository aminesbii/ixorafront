export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
}
