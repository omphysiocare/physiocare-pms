import type { BaseEntity, CustomFieldValues, ISODate, MemberRef, PatientRef, TenantScoped, TimeString } from "./common";
import type { SpecialtyId } from "./specialty";

/** Catalog entry: anything the clinic performs and bills (treatment, procedure, therapy, session…). */
export interface ClinicalService extends BaseEntity {
  clinicId: string;
  code: string;
  name: string;
  category: string;
  specialty: SpecialtyId;
  durationMinutes: number;
  price: number;
  taxRate: number;
  description: string;
  active: boolean;
}

export const SERVICE_RECORD_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"] as const;
export type ServiceRecordStatus = (typeof SERVICE_RECORD_STATUSES)[number];

/** A clinical service delivered (or planned) for a patient. */
export interface ServiceRecord extends BaseEntity, TenantScoped {
  patientId: string;
  providerId: string;
  serviceId: string;
  /** Snapshot of the catalog name at the time of service. */
  serviceName: string;
  appointmentId: string | null;
  consultationId: string | null;
  date: ISODate;
  startTime: TimeString;
  durationMinutes: number;
  /** Treated site — body part, tooth, skin area… (label comes from specialty terminology). */
  area: string;
  sessionNumber: number;
  totalSessions: number;
  amount: number;
  status: ServiceRecordStatus;
  notes: string;
  customFields: CustomFieldValues;
}

export interface ServiceRecordWithRelations extends ServiceRecord {
  patient: PatientRef;
  provider: MemberRef;
  service: { id: string; name: string; category: string };
  invoiceId: string | null;
}
