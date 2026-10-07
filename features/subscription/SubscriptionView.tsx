"use client";

import { CheckCircleOutlined, CreditCardOutlined, WorkspacePremiumOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, Chip, Divider, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";

import { ErrorState, LoadingState, PageHeader, SectionCard, StatusChip, useConfirm } from "@/components/common";
import { useCancelSubscription, useChangePlan, useResumeSubscription, useSubscription } from "@/hooks/useAccount";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { BillingCycle, Plan, PlanLimits, SubscriptionUsage } from "@/types";

const USAGE_LABELS: Record<keyof PlanLimits, string> = { members: "Members", branches: "Branches", patients: "Patients", whatsappMessages: "WhatsApp messages (this month)", storageGb: "Storage (GB)" };

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = Math.min(100, (used / limit) * 100);
  return (
    <Box sx={{ mb: 1.75 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{used.toLocaleString("en-IN")} / {limit.toLocaleString("en-IN")}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} color={percent > 90 ? "error" : percent > 70 ? "warning" : "primary"} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
    </Box>
  );
}

export default function SubscriptionView() {
  const { can } = useAuth();
  const notify = useNotify();
  const { data, isPending, isError, error, refetch } = useSubscription();
  const changePlan = useChangePlan();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();
  const { confirm, dialog } = useConfirm();
  const [cycle, setCycle] = useState<BillingCycle | null>(null);
  const manage = can("subscription.manage");

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  const { subscription, plan, plans, usage, invoices } = data;
  const billingCycle = cycle ?? subscription.billingCycle;
  const price = (p: Plan) => (billingCycle === "yearly" ? p.priceYearly : p.priceMonthly);

  const choose = async (target: Plan) => {
    const upgrade = target.priceMonthly > plan.priceMonthly;
    if (!(await confirm({ title: `${upgrade ? "Upgrade" : target.id === plan.id ? "Switch billing" : "Downgrade"} to ${target.name}?`, description: `${formatCurrency(price(target))} per ${billingCycle === "yearly" ? "year" : "month"} + GST. ${upgrade ? "Takes effect immediately; the difference is pro-rated." : "Usage must fit the new plan's limits."}`, confirmLabel: "Confirm" }))) return;
    try {
      await changePlan.mutateAsync({ planId: target.id, billingCycle });
      notify.success(`You're now on ${target.name} (${billingCycle})`);
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <>
      <PageHeader title="Subscription" description="Your PMS plan, usage and SaaS invoices (separate from patient billing)." />
      {subscription.cancelAtPeriodEnd && (
        <Alert severity="warning" sx={{ mb: 3 }} action={manage && <Button color="inherit" size="small" loading={resume.isPending} onClick={() => resume.mutate(undefined, { onSuccess: () => notify.success("Subscription resumed"), onError: notify.error })}>Resume</Button>}>
          Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. You&apos;ll keep access until then.
        </Alert>
      )}
      <Box sx={{ display: "grid", gap: 3, mb: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
        <SectionCard title="Current plan" icon={<WorkspacePremiumOutlined />}>
          <Typography variant="h4">{plan.name}</Typography>
          <Typography color="text.secondary">{plan.tagline}</Typography>
          <Typography variant="h5" sx={{ mt: 2 }}>{formatCurrency(subscription.billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly)} <Typography component="span" color="text.secondary">/ {subscription.billingCycle === "yearly" ? "year" : "month"} + GST</Typography></Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip label={subscription.status === "active" ? "Active" : subscription.status} color="success" size="small" />
            <Chip label={`Renews ${formatDate(subscription.currentPeriodEnd)}`} size="small" variant="outlined" />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CreditCardOutlined color="action" />
            <Typography variant="body2">{subscription.paymentMethod.brand} ending {subscription.paymentMethod.last4} · expires {subscription.paymentMethod.expiry}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>Billing provider: {subscription.provider === "mock" ? "Demo (Stripe-ready)" : subscription.provider}</Typography>
          {manage && !subscription.cancelAtPeriodEnd && (
            <Button color="error" sx={{ mt: 2 }} loading={cancel.isPending} onClick={async () => {
              if (!(await confirm({ title: "Cancel subscription?", description: `You'll keep access until ${formatDate(subscription.currentPeriodEnd)}. Your data stays available for export for 90 days.`, confirmLabel: "Cancel subscription", destructive: true }))) return;
              cancel.mutate(undefined, { onSuccess: () => notify.success("Cancellation scheduled at period end"), onError: notify.error });
            }}>Cancel subscription</Button>
          )}
        </SectionCard>
        <SectionCard title="Usage" subtitle="Against your plan limits">
          {(Object.keys(USAGE_LABELS) as (keyof SubscriptionUsage)[]).map((key) => <UsageRow key={key} label={USAGE_LABELS[key]} used={usage[key]} limit={plan.limits[key]} />)}
        </SectionCard>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6">Plans</Typography>
        <ToggleButtonGroup size="small" exclusive value={billingCycle} onChange={(_, value: BillingCycle | null) => value && setCycle(value)}>
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="yearly">Yearly (2 months free)</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: "grid", gap: 2, mb: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        {plans.map((p) => {
          const current = p.id === plan.id && billingCycle === subscription.billingCycle;
          return (
            <Card key={p.id} sx={{ p: 2.5, display: "flex", flexDirection: "column", borderColor: p.recommended ? "primary.main" : undefined, borderWidth: p.recommended ? 2 : 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{p.name}</Typography>
                {p.recommended && <Chip size="small" color="primary" label="Popular" />}
              </Box>
              <Typography variant="body2" color="text.secondary">{p.tagline}</Typography>
              <Typography variant="h5" sx={{ my: 1.5 }}>{formatCurrency(price(p))}<Typography component="span" variant="body2" color="text.secondary"> / {billingCycle === "yearly" ? "yr" : "mo"}</Typography></Typography>
              <Stack spacing={0.75} sx={{ flex: 1, mb: 2 }}>
                {p.features.map((f) => <Box key={f} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}><CheckCircleOutlined color="success" sx={{ fontSize: 18, mt: 0.25 }} /><Typography variant="body2">{f}</Typography></Box>)}
                <Typography variant="caption" color="text.secondary">{p.limits.members} members · {p.limits.branches} branches · {p.limits.whatsappMessages.toLocaleString("en-IN")} WhatsApp/mo</Typography>
              </Stack>
              <Button variant={current ? "outlined" : "contained"} disabled={current || !manage} loading={changePlan.isPending && changePlan.variables?.planId === p.id} onClick={() => choose(p)}>
                {current ? "Current plan" : p.priceMonthly > plan.priceMonthly ? "Upgrade" : p.id === plan.id ? "Switch cycle" : "Downgrade"}
              </Button>
            </Card>
          );
        })}
      </Box>

      <SectionCard title="Subscription invoices" disablePadding>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Date</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Plan</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Period</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{invoice.id}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{invoice.planName}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{invoice.period}</TableCell>
                  <TableCell align="right">{formatCurrency(invoice.amount + invoice.tax)}</TableCell>
                  <TableCell><StatusChip status={invoice.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
      {dialog}
    </>
  );
}
