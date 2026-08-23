import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  fetchBranches,
  fetchUserBranchAccess,
  createBranch,
  updateBranch,
  deleteBranch,
  assignUserToBranch,
  removeUserFromBranch,
} from '@/services/branches/branches';
import type { Branch, BranchFilters, UserBranchAccess } from '@/services/branches/types';
import { useBranchContext } from '@/contexts/BranchContext';

export function useBranches(filters: BranchFilters = {}) {
  const { setBranches } = useBranchContext();
  const { page = 1, pageSize = 20, search, is_active } = filters;

  const query = useQuery({
    queryKey: ['branches', { page, pageSize, search, is_active }],
    queryFn: () => fetchBranches(filters),
  });

  // Sync branches to context
  useEffect(() => {
    if (query.data?.data) {
      setBranches(query.data.data);
    }
  }, [query.data?.data, setBranches]);

  return query;
}

export function useActiveBranches() {
  const { setBranches } = useBranchContext();

  const query = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => fetchBranches({ is_active: true, pageSize: 100 }),
  });

  useEffect(() => {
    if (query.data?.data) {
      setBranches(query.data.data);
    }
  }, [query.data?.data, setBranches]);

  return query;
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) => createBranch(branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Branch> & { id: string }) => updateBranch(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUserBranchAccess(userId?: string) {
  return useQuery({
    queryKey: ['user-branch-access', userId],
    queryFn: () => fetchUserBranchAccess(userId),
    enabled: !!userId,
  });
}

export function useAssignUserToBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, branchId, accessLevel }: { userId: string; branchId: string; accessLevel?: UserBranchAccess['access_level'] }) =>
      assignUserToBranch(userId, branchId, accessLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-branch-access'] });
    },
  });
}

export function useRemoveUserFromBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, branchId }: { userId: string; branchId: string }) =>
      removeUserFromBranch(userId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-branch-access'] });
    },
  });
}
