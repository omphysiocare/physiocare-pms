import type { ClinicalFieldDef, CustomFieldValues } from "@/types";

import DetailList from "./DetailList";
import PainLevel from "./PainLevel";

/** Read-only display of specialty-configured field values. */
export default function ClinicalFieldsView({ fields, values }: { fields: ClinicalFieldDef[]; values: CustomFieldValues }) {
  const filled = fields.filter((field) => values[field.key] !== null && values[field.key] !== undefined && values[field.key] !== "");
  if (filled.length === 0) return null;
  return (
    <DetailList
      items={filled.map((field) => ({
        label: field.label,
        value: field.type === "scale" ? <PainLevel level={Number(values[field.key])} /> : `${values[field.key]}${field.unit ? ` ${field.unit}` : ""}`,
        fullWidth: field.wide || field.type === "textarea",
      }))}
    />
  );
}
