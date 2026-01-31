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

// Shopping List types
export enum ShoppingListStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export interface ItemCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  household_id?: string;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  household_id: string;
  name: string;
  description?: string;
  status: ShoppingListStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  is_purchased: boolean;
  assigned_to_id?: string;
  price?: number;
  notes?: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  recurring_until?: string;
  last_recurring_date?: string;
  checked_off_by?: string;
  checked_off_at?: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItemWithDetails extends ShoppingListItem {
  assigned_to_name?: string;
  assigned_to_email?: string;
  checked_off_by_name?: string;
  created_by_name: string;
  created_by_email: string;
}

export interface ShoppingListWithItems {
  id: string;
  household_id: string;
  name: string;
  description?: string;
  status: ShoppingListStatus;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  items: ShoppingListItemWithDetails[];
}

export interface ShoppingListCreateRequest {
  household_id: string;
  name: string;
  description?: string;
}

export interface ShoppingListUpdateRequest {
  name?: string;
  description?: string;
  status?: ShoppingListStatus;
}

export interface ShoppingListItemCreateRequest {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  assigned_to_id?: string;
  price?: number;
  notes?: string;
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_until?: string;
  position?: number;
}

export interface ShoppingListItemUpdateRequest {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  is_purchased?: boolean;
  assigned_to_id?: string;
  price?: number;
  notes?: string;
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_until?: string;
  position?: number;
}

export interface ShoppingListItemPurchaseUpdateRequest {
  is_purchased: boolean;
}

export interface ShoppingListStats {
  total_items: number;
  purchased_items: number;
  pending_items: number;
  total_price?: number;
  categories: Record<string, number>;
}

export interface ItemCategoryCreateRequest {
  name: string;
  icon?: string;
  color?: string;
  household_id?: string;
}

// Expense types
export enum ExpenseCategory {
  GROCERIES = 'groceries',
  UTILITIES = 'utilities',
  RENT = 'rent',
  INTERNET = 'internet',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  ENTERTAINMENT = 'entertainment',
  FOOD = 'food',
  TRANSPORTATION = 'transportation',
  OTHER = 'other',
}

export enum SplitType {
  EQUAL = 'equal',
  CUSTOM = 'custom',
  PERCENTAGE = 'percentage',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other',
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  is_settled: boolean;
  settled_at?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface Expense {
  id: string;
  household_id: string;
  created_by: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  date: string;
  split_type: SplitType;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_email?: string;
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

export interface ExpenseCreate {
  household_id: string;
  amount: number;
  description: string;
  category?: ExpenseCategory;
  payment_method?: PaymentMethod;
  date?: string;
  split_type?: SplitType;
  is_personal?: boolean;
  splits?: {
    user_id: string;
    amount_owed: number;
  }[];
}

export interface ExpenseUpdate {
  amount?: number;
  description?: string;
  category?: ExpenseCategory;
  payment_method?: PaymentMethod;
  date?: string;
}

export interface UserBalance {
  user_id: string;
  user_name: string;
  user_email: string;
  total_paid: number;
  total_owed: number;
  balance: number;
}

export interface ExpenseSummary {
  household_id: string;
  total_expenses: number;
  total_settled: number;
  total_pending: number;
  expense_count: number;
  user_balances: UserBalance[];
}

export interface MonthlyExpenseStats {
  year: number;
  month: number;
  total_amount: number;
  expense_count: number;
  category_breakdown: Record<ExpenseCategory, number>;
  average_expense: number;
}

export interface PersonalExpenseAnalytics {
  user_id: string;
  household_id?: string;
  period_start: string;
  period_end: string;
  total_spent: number;
  total_paid_for_others: number;
  total_owed_by_user: number;
  net_balance: number;
  expense_count: number;
  category_breakdown: Record<ExpenseCategory, number>;
  monthly_stats: MonthlyExpenseStats[];
}

export interface ExpenseState {
  expenses: Expense[];
  currentExpense: ExpenseWithSplits | null;
  summary: ExpenseSummary | null;
  analytics: PersonalExpenseAnalytics | null;
  loading: boolean;
}

// AI Suggestion types
export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'chores' | 'financial' | 'shopping' | 'maintenance' | 'other';
  reasoning: string;
}

export interface TaskSuggestionsResponse {
  suggestions: TaskSuggestion[];
}
