import dayjs from "dayjs";

import { formatId, ID_PREFIX } from "@/lib/ids";
import { createRandom } from "@/lib/random";
import type {
  ActivityLog,
  Appointment,
  Branch,
  Clinic,
  ClinicalService,
  Consultation,
  Expense,
  Invoice,
  Member,
  MessageLog,
  Patient,
  PatientDocument,
  PatientNote,
  RolePermissions,
  ServiceRecord,
  Subscription,
  SubscriptionInvoice,
  SupportTicket,
} from "@/types";

import { generateActivity } from "./activity";
import { buildBranches } from "./branches";
import { generateClinicalRecords } from "./clinicalRecords";
import { SERVICES_SEED } from "./clinicalServices";
import { CLINIC_SEED } from "./clinics";
import { generateMessages } from "./communications";
import { generateExpenses } from "./expenses";
import { MEMBERS_SEED } from "./members";
import { ROLES_SEED } from "./roles";
import { buildSubscription } from "./subscriptions";
import { buildSupportTickets } from "./supportTickets";

/** Every collection the mock backend serves. Mirrors future database tables. */
export interface MockDatabase {
  clinic: Clinic;
  branches: Branch[];
  members: Member[];
  roles: RolePermissions[];
  services: ClinicalService[];
  patients: Patient[];
  patientDocuments: PatientDocument[];
  patientNotes: PatientNote[];
  appointments: Appointment[];
  consultations: Consultation[];
  serviceRecords: ServiceRecord[];
  invoices: Invoice[];
  expenses: Expense[];
  messages: MessageLog[];
  activity: ActivityLog[];
  subscription: Subscription;
  subscriptionInvoices: SubscriptionInvoice[];
  supportTickets: SupportTicket[];
}

const SEED = 20261007;
const PATIENT_COUNT = 190;

function seedDocuments(patients: Patient[]): PatientDocument[] {
  const docs = [
    { name: "MRI report", category: "Imaging" as const, fileName: "mri-report.pdf", size: 412_000 },
    { name: "X-ray", category: "Imaging" as const, fileName: "xray.jpg", size: 860_000 },
    { name: "Referral letter", category: "Report" as const, fileName: "referral-letter.pdf", size: 96_000 },
    { name: "Signed consent form", category: "Consent form" as const, fileName: "consent.pdf", size: 120_000 },
  ];
  return patients.slice(0, 24).flatMap((patient, index) =>
    docs.slice(0, 1 + (index % 3)).map((doc, docIndex) => ({
      id: formatId(ID_PREFIX.document, index * 3 + docIndex + 1),
      patientId: patient.id,
      name: doc.name,
      category: doc.category,
      fileName: `${patient.id.toLowerCase()}-${doc.fileName}`,
      mimeType: doc.fileName.endsWith(".jpg") ? "image/jpeg" : "application/pdf",
      size: doc.size,
      dataUrl: null,
      uploadedAt: patient.createdAt,
      uploadedBy: "Hetal Parmar",
    })),
  );
}

function seedNotes(patients: Patient[]): PatientNote[] {
  return patients
    .filter((patient) => patient.notes)
    .slice(0, 40)
    .map((patient, index) => ({
      id: formatId(ID_PREFIX.note, index + 1),
      patientId: patient.id,
      text: patient.notes,
      createdAt: patient.createdAt,
      authorId: "MEM-004",
      authorName: "Hetal Parmar",
    }));
}

/**
 * Builds the full relational demo dataset. Dates are generated relative to the
 * current day so the dashboard always shows a realistic "today".
 */
export function createSeedData(referenceDate = dayjs()): MockDatabase {
  const random = createRandom(SEED);
  const today = referenceDate.startOf("day");
  const bopalOpenedOn = today.subtract(150, "day").format("YYYY-MM-DD");
  const clinic = structuredClone(CLINIC_SEED);
  const members = structuredClone(MEMBERS_SEED);
  const clinical = generateClinicalRecords(random, today, PATIENT_COUNT, bopalOpenedOn);
  const expenses = generateExpenses(random, today, bopalOpenedOn);
  const messages = generateMessages({ random, today, clinic, members, patients: clinical.patients, appointments: clinical.appointments, invoices: clinical.invoices });
  const { subscription, invoices: subscriptionInvoices } = buildSubscription(today);

  return {
    clinic,
    branches: buildBranches(bopalOpenedOn),
    members,
    roles: structuredClone(ROLES_SEED),
    services: structuredClone(SERVICES_SEED),
    ...clinical,
    patientDocuments: seedDocuments(clinical.patients),
    patientNotes: seedNotes(clinical.patients),
    expenses,
    messages,
    activity: generateActivity({ today, clinicId: clinic.id, members, ...clinical, expenses, messages }),
    subscription,
    subscriptionInvoices,
    supportTickets: buildSupportTickets(today),
  };
}
