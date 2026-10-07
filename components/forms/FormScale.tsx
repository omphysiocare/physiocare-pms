"use client";

import { Box, FormHelperText, Slider, Typography } from "@mui/material";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { painLabel, painTone } from "@/components/common/PainLevel";

interface FormScaleProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  min?: number;
  max?: number;
}

/** 0–10 rating scale (pain, distress…) bound to React Hook Form. */
export default function FormScale<T extends FieldValues>({ control, name, label, min = 0, max = 10 }: FormScaleProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const hasValue = typeof field.value === "number";
  const value = hasValue ? (field.value as number) : min;
  const tone = painTone(value);
  const id = `${name.replace(/\./g, "-")}-label`;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary" id={id}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: hasValue ? tone.fg : "text.secondary" }}>
          {hasValue ? `${value}/${max} · ${painLabel(value)}` : "Not recorded"}
        </Typography>
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={1}
        marks
        valueLabelDisplay="auto"
        onChange={(_, next) => field.onChange(next as number)}
        onBlur={field.onBlur}
        aria-labelledby={id}
        sx={{ color: hasValue ? tone.fg : "grey.400", mx: 1, width: "calc(100% - 16px)" }}
      />
      {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
    </Box>
  );
}
