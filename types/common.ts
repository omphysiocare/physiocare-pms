/** ISO date string `YYYY-MM-DD`. */
export type ISODate = string;
/** ISO date-time string. */
export type ISODateTime = string;
/** 24h time string `HH:mm`. */
export type TimeString = string;

export interface BaseEntity {
  id: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Every clinical and financial record belongs to a clinic (tenant) and a branch.
 * The backend must enforce clinic isolation; the frontend only scopes queries.
 */
export interface TenantScoped {
  clinicId: string;
  branchId: string;
}

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Fields managed by the data layer, never sent from forms. */
export type SystemFields = "id" | "createdAt" | "updatedAt" | "clinicId";

export type CreateInput<T extends BaseEntity> = Omit<T, Extract<keyof T, SystemFields>>;
export type UpdateInput<T extends BaseEntity> = Partial<CreateInput<T>>;

/** Lightweight reference to a patient embedded in related records. */
export interface PatientRef {
  id: string;
  name: string;
  phone: string;
  gender: string;
}

/** Lightweight reference to a clinic member (provider or staff). */
export interface MemberRef {
  id: string;
  name: string;
}

export interface BranchRef {
  id: string;
  name: string;
}

/** Values captured by configurable specialty fields. */
export type CustomFieldValues = Record<string, string | number | null>;
