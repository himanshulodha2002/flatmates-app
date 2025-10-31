export interface User {
  id: string;
  email: string;
  full_name: string;
  google_id: string;
  profile_picture_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// Shopping types
export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string;
  category?: string;
  is_purchased: boolean;
  purchased_by?: string;
  purchased_at?: string;
}

export interface ShoppingList {
  id: string;
  household_id: string;
  name: string;
  created_by: string;
  created_at: string;
  items: ShoppingItem[];
}

export interface ShoppingListSummary {
  id: string;
  household_id: string;
  name: string;
  created_by: string;
  created_at: string;
  item_count: number;
  purchased_count: number;
}

export interface CreateShoppingListRequest {
  name: string;
}

export interface CreateShoppingItemRequest {
  name: string;
  quantity?: string;
  category?: string;
}

export interface UpdateShoppingItemRequest {
  name?: string;
  quantity?: string;
  category?: string;
  is_purchased?: boolean;
}
