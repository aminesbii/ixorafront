export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}
