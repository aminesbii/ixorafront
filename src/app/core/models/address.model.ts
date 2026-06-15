export interface Address {
  _id?: string;
  user_id?: string | null;
  order_id?: string | null;
  type: 'billing' | 'shipping';
  full_name: string;
  phone?: string | null;
  street: string;
  city: string;
  postal_code?: string | null;
  country: string;
  createdAt?: string;
  updatedAt?: string;
}
