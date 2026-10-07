export const SPECIALTY_IDS = [
  "physiotherapy",
  "dental",
  "dermatology",
  "general_physician",
  "homeopathy",
  "ayurveda",
  "ophthalmology",
  "ent",
  "orthopedics",
  "chiropractic",
  "nutrition",
  "psychology",
  "multispecialty",
] as const;
export type SpecialtyId = (typeof SPECIALTY_IDS)[number];

export type ClinicalFieldType = "text" | "textarea" | "number" | "select" | "scale";

/** A configurable clinical field rendered by specialty templates. */
export interface ClinicalFieldDef {
  key: string;
  label: string;
  type: ClinicalFieldType;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Spans the full form row. */
  wide?: boolean;
}

export interface ClinicalTemplateSection {
  title: string;
  fields: ClinicalFieldDef[];
}

export interface ClinicalTemplate {
  id: string;
  name: string;
  specialty: SpecialtyId;
  sections: ClinicalTemplateSection[];
}

/** Words that change with the clinic's specialty. Core code never hardcodes these. */
export interface Terminology {
  provider: string;
  providers: string;
  consultation: string;
  consultations: string;
  service: string;
  services: string;
  serviceRecord: string;
  serviceRecords: string;
  /** Label for the treated site, e.g. "Body part", "Tooth", "Treatment area". */
  area: string;
  prescription: string;
}

export interface CatalogServiceSeed {
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  taxRate: number;
  description: string;
}

export interface SpecialtyConfig {
  id: SpecialtyId;
  name: string;
  description: string;
  terminology: Terminology;
  appointmentTypes: string[];
  serviceCategories: string[];
  defaultServices: CatalogServiceSeed[];
  consultationTemplate: ClinicalTemplate;
  /** Extra fields captured on each service record (e.g. pain before/after, tooth number). */
  serviceRecordFields: ClinicalFieldDef[];
}
