import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getStoredBranchId, setStoredBranchId } from '@/services/branches/context';
import type { Branch } from '@/services/branches/types';

interface BranchState {
  activeBranchId: string | null;
  activeBranch: Branch | null;
  branches: Branch[];
  setBranch: (branchId: string | null) => void;
  setBranches: (branches: Branch[]) => void;
  isAllBranches: boolean;
}

const BranchContext = createContext<BranchState | null>(null);

interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const [activeBranchId, setActiveBranchId] = useState<string | null>(() => getStoredBranchId());
  const [branches, setBranchesState] = useState<Branch[]>([]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;
  const isAllBranches = activeBranchId === null;

  const setBranch = useCallback((branchId: string | null) => {
    setActiveBranchId(branchId);
    setStoredBranchId(branchId);
  }, []);

  const setBranches = useCallback((data: Branch[]) => {
    setBranchesState(data);
  }, []);

  // If the stored branch no longer exists in the list, reset to all
  useEffect(() => {
    if (activeBranchId && branches.length > 0) {
      const exists = branches.some((b) => b.id === activeBranchId);
      if (!exists) {
        setBranch(null);
      }
    }
  }, [activeBranchId, branches, setBranch]);

  return (
    <BranchContext.Provider
      value={{ activeBranchId, activeBranch, branches, setBranch, setBranches, isAllBranches }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
}
