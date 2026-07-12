export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}
