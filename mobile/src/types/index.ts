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
  splits?: Array<{
    user_id: string;
    amount_owed: number;
  }>;
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
