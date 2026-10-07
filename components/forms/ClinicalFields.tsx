"use client";

import { Box } from "@mui/material";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import type { ClinicalFieldDef } from "@/types";

import FormScale from "./FormScale";
import FormTextField from "./FormTextField";

interface ClinicalFieldsProps<T extends FieldValues> {
  control: Control<T>;
  fields: ClinicalFieldDef[];
  /** Form path that holds the values object, e.g. "customFields". */
  prefix: string;
}

/** Renders specialty-configured fields (template driven) inside any form grid. */
export default function ClinicalFields<T extends FieldValues>({ control, fields, prefix }: ClinicalFieldsProps<T>) {
  return (
    <>
      {fields.map((field) => {
        const name = `${prefix}.${field.key}` as FieldPath<T>;
        const wide = field.wide || field.type === "textarea";
        const node =
          field.type === "scale" ? (
            <FormScale control={control} name={name} label={field.label} min={field.min} max={field.max} />
          ) : field.type === "select" ? (
            <FormTextField control={control} name={name} label={field.label} options={[{ value: "", label: "—" }, ...(field.options ?? []).map((o) => ({ value: o, label: o }))]} />
          ) : (
            <FormTextField
              control={control}
              name={name}
              label={field.unit ? `${field.label} (${field.unit})` : field.label}
              type={field.type === "number" ? "number" : "text"}
              multiline={field.type === "textarea"}
              minRows={field.type === "textarea" ? 2 : undefined}
              placeholder={field.placeholder}
            />
          );
        return (
          <Box key={field.key} sx={{ gridColumn: wide ? "1 / -1" : undefined }}>
            {node}
          </Box>
        );
      })}
    </>
  );
}
