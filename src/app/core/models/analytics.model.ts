export interface ProductEvent {
  _id?: string;
  product_id: string;
  user_id?: string | null;
  session_token?: string | null;
  event_type: 'view' | 'click' | 'add_to_cart' | 'purchase';
  created_at: string;
}

export interface ProductPerformanceDaily {
  _id?: string;
  product_id: string;
  date: string;
  click_count: number;
  add_to_cart_count: number;
  purchase_count: number;
  revenue_generated: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalClicks: number;
    totalAddToCart: number;
    conversionRate: number;
  };
  dailyMetrics: Array<{
    date: string;
    revenue: number;
    clicks: number;
    addToCart: number;
    purchases: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    brandName: string;
    clicks: number;
    addToCart: number;
    purchases: number;
    revenue: number;
  }>;
}
