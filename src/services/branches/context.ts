/**
 * Branch filtering helpers for data queries.
 * Apply these to supabase queries when a branch is selected.
 */

const BRANCH_STORAGE_KEY = 'stockflow_active_branch';

export function getStoredBranchId(): string | null {
  try {
    return localStorage.getItem(BRANCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredBranchId(branchId: string | null): void {
  try {
    if (branchId) {
      localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
    } else {
      localStorage.removeItem(BRANCH_STORAGE_KEY);
    }
  } catch {
    // localStorage not available
  }
}

/**
 * Returns branch_id filter value.
 * null means "All Branches" (no filter applied).
 */
export function getBranchFilter(activeBranchId: string | null): string | null {
  return activeBranchId;
}

/**
 * Applies branch filter to a supabase query builder.
 * If branchId is null (All Branches), returns query unchanged.
 */
export function applyBranchFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  branchId: string | null,
  column: string = 'branch_id'
): T {
  if (!branchId) return query;
  return query.eq(column, branchId);
}
