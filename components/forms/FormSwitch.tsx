"use client";

import { Box, Switch, Typography } from "@mui/material";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

interface FormSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
}

export default function FormSwitch<T extends FieldValues>({ control, name, label, description }: FormSwitchProps<T>) {
  const { field } = useController({ control, name });
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        cursor: "pointer",
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      <Switch checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />
    </Box>
  );
}
