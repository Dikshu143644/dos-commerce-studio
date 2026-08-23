export interface Branch {
  id: string;
  name: string;
  code?: string;
  address: string | null;
  city: string | null;
  state?: string | null;
  country: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchSettings {
  id: string;
  branch_id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
}

export interface UserBranchAccess {
  id: string;
  user_id: string;
  branch_id: string;
  access_level: 'member' | 'manager' | 'admin';
}

export interface BranchFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BranchWithUsers extends Branch {
  user_count?: number;
}
