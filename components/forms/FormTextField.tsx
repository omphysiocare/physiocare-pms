"use client";

import { MenuItem, TextField, type TextFieldProps } from "@mui/material";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

type Option = { value: string | number; label: string };

type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, "name" | "value" | "onChange" | "error"> & {
  control: Control<T>;
  name: FieldPath<T>;
  /** Renders a select with these options. */
  options?: readonly (Option | string)[];
  /** Stores an empty selection as null instead of "". */
  nullable?: boolean;
  /** Called after the form value changes (for dependent fields). */
  onValueChange?: (value: unknown) => void;
};

/**
 * TextField bound to React Hook Form. Number inputs store numbers (or null
 * when empty) so Zod number schemas validate them directly.
 */
export default function FormTextField<T extends FieldValues>({
  control,
  name,
  options,
  nullable,
  onValueChange,
  type,
  helperText,
  slotProps,
  ...props
}: FormTextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const isNumber = type === "number";
  const normalizedOptions = options?.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  // Options often load asynchronously (therapists, appointments); keep the current
  // value selectable meanwhile so MUI does not treat it as out of range.
  const hasValue = field.value !== null && field.value !== undefined && field.value !== "";
  const missingValue = normalizedOptions && hasValue && !normalizedOptions.some((option) => option.value === field.value);
  const needsShrink = type === "date" || type === "time";

  return (
    <TextField
      {...props}
      type={type}
      select={Boolean(options)}
      name={field.name}
      inputRef={field.ref}
      value={field.value ?? ""}
      onBlur={field.onBlur}
      onChange={(event) => {
        const raw: unknown = event.target.value;
        const value = raw === "" && (isNumber || nullable) ? null : isNumber ? Number(raw) : raw;
        field.onChange(value);
        onValueChange?.(value);
      }}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
      slotProps={{
        ...slotProps,
        inputLabel: needsShrink ? { shrink: true, ...(slotProps?.inputLabel as object) } : slotProps?.inputLabel,
        htmlInput: isNumber ? { inputMode: "decimal", ...(slotProps?.htmlInput as object) } : slotProps?.htmlInput,
      }}
    >
      {missingValue && (
        <MenuItem value={field.value} sx={{ display: "none" }} aria-hidden />
      )}
      {normalizedOptions?.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
