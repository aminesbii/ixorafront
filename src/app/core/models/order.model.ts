export interface OrderItem {
  _id?: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot?: string | null;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  _id: string;
  user_id?: string | null;
  session_token?: string | null;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  tax_total: number;
  grand_total: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Populated fields
  items?: OrderItem[];
  addresses?: Array<{
    full_name: string;
    street: string;
    city: string;
    postal_code?: string | null;
    country: string;
  }>;
}
