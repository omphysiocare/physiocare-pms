"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "physio-pms:branch";
export const ALL_BRANCHES = "all";

interface BranchContextValue {
  /** Selected branch ID, or "all" for the consolidated view. */
  branchId: string;
  setBranchId: (branchId: string) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

function initialBranch(): string {
  if (typeof window === "undefined") return ALL_BRANCHES;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ALL_BRANCHES;
  } catch {
    return ALL_BRANCHES;
  }
}

export default function BranchProvider({ children }: { children: ReactNode }) {
  const [branchId, setState] = useState(initialBranch);
  const setBranchId = useCallback((next: string) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);
  const value = useMemo(() => ({ branchId, setBranchId }), [branchId, setBranchId]);
  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch(): BranchContextValue {
  const context = useContext(BranchContext);
  if (!context) throw new Error("useBranch must be used inside BranchProvider");
  return context;
}
