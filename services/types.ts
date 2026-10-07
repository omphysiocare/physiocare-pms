/** Branch scope for list queries. "all" (or omitted) = consolidated across branches. */
export interface ListScope {
  branchId?: string;
}

/** Lists that can be narrowed to one patient (patient scope ignores branch). */
export interface PatientScopedFilters extends ListScope {
  patientId?: string;
}

export function scopeMatches(scope: PatientScopedFilters | undefined, record: { branchId: string; patientId?: string }): boolean {
  if (scope?.patientId) return record.patientId === scope.patientId;
  return !scope?.branchId || scope.branchId === "all" || scope.branchId === record.branchId;
}
