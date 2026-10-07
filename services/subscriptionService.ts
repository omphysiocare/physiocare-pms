import dayjs from "dayjs";

import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { commit, getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { PLANS } from "@/mock/subscriptions";
import type { BillingCycle, SubscriptionOverview } from "@/types";

/** SaaS subscription of the clinic (not patient billing). Live mode → Stripe via backend. */
export interface SubscriptionService {
  getOverview(): Promise<SubscriptionOverview>;
  changePlan(planId: string, billingCycle: BillingCycle): Promise<SubscriptionOverview>;
  cancel(): Promise<SubscriptionOverview>;
  resume(): Promise<SubscriptionOverview>;
}

function overview(): SubscriptionOverview {
  const db = getDb();
  const plan = PLANS.find((item) => item.id === db.subscription.planId) ?? PLANS[0];
  const monthStart = dayjs().startOf("month").toISOString();
  const storageBytes = db.patientDocuments.reduce((sum, doc) => sum + doc.size, 0);
  return {
    subscription: db.subscription,
    plan,
    plans: PLANS,
    usage: {
      members: db.members.filter((m) => m.status !== "Inactive").length,
      branches: db.branches.filter((b) => b.active).length,
      patients: db.patients.length,
      whatsappMessages: db.messages.filter((m) => m.sentAt >= monthStart).length,
      storageGb: Math.round((storageBytes / 1024 ** 3) * 100) / 100,
    },
    invoices: [...db.subscriptionInvoices].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

const mockSubscriptionService: SubscriptionService = {
  getOverview: () => run(overview),
  changePlan: (planId, billingCycle) =>
    run(() => {
      const db = getDb();
      const plan = PLANS.find((item) => item.id === planId);
      if (!plan) throw new ApiError("Unknown plan.", 404);
      const usage = overview().usage;
      if (usage.members > plan.limits.members || usage.branches > plan.limits.branches) {
        throw new ApiError(`The ${plan.name} plan allows ${plan.limits.members} members and ${plan.limits.branches} branch(es). Reduce usage before downgrading.`, 409);
      }
      const previous = PLANS.find((item) => item.id === db.subscription.planId);
      db.subscription = { ...db.subscription, planId, billingCycle, cancelAtPeriodEnd: false };
      const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
      db.subscriptionInvoices.push({
        id: `SUB-${dayjs().format("YYYYMMDDHHmm")}`,
        date: dayjs().format("YYYY-MM-DD"),
        planName: plan.name,
        period: `Plan change (${billingCycle})`,
        amount,
        tax: Math.round(amount * 0.18),
        status: "Paid",
      });
      logActivity("updated", "Subscription", planId, `Changed plan from ${previous?.name ?? "—"} to ${plan.name} (${billingCycle})`);
      commit();
      return overview();
    }, 700),
  cancel: () =>
    run(() => {
      const db = getDb();
      db.subscription = { ...db.subscription, cancelAtPeriodEnd: true };
      logActivity("updated", "Subscription", db.subscription.planId, "Scheduled subscription cancellation at period end");
      commit();
      return overview();
    }),
  resume: () =>
    run(() => {
      const db = getDb();
      db.subscription = { ...db.subscription, cancelAtPeriodEnd: false };
      logActivity("updated", "Subscription", db.subscription.planId, "Resumed subscription");
      commit();
      return overview();
    }),
};

const httpSubscriptionService: SubscriptionService = {
  getOverview: () => http.get<SubscriptionOverview>("/subscription"),
  changePlan: (planId, billingCycle) => http.post<SubscriptionOverview>("/subscription/change-plan", { planId, billingCycle }),
  cancel: () => http.post<SubscriptionOverview>("/subscription/cancel"),
  resume: () => http.post<SubscriptionOverview>("/subscription/resume"),
};

export const subscriptionService = isMockApi ? mockSubscriptionService : httpSubscriptionService;
