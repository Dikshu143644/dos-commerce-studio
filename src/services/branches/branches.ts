import { supabase } from '@/lib/supabase';
import type { Branch, BranchSettings, UserBranchAccess, BranchFilters } from './types';

export async function fetchBranches(filters: BranchFilters = {}) {
  const { page = 1, pageSize = 20, search, is_active } = filters;

  let query = supabase
    .from('branches')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,city.ilike.%${search}%`);
  }
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('name');

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    data: data as Branch[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function fetchBranchById(id: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function createBranch(branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('branches')
    .insert(branch)
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function updateBranch(id: string, updates: Partial<Branch>) {
  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return id;
}

export async function fetchBranchSettings(branchId: string) {
  const { data, error } = await supabase
    .from('branch_settings')
    .select('*')
    .eq('branch_id', branchId);
  if (error) throw error;
  return data as BranchSettings[];
}

export async function upsertBranchSetting(branchId: string, key: string, value: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('branch_settings')
    .upsert({
      branch_id: branchId,
      setting_key: key,
      setting_value: value,
    }, { onConflict: 'branch_id,setting_key' })
    .select()
    .single();
  if (error) throw error;
  return data as BranchSettings;
}

export async function fetchUserBranchAccess(userId?: string) {
  let query = supabase
    .from('user_branch_access')
    .select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as UserBranchAccess[];
}

export async function assignUserToBranch(userId: string, branchId: string, accessLevel: UserBranchAccess['access_level'] = 'member') {
  const { data, error } = await supabase
    .from('user_branch_access')
    .upsert({
      user_id: userId,
      branch_id: branchId,
      access_level: accessLevel,
    }, { onConflict: 'user_id,branch_id' })
    .select()
    .single();
  if (error) throw error;
  return data as UserBranchAccess;
}

export async function removeUserFromBranch(userId: string, branchId: string) {
  const { error } = await supabase
    .from('user_branch_access')
    .delete()
    .eq('user_id', userId)
    .eq('branch_id', branchId);
  if (error) throw error;
}
