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
