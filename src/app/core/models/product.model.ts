export interface ProductImage {
  id?: string;
  _id?: string;
  product_id?: string;
  image_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  sort_order: number;
  is_main: boolean;
  featured1?: boolean;
  featured2?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id?: string;
  _id?: string;
  product_id: string;
  sku: string;
  variant_name?: string | null;
  price: number;
  compare_at_price?: number | null;
  currency: string;
  stock_qty: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDetails {
  indication?: string;
  composition?: string[];
  usage?: string;
  [key: string]: any; // Allow other properties for Mixed compatibility
}

export interface Product {
  id?: string;
  _id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  details?: ProductDetails;
  status: 'draft' | 'active' | 'archived';
  is_featured: boolean;
  on_sale?: boolean;
  sale_percentage?: number | null;
  base_price?: number | null;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;

  // Populated fields (optional, added by frontend requests or controllers)
  images?: ProductImage[];
  variants?: ProductVariant[];
}
