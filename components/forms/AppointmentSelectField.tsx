"use client";

import { useMemo } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { useAppointments } from "@/hooks/useAppointments";
import { formatDate, formatTime } from "@/lib/format";

import FormTextField from "./FormTextField";

interface AppointmentSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  patientId: string;
  label?: string;
}

/** Optional link to one of the selected patient's appointments. */
export default function AppointmentSelectField<T extends FieldValues>({
  control,
  name,
  patientId,
  label = "Linked appointment",
}: AppointmentSelectFieldProps<T>) {
  const { data: appointments = [] } = useAppointments(patientId || "__none__");
  const options = useMemo(
    () => [
      { value: "", label: "Not linked" },
      ...(patientId ? appointments : [])
        .filter((item) => item.status !== "Cancelled" && item.status !== "No Show")
        .slice(0, 30)
        .map((item) => ({
          value: item.id,
          label: `${item.id} · ${formatDate(item.date)} ${formatTime(item.startTime)} · ${item.type}`,
        })),
    ],
    [appointments, patientId],
  );
  return (
    <FormTextField
      control={control}
      name={name}
      label={label}
      options={options}
      disabled={!patientId}
      helperText={patientId ? "Optional" : "Select a patient first"}
    />
  );
}
