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

// Household types
export enum MemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface HouseholdMember {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  email: string;
  full_name: string;
  profile_picture_url?: string;
}

export interface HouseholdWithMembers {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members: HouseholdMember[];
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  email: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface HouseholdState {
  activeHouseholdId: string | null;
  households: Household[];
  currentHousehold: HouseholdWithMembers | null;
}

// Todo types
export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Todo {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: string;
  assigned_to_id?: string;
  created_by: string;
  recurring_pattern?: string;
  recurring_until?: string;
  parent_todo_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TodoWithDetails extends Todo {
  assigned_to_name?: string;
  assigned_to_email?: string;
  created_by_name: string;
  created_by_email: string;
}

export interface TodoCreateRequest {
  household_id: string;
  title: string;
  description?: string;
  priority?: TodoPriority;
  due_date?: string;
  assigned_to_id?: string;
  recurring_pattern?: string;
  recurring_until?: string;
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  assigned_to_id?: string;
  recurring_pattern?: string;
  recurring_until?: string;
}

export interface TodoStats {
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total: number;
}

// Expense types
export interface Expense {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  amount: string; // Decimal as string
  category: string;
  subcategory?: string;
  tags?: string[];
  ai_categorized: boolean;
  ai_confidence?: string; // Decimal as string
  ai_reasoning?: string;
  receipt_url?: string;
  receipt_data?: any;
  expense_date: string;
  paid_by_id?: string;
  created_by: string;
  split_type?: string;
  split_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithDetails extends Expense {
  paid_by_name?: string;
  paid_by_email?: string;
  created_by_name: string;
  created_by_email: string;
}

export interface ExpenseCreateRequest {
  household_id: string;
  title: string;
  description?: string;
  amount: number | string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  expense_date: string;
  paid_by_id?: string;
  split_type?: string;
  split_data?: any;
  use_ai_categorization?: boolean;
}

export interface ExpenseUpdateRequest {
  title?: string;
  description?: string;
  amount?: number | string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  expense_date?: string;
  paid_by_id?: string;
  split_type?: string;
  split_data?: any;
}

export interface ExpenseStats {
  total_expenses: number;
  total_amount: string; // Decimal as string
  category_breakdown: Record<string, string>;
  monthly_total: string; // Decimal as string
  user_balances?: Record<string, string>;
}

export interface AICategorizeRequest {
  description: string;
  amount: number | string;
  context?: string;
}

export interface AICategorizeResponse {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning: string;
  suggested_tags: string[];
}

export interface ReceiptOCRResponse {
  success: boolean;
  merchant?: string;
  date?: string;
  total?: string;
  currency?: string;
  items?: Array<{ description: string; amount: number }>;
  tax?: string;
  payment_method?: string;
  confidence?: number;
  notes?: string;
  error?: string;
}

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: string;
  category: string;
  reasoning: string;
}

export interface TaskSuggestionsResponse {
  suggestions: TaskSuggestion[];
  count: number;
}
