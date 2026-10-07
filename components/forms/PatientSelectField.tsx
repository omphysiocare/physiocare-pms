"use client";

import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import PersonAvatar from "@/components/common/PersonAvatar";
import { useAllPatients } from "@/hooks/usePatients";
import type { PatientListItem } from "@/types";

interface PatientSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
  onPatientChange?: (patient: PatientListItem | null) => void;
}

/** Searchable patient picker bound to a patient ID field. */
export default function PatientSelectField<T extends FieldValues>({
  control,
  name,
  label = "Patient",
  disabled,
  onPatientChange,
}: PatientSelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const { data: patients = [], isPending } = useAllPatients();
  const selected = patients.find((patient) => patient.id === field.value) ?? null;

  return (
    <Autocomplete<PatientListItem>
      options={patients}
      value={selected}
      loading={isPending}
      disabled={disabled}
      onChange={(_, patient) => {
        field.onChange(patient?.id ?? "");
        onPatientChange?.(patient);
      }}
      onBlur={field.onBlur}
      getOptionLabel={(patient) => `${patient.name} (${patient.id})`}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options, state) => {
        const query = state.inputValue.trim().toLowerCase();
        const matches = query
          ? options.filter(
              (patient) =>
                patient.name.toLowerCase().includes(query) ||
                patient.id.toLowerCase().includes(query) ||
                patient.phone.replace(/\s/g, "").includes(query.replace(/\s/g, "")),
            )
          : options;
        return matches.slice(0, 50);
      }}
      renderOption={(props, patient) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={key} {...rest} sx={{ display: "flex", gap: 1.5 }}>
            <PersonAvatar name={patient.name} size={30} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {patient.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="p">
                {patient.id} · {patient.phone} · {patient.status}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required
          label={label}
          placeholder="Search by name, ID or mobile"
          inputRef={field.ref}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}
