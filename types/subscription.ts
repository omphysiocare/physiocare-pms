import type { ISODate } from "./common";

export type BillingCycle = "monthly" | "yearly";

export interface PlanLimits {
  members: number;
  branches: number;
  patients: number;
  whatsappMessages: number;
  storageGb: number;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  features: string[];
  recommended: boolean;
}

export interface Subscription {
  clinicId: string;
  planId: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  billingCycle: BillingCycle;
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  cancelAtPeriodEnd: boolean;
  paymentMethod: { brand: string; last4: string; expiry: string };
  /** Billing provider; "mock" today, e.g. "stripe" later. */
  provider: string;
}

export interface SubscriptionInvoice {
  id: string;
  date: ISODate;
  planName: string;
  period: string;
  amount: number;
  tax: number;
  status: "Paid" | "Failed" | "Refunded";
}

export interface SubscriptionUsage {
  members: number;
  branches: number;
  patients: number;
  whatsappMessages: number;
  storageGb: number;
}

export interface SubscriptionOverview {
  subscription: Subscription;
  plan: Plan;
  plans: Plan[];
  usage: SubscriptionUsage;
  invoices: SubscriptionInvoice[];
}
