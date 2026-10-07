"use client";

import { Card, Stack, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import { ErrorState, LoadingState, PageHeader } from "@/components/common";
import { useClinic } from "@/hooks/useClinic";

import BranchesPanel from "./BranchesPanel";
import CatalogPanel from "./CatalogPanel";
import ClinicProfileForm from "./ClinicProfileForm";
import MessagingPanel from "./MessagingPanel";
import { AppointmentSettingsPanel, BillingSettingsPanel, BrandingPanel, HolidaysPanel, WorkingHoursPanel } from "./OperationsPanels";
import SpecialtyPanel from "./SpecialtyPanel";
import { CLINIC_TABS, type ClinicTab } from "./tabs";

const LABELS: Record<ClinicTab, string> = {
  profile: "Profile",
  specialty: "Specialty",
  branches: "Branches",
  hours: "Hours & Holidays",
  appointments: "Appointments",
  billing: "Billing & Branding",
  messaging: "WhatsApp",
  services: "Service Catalog",
};

export default function ClinicView({ initialTab = "profile" }: { initialTab?: ClinicTab }) {
  const [tab, setTab] = useState<ClinicTab>(initialTab);
  const { data: clinic, isPending, isError, error, refetch } = useClinic();

  return (
    <>
      <PageHeader title="Clinic Details" description="Profile, specialties, branches, hours, billing, branding and messaging." />
      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, value: ClinicTab) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ px: 1 }}>
          {CLINIC_TABS.map((key) => <Tab key={key} value={key} label={LABELS[key]} />)}
        </Tabs>
      </Card>
      {isPending ? (
        <LoadingState variant="form" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Stack spacing={3}>
          {tab === "profile" && <ClinicProfileForm key={clinic.updatedAt} clinic={clinic} />}
          {tab === "specialty" && <SpecialtyPanel clinic={clinic} />}
          {tab === "branches" && <BranchesPanel />}
          {tab === "hours" && (
            <>
              <WorkingHoursPanel key={`h-${clinic.updatedAt}`} clinic={clinic} />
              <HolidaysPanel clinic={clinic} />
            </>
          )}
          {tab === "appointments" && <AppointmentSettingsPanel clinic={clinic} />}
          {tab === "billing" && (
            <>
              <BillingSettingsPanel clinic={clinic} />
              <BrandingPanel clinic={clinic} />
            </>
          )}
          {tab === "messaging" && <MessagingPanel clinic={clinic} />}
          {tab === "services" && <CatalogPanel clinic={clinic} />}
        </Stack>
      )}
    </>
  );
}
