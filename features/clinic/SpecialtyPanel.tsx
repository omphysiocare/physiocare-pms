"use client";

import { Box, Button, Chip, Typography } from "@mui/material";

import { useImportDefaultServices } from "@/hooks/useClinic";
import { SPECIALTIES } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { Clinic, Terminology } from "@/types";

import SettingsCard from "./SettingsCard";

const TERM_LABELS: Record<keyof Terminology, string> = {
  provider: "Provider", providers: "Providers", consultation: "Consultation", consultations: "Consultations", service: "Service", services: "Services",
  serviceRecord: "Service record", serviceRecords: "Service records", area: "Treated area", prescription: "Prescription",
};

/** Shows what each enabled specialty configures and lets the clinic import its default services. */
export default function SpecialtyPanel({ clinic }: { clinic: Clinic }) {
  const notify = useNotify();
  const { can } = useAuth();
  const importDefaults = useImportDefaultServices();
  const specialties = Array.from(new Set([clinic.primarySpecialty, ...clinic.specialties]));

  return (
    <>
      {specialties.map((id) => {
        const config = SPECIALTIES[id];
        return (
          <SettingsCard
            key={id}
            title={`${config.name}${id === clinic.primarySpecialty ? " (primary)" : ""}`}
            description={config.description}
            columns={2}
            action={
              can("clinic.edit") && (
                <Button
                  size="small"
                  variant="outlined"
                  loading={importDefaults.isPending}
                  onClick={async () => {
                    try {
                      const added = await importDefaults.mutateAsync(id);
                      notify.success(added ? `${added} ${config.name} services added to the catalog` : "All default services are already in your catalog");
                    } catch (error) {
                      notify.error(error);
                    }
                  }}
                >
                  Import default services
                </Button>
              )
            }
          >
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Terminology</Typography>
              {(Object.keys(TERM_LABELS) as (keyof Terminology)[]).map((key) => (
                <Box key={key} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary">{TERM_LABELS[key]}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{config.terminology[key]}</Typography>
                </Box>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Appointment types</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>{config.appointmentTypes.map((t) => <Chip key={t} size="small" label={t} />)}</Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Consultation template · {config.consultationTemplate.name}</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                {config.consultationTemplate.sections.flatMap((s) => s.fields).map((f) => <Chip key={f.key} size="small" variant="outlined" label={f.label} />)}
                {config.consultationTemplate.sections.length === 0 && <Typography variant="caption" color="text.secondary">Universal fields only</Typography>}
              </Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Default services</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>{config.defaultServices.map((s) => <Chip key={s.name} size="small" variant="outlined" color="primary" label={s.name} />)}</Box>
            </Box>
          </SettingsCard>
        );
      })}
      <Typography variant="caption" color="text.secondary">
        Change the primary specialty or add specialties in the Profile tab. The core workflows stay the same — only terminology, templates, appointment types and default services change.
      </Typography>
    </>
  );
}
