import { Product, ProductVariant } from './product.model';

export interface CartItem {
  id?: string;
  _id?: string;
  cart_id: string;
  product_id: string | Product; // Can be ID or populated object
  variant_id?: string | ProductVariant | null; // Can be ID or populated object or null
  quantity: number;
  unit_price: number;
  added_at: string;
}

export interface Cart {
  id?: string;
  _id: string;
  user_id?: string | null;
  session_token?: string | null;
  status: 'active' | 'converted' | 'abandoned';
  createdAt?: string;
  updatedAt?: string;
  items?: CartItem[];
}
