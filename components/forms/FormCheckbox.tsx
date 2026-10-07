"use client";

import { Checkbox, FormControlLabel } from "@mui/material";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

export default function FormCheckbox<T extends FieldValues>({ control, name, label }: { control: Control<T>; name: FieldPath<T>; label: string }) {
  const { field } = useController({ control, name });
  return <FormControlLabel control={<Checkbox checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />} label={label} />;
}
