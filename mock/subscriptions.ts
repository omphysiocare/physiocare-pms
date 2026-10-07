import dayjs, { type Dayjs } from "dayjs";

import type { Plan, Subscription, SubscriptionInvoice } from "@/types";

import { CLINIC_ID } from "./clinics";

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solo practitioners",
    priceMonthly: 999,
    priceYearly: 9990,
    limits: { members: 3, branches: 1, patients: 1000, whatsappMessages: 500, storageGb: 5 },
    features: ["Appointments & calendar", "Patient records", "Billing & receipts", "Basic reports", "Email support"],
    recommended: false,
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "For growing clinics",
    priceMonthly: 2499,
    priceYearly: 24990,
    limits: { members: 10, branches: 2, patients: 10000, whatsappMessages: 3000, storageGb: 25 },
    features: ["Everything in Starter", "WhatsApp messaging", "All 14 reports with PDF/CSV export", "Multi-branch (2)", "Roles & permissions", "Priority support"],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For multi-specialty & hospitals",
    priceMonthly: 5999,
    priceYearly: 59990,
    limits: { members: 50, branches: 10, patients: 100000, whatsappMessages: 15000, storageGb: 200 },
    features: ["Everything in Professional", "Unlimited specialties", "Up to 10 branches", "Audit log export", "Dedicated success manager", "Custom integrations"],
    recommended: false,
  },
];

export function buildSubscription(today: Dayjs): { subscription: Subscription; invoices: SubscriptionInvoice[] } {
  const periodStart = today.date(5).isAfter(today) ? today.subtract(1, "month").date(5) : today.date(5);
  const subscription: Subscription = {
    clinicId: CLINIC_ID,
    planId: "professional",
    status: "active",
    billingCycle: "monthly",
    currentPeriodStart: periodStart.format("YYYY-MM-DD"),
    currentPeriodEnd: periodStart.add(1, "month").subtract(1, "day").format("YYYY-MM-DD"),
    cancelAtPeriodEnd: false,
    paymentMethod: { brand: "Visa", last4: "4242", expiry: "08/28" },
    provider: "mock",
  };
  const invoices: SubscriptionInvoice[] = Array.from({ length: 8 }, (_, index) => {
    const start = periodStart.subtract(index, "month");
    const isStarter = index >= 6;
    const amount = isStarter ? 999 : 2499;
    return {
      id: `SUB-${start.format("YYYYMM")}`,
      date: start.format("YYYY-MM-DD"),
      planName: isStarter ? "Starter" : "Professional",
      period: `${start.format("DD MMM YYYY")} – ${start.add(1, "month").subtract(1, "day").format("DD MMM YYYY")}`,
      amount,
      tax: Math.round(amount * 0.18),
      status: "Paid",
    };
  });
  return { subscription, invoices };
}

export function periodLabel(date: Dayjs): string {
  return dayjs(date).format("MMM YYYY");
}
