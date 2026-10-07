import dayjs, { type Dayjs } from "dayjs";

import { addMinutesToTime } from "@/lib/format";
import { formatId, ID_PREFIX } from "@/lib/ids";
import type { Random } from "@/lib/random";
import type {
  Appointment,
  AppointmentStatus,
  Consultation,
  Invoice,
  InvoiceItem,
  Patient,
  PatientStatus,
  Payment,
  PaymentMethod,
  ServiceRecord,
  ServiceRecordStatus,
  Vitals,
} from "@/types";

import { BRANCH_LOCATIONS } from "./branches";
import { CLINIC_ID } from "./clinics";
import { CONSULTATION_SERVICE_ID, FOLLOW_UP_SERVICE_ID, SERVICES_SEED, serviceByName } from "./clinicalServices";
import { CONDITIONS, type ConditionTemplate } from "./conditions";
import { BRANCH_PROVIDERS, RECEPTION_BY_BRANCH } from "./members";
import {
  AREAS,
  BLOOD_GROUP_WEIGHTS,
  OCCUPATIONS,
  REFERRALS,
  RELATIONS_BY_GENDER,
  SOCIETIES,
  buildPatientProfiles,
  randomPhone,
  type PatientProfile,
} from "./patients";

const ISO = "YYYY-MM-DD";
const APPOINTMENT_MINUTES = 45;

/** Appointment slots per provider (lunch break 13:30–16:00). */
const SLOTS = ["09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "16:00", "16:45", "17:30", "18:15", "19:00"];

const PAYMENT_METHOD_WEIGHTS: (readonly [PaymentMethod, number])[] = [
  ["UPI", 46],
  ["Cash", 28],
  ["Card", 15],
  ["Bank Transfer", 7],
  ["Other", 4],
];

/** Featured patients return for a second episode so they have current activity. */
const RETURN_EPISODES: Record<number, { daysAgo: number; conditionKey: string }> = {
  0: { daysAgo: 9, conditionKey: "lbp" },
  1: { daysAgo: 6, conditionKey: "neck" },
  2: { daysAgo: 12, conditionKey: "ankle" },
  3: { daysAgo: 4, conditionKey: "posture" },
  4: { daysAgo: 16, conditionKey: "neck" },
};

export interface ClinicalSeed {
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  serviceRecords: ServiceRecord[];
  invoices: Invoice[];
}

interface Context {
  random: Random;
  today: Dayjs;
  todayISO: string;
  now: Dayjs;
  bookedSlots: Set<string>;
  appointments: Appointment[];
  consultations: Consultation[];
  serviceRecords: ServiceRecord[];
  invoices: Invoice[];
  counter: number;
}

interface EpisodeScope {
  patientId: string;
  branchId: string;
  providerId: string;
}

function timestamp(date: string, time = "09:00"): string {
  return dayjs(`${date}T${time}:00`).toISOString();
}

function nextWorkingDay(date: Dayjs): Dayjs {
  return date.day() === 0 ? date.add(1, "day") : date;
}

function tempId(ctx: Context, prefix: string): string {
  ctx.counter += 1;
  return `tmp-${prefix}-${ctx.counter}`;
}

function bookSlot(ctx: Context, date: string, providerId: string, preferredIndex: number): string {
  for (let offset = 0; offset < SLOTS.length; offset += 1) {
    const slot = SLOTS[(preferredIndex + offset) % SLOTS.length];
    const key = `${date}|${providerId}|${slot}`;
    if (!ctx.bookedSlots.has(key)) {
      ctx.bookedSlots.add(key);
      return slot;
    }
  }
  return SLOTS[preferredIndex];
}

type VisitState = "past" | "in_progress" | "arrived" | "later_today" | "future";

function visitState(ctx: Context, date: string, time: string, minutes: number): VisitState {
  if (date < ctx.todayISO) return "past";
  if (date > ctx.todayISO) return "future";
  const start = dayjs(`${date}T${time}`);
  if (!start.add(minutes, "minute").isAfter(ctx.now)) return "past";
  if (!start.isAfter(ctx.now)) return "in_progress";
  if (start.diff(ctx.now, "minute") <= 20) return "arrived";
  return "later_today";
}

/** Realistic status for a visit, given where it falls relative to now. */
function appointmentStatus(ctx: Context, state: VisitState, date: string, allowMissed: boolean): AppointmentStatus {
  switch (state) {
    case "past":
      if (allowMissed && ctx.random.chance(0.06)) return "Cancelled";
      if (allowMissed && ctx.random.chance(0.04)) return "No Show";
      return "Completed";
    case "in_progress":
      return "In Consultation";
    case "arrived":
      return "Checked In";
    case "later_today":
      return "Confirmed";
    case "future":
      if (ctx.random.chance(0.05)) return "Rescheduled";
      return dayjs(date).diff(ctx.today, "day") <= 2 ? "Confirmed" : "Scheduled";
  }
}

function recordStatus(status: AppointmentStatus): ServiceRecordStatus {
  if (status === "Completed") return "Completed";
  if (status === "Cancelled" || status === "No Show") return "Cancelled";
  if (status === "In Consultation") return "In Progress";
  return "Scheduled";
}

function createAppointment(
  ctx: Context,
  scope: EpisodeScope,
  input: Pick<Appointment, "serviceId" | "date" | "startTime" | "type" | "status" | "reason" | "notes">,
  minutes = APPOINTMENT_MINUTES,
): Appointment {
  const { random } = ctx;
  const created = timestamp(dayjs(input.date).subtract(random.int(1, 4), "day").format(ISO), "11:00");
  const appointment: Appointment = {
    ...input,
    id: tempId(ctx, "apt"),
    clinicId: CLINIC_ID,
    branchId: scope.branchId,
    patientId: scope.patientId,
    providerId: scope.providerId,
    endTime: addMinutesToTime(input.startTime, minutes),
    location: random.pick(BRANCH_LOCATIONS[scope.branchId]),
    checkedInAt: ["Checked In", "In Consultation", "Completed"].includes(input.status)
      ? dayjs(`${input.date}T${input.startTime}`).subtract(random.int(3, 12), "minute").toISOString()
      : null,
    cancellationReason:
      input.status === "Cancelled" ? random.pick(["Patient unwell", "Travelling out of town", "Work commitment", "Clinic rescheduled"]) : "",
    rescheduledFrom:
      input.status === "Rescheduled"
        ? { date: dayjs(input.date).subtract(random.int(1, 3), "day").format(ISO), startTime: random.pick(SLOTS) }
        : null,
    createdAt: created,
    updatedAt: input.status === "Completed" ? timestamp(input.date, input.startTime) : created,
  };
  ctx.appointments.push(appointment);
  return appointment;
}

function randomVitals(random: Random, age: number): Vitals {
  const height = random.int(150, 182);
  return {
    bpSystolic: random.int(age > 50 ? 124 : 108, age > 50 ? 146 : 132),
    bpDiastolic: random.int(70, 90),
    pulse: random.int(64, 92),
    temperature: Math.round((97.8 + random.next()) * 10) / 10,
    spo2: random.int(96, 99),
    respiratoryRate: random.int(14, 18),
    weight: random.int(Math.round(height * 0.32), Math.round(height * 0.48)),
    height,
  };
}

function createPayments(ctx: Context, scope: EpisodeScope, invoiceDate: string, total: number, mode: "full" | "partial"): Payment[] {
  const { random } = ctx;
  const method = random.weighted(PAYMENT_METHOD_WEIGHTS);
  const recordedBy = RECEPTION_BY_BRANCH[scope.branchId];
  const reference = (m: PaymentMethod) =>
    m === "UPI"
      ? `UPI${random.int(100000000, 999999999)}`
      : m === "Card"
        ? `XXXX-${random.int(1000, 9999)}`
        : m === "Bank Transfer"
          ? `NEFT${random.int(10000000, 99999999)}`
          : "";
  const payDate = (offset: number) => {
    const date = dayjs(invoiceDate).add(offset, "day");
    return (date.isAfter(ctx.today) ? ctx.today : date).format(ISO);
  };
  const payment = (date: string, amount: number, m: PaymentMethod, note: string): Payment => ({
    id: "",
    kind: "payment",
    receiptNumber: "",
    date,
    amount,
    method: m,
    reference: reference(m),
    note,
    recordedBy,
  });

  if (mode === "partial") {
    const amount = Math.round((total * random.pick([0.4, 0.5, 0.6])) / 50) * 50;
    return [payment(payDate(0), amount, method, "Advance payment")];
  }
  if (total > 3000 && random.chance(0.3)) {
    const first = Math.round(total / 2 / 50) * 50;
    return [
      payment(payDate(0), first, method, "First instalment"),
      payment(payDate(random.int(2, 6)), total - first, random.weighted(PAYMENT_METHOD_WEIGHTS), "Balance settled"),
    ];
  }
  return [payment(payDate(random.chance(0.8) ? 0 : 1), total, method, "")];
}

function createInvoice(
  ctx: Context,
  scope: EpisodeScope,
  appointmentId: string | null,
  invoiceDate: string,
  items: Omit<InvoiceItem, "id">[],
  kind: "consultation" | "package",
): void {
  const { random } = ctx;
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = kind === "package" && random.chance(0.12) ? Math.round((subtotal * 0.1) / 50) * 50 : 0;
  const total = subtotal - discount;
  const age = ctx.today.diff(dayjs(invoiceDate), "day");

  let cancelled = false;
  let payments: Payment[] = [];
  if (random.chance(0.015)) {
    cancelled = true;
  } else {
    const outcome =
      kind === "consultation" && random.chance(0.9)
        ? "paid"
        : age > 14
          ? random.chance(0.97)
            ? "paid"
            : "partial"
          : random.weighted([
              ["paid", 55],
              ["partial", 25],
              ["pending", 20],
            ] as const);
    if (outcome === "paid") payments = createPayments(ctx, scope, invoiceDate, total, "full");
    if (outcome === "partial") payments = createPayments(ctx, scope, invoiceDate, total, "partial");
  }

  // A few package invoices are refunded after the patient discontinues.
  let notes = cancelled ? "Invoice cancelled — billed in error." : discount > 0 ? "10% package discount applied." : "";
  if (kind === "package" && age > 30 && payments.length === 1 && payments[0].amount === total && random.chance(0.02)) {
    payments.push({
      ...payments[0],
      kind: "refund",
      date: dayjs(payments[0].date).add(random.int(3, 10), "day").format(ISO),
      reference: "",
      note: "Package discontinued — refund issued",
    });
    notes = "Patient discontinued; full refund processed.";
  }

  ctx.invoices.push({
    id: tempId(ctx, "inv"),
    clinicId: CLINIC_ID,
    branchId: scope.branchId,
    patientId: scope.patientId,
    providerId: scope.providerId,
    appointmentId,
    invoiceDate,
    dueDate: dayjs(invoiceDate).add(7, "day").format(ISO),
    items: items.map((item, index) => ({ ...item, id: `item-${index + 1}` })),
    discount,
    payments,
    cancelled,
    cancellationReason: cancelled ? "Billed in error" : "",
    notes,
    createdAt: timestamp(invoiceDate, "19:30"),
    updatedAt: timestamp(payments.at(-1)?.date ?? invoiceDate, "19:30"),
  });
}

function billSessions(ctx: Context, scope: EpisodeScope, records: ServiceRecord[]): void {
  const last = records[records.length - 1];
  createInvoice(
    ctx,
    scope,
    last.appointmentId,
    last.date,
    records.map((record) => ({
      description: `${record.serviceName} — Session ${record.sessionNumber} (${dayjs(record.date).format("DD MMM")})`,
      serviceId: record.serviceId,
      serviceRecordId: record.id,
      quantity: 1,
      unitPrice: record.amount,
      taxRate: SERVICES_SEED.find((service) => service.id === record.serviceId)?.taxRate ?? 0,
    })),
    "package",
  );
}

interface EpisodeResult {
  lastVisit: string | null;
  completedSessions: number;
  plannedSessions: number;
  outcome: PatientStatus;
  firstPain: number;
  latestPain: number | null;
}

function buildEpisode(
  ctx: Context,
  scope: EpisodeScope,
  startDate: Dayjs,
  condition: ConditionTemplate,
  age: number,
  allowDropout: boolean,
  visitType: Consultation["visitType"],
): EpisodeResult {
  const { random } = ctx;
  const preferredSlot = random.int(0, SLOTS.length - 1);
  const plannedSessions = random.int(condition.sessions[0], condition.sessions[1]);
  const initialPain = random.int(condition.painRange[0], condition.painRange[1]);
  const consultService = SERVICES_SEED.find((service) => service.id === CONSULTATION_SERVICE_ID)!;

  // 1. Initial consultation visit
  const consultDate = nextWorkingDay(startDate).format(ISO);
  const consultTime = bookSlot(ctx, consultDate, scope.providerId, preferredSlot);
  const consultState = visitState(ctx, consultDate, consultTime, APPOINTMENT_MINUTES);
  const consultAppointment = createAppointment(ctx, scope, {
    serviceId: CONSULTATION_SERVICE_ID,
    date: consultDate,
    startTime: consultTime,
    type: "New Consultation",
    status: appointmentStatus(ctx, consultState, consultDate, false),
    reason: condition.chiefComplaint,
    notes: "First visit. Bring previous reports and MRI/X-ray if available.",
  });

  let lastVisit: string | null = null;
  if (consultAppointment.status === "Completed") {
    lastVisit = consultDate;
    ctx.consultations.push({
      id: tempId(ctx, "con"),
      clinicId: CLINIC_ID,
      branchId: scope.branchId,
      patientId: scope.patientId,
      providerId: scope.providerId,
      appointmentId: consultAppointment.id,
      date: consultDate,
      visitType,
      chiefComplaint: condition.chiefComplaint,
      history: condition.history,
      medicalHistory: random.pick(condition.medicalHistory),
      surgicalHistory: condition.key === "acl" ? "ACL reconstruction (hamstring graft)" : condition.key === "tkr" ? "Total knee replacement" : "None",
      familyHistory: random.pick(["Not significant", "Father — diabetes", "Mother — osteoarthritis", "Not significant"]),
      allergies: "None known",
      currentMedications: random.pick(["None", "Paracetamol SOS", "Aceclofenac 100 mg BD (5 days)"]),
      vitals: randomVitals(random, age),
      examination: `${condition.findings.observation}. ${condition.findings.palpation}.`,
      findings: condition.assessment,
      templateId: "tpl-physiotherapy",
      customFields: {
        painScale: initialPain,
        painLocation: condition.painLocation,
        painType: random.pick(["Dull / aching", "Sharp", "Radiating"]),
        rom: condition.findings.rangeOfMotion,
        muscleStrength: condition.findings.muscleStrength,
        specialTests: condition.findings.specialTests,
        functionalAssessment: "Difficulty with prolonged sitting and daily activities.",
      },
      assessment: condition.assessment,
      diagnosis: condition.diagnosis,
      treatmentPlan: condition.treatmentPlan,
      plannedSessions,
      prescription: condition.homeProgram.map((name, index) => ({
        id: `rx-${index + 1}`,
        name,
        dosage: random.pick(["10 reps", "15 reps", "Hold 20 s × 3"]),
        frequency: random.pick(["Twice daily", "Once daily", "3 times daily"]),
        duration: "2 weeks",
        instructions: index === 0 ? "Stop if pain increases sharply." : "",
      })),
      advice: "Maintain correct posture, avoid aggravating activities, apply ice 10 minutes after exercises.",
      followUpDate: dayjs(consultDate).add(14, "day").format(ISO),
      notes: "Home programme explained and demonstrated.",
      createdAt: timestamp(consultDate, consultTime),
      updatedAt: timestamp(consultDate, consultTime),
    });
    createInvoice(
      ctx,
      scope,
      consultAppointment.id,
      consultDate,
      [{ description: consultService.name, serviceId: consultService.id, serviceRecordId: null, quantity: 1, unitPrice: consultService.price, taxRate: consultService.taxRate }],
      "consultation",
    );
  }

  // 2. Service sessions
  const dropoutAfter = allowDropout && random.chance(0.1) ? random.int(3, Math.max(3, plannedSessions - 2)) : Number.POSITIVE_INFINITY;
  let cursor = dayjs(consultDate);
  let sessionNumber = 0;
  let completedSessions = 0;
  let latestPain: number | null = null;
  let unbilled: ServiceRecord[] = [];
  let lastSessionDate = consultDate;
  let hasFutureSessions = consultAppointment.status !== "Completed";

  while (sessionNumber < plannedSessions) {
    cursor = nextWorkingDay(cursor.add(random.pick([1, 2, 2, 3]), "day"));
    const date = cursor.format(ISO);
    const time = bookSlot(ctx, date, scope.providerId, preferredSlot);
    const state = visitState(ctx, date, time, APPOINTMENT_MINUTES);
    if (sessionNumber >= dropoutAfter && state === "past") break;

    const status = appointmentStatus(ctx, state, date, true);
    if (status !== "Cancelled" && status !== "No Show") sessionNumber += 1;
    if (state !== "past") hasFutureSessions = true;

    const service = serviceByName(condition.therapies[Math.max(sessionNumber - 1, 0) % condition.therapies.length]);
    const progress = plannedSessions > 1 ? (Math.max(sessionNumber, 1) - 1) / (plannedSessions - 1) : 1;
    const painBefore = Math.max(1, Math.round(initialPain - progress * (initialPain - 1.5)));
    const painAfter = Math.max(0, painBefore - random.int(1, 2));

    const appointment = createAppointment(ctx, scope, {
      serviceId: service.id,
      date,
      startTime: time,
      type: "Treatment Session",
      status,
      reason: `${service.name} — session ${Math.max(sessionNumber, 1)} of ${plannedSessions}`,
      notes: "",
    });

    const recStatus = recordStatus(status);
    const done = recStatus === "Completed";
    const record: ServiceRecord = {
      id: tempId(ctx, "sr"),
      clinicId: CLINIC_ID,
      branchId: scope.branchId,
      patientId: scope.patientId,
      providerId: scope.providerId,
      serviceId: service.id,
      serviceName: service.name,
      appointmentId: appointment.id,
      consultationId: null,
      date,
      startTime: time,
      durationMinutes: service.durationMinutes,
      area: condition.bodyPart,
      sessionNumber: Math.max(sessionNumber, 1),
      totalSessions: plannedSessions,
      amount: service.price,
      status: recStatus,
      notes: done
        ? random.pick([
            `Patient tolerated the session well. Pain reduced from ${painBefore}/10 to ${painAfter}/10.`,
            `Progressed exercise load. Reports ${painAfter}/10 pain post-session. Continue home programme.`,
            `Good response to ${service.name.toLowerCase()}. Range of motion improving.`,
          ])
        : recStatus === "Cancelled"
          ? status === "No Show"
            ? "Patient did not attend."
            : "Session cancelled."
          : "",
      customFields: done ? { painBefore, painAfter } : {},
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
    ctx.serviceRecords.push(record);

    if (done) {
      completedSessions += 1;
      latestPain = painAfter;
      lastVisit = date;
      lastSessionDate = date;
      unbilled.push(record);
      if (unbilled.length === 4) {
        billSessions(ctx, scope, unbilled);
        unbilled = [];
      }
    }
  }

  const droppedOut = Number.isFinite(dropoutAfter) && sessionNumber < plannedSessions;
  const finished = !hasFutureSessions && consultAppointment.status === "Completed";
  if (finished && unbilled.length > 0) billSessions(ctx, scope, unbilled);

  // 3. Review visit after discharge
  if (finished && !droppedOut && random.chance(0.6)) {
    const reviewDate = nextWorkingDay(dayjs(lastSessionDate).add(7, "day")).format(ISO);
    const reviewTime = bookSlot(ctx, reviewDate, scope.providerId, preferredSlot);
    const state = visitState(ctx, reviewDate, reviewTime, 30);
    const followUp = SERVICES_SEED.find((service) => service.id === FOLLOW_UP_SERVICE_ID)!;
    const review = createAppointment(
      ctx,
      scope,
      {
        serviceId: followUp.id,
        date: reviewDate,
        startTime: reviewTime,
        type: "Follow-up",
        status: appointmentStatus(ctx, state, reviewDate, false),
        reason: "Post-treatment progress review",
        notes: "",
      },
      30,
    );
    if (review.status === "Completed") {
      lastVisit = reviewDate;
      ctx.consultations.push({
        id: tempId(ctx, "con"),
        clinicId: CLINIC_ID,
        branchId: scope.branchId,
        patientId: scope.patientId,
        providerId: scope.providerId,
        appointmentId: review.id,
        date: reviewDate,
        visitType: "Follow-up",
        chiefComplaint: "Follow-up review after completion of treatment",
        history: `Completed ${completedSessions} sessions. Reports significant improvement in daily activities.`,
        medicalHistory: "",
        surgicalHistory: "",
        familyHistory: "",
        allergies: "None known",
        currentMedications: "None",
        vitals: randomVitals(random, age),
        examination: "Normal posture and gait. No significant tenderness.",
        findings: "Good functional recovery with minimal residual symptoms.",
        templateId: "tpl-physiotherapy",
        customFields: {
          painScale: Math.max(0, (latestPain ?? 2) - 1),
          painLocation: condition.painLocation,
          rom: "Near-full, pain-free range of motion",
          muscleStrength: "4+/5 in previously weak groups",
          specialTests: "Previously positive tests now negative",
        },
        assessment: "Good functional recovery.",
        diagnosis: condition.diagnosis,
        treatmentPlan: "Continue home exercise programme 4–5 times a week. Review as needed.",
        plannedSessions: 0,
        prescription: condition.homeProgram.slice(0, 2).map((name, index) => ({
          id: `rx-${index + 1}`,
          name,
          dosage: "15 reps",
          frequency: "Once daily",
          duration: "4 weeks",
          instructions: "",
        })),
        advice: "Stay active; continue strengthening exercises.",
        followUpDate: null,
        notes: "Patient discharged with home exercise programme.",
        createdAt: timestamp(reviewDate, reviewTime),
        updatedAt: timestamp(reviewDate, reviewTime),
      });
      createInvoice(
        ctx,
        scope,
        review.id,
        reviewDate,
        [{ description: followUp.name, serviceId: followUp.id, serviceRecordId: null, quantity: 1, unitPrice: followUp.price, taxRate: followUp.taxRate }],
        "consultation",
      );
    }
  }

  return {
    lastVisit,
    completedSessions,
    plannedSessions,
    outcome: droppedOut ? "Inactive" : finished ? "Discharged" : "Active",
    firstPain: initialPain,
    latestPain,
  };
}

function buildPatient(
  ctx: Context,
  index: number,
  profile: PatientProfile,
  condition: ConditionTemplate,
  registeredOn: string,
  scope: Omit<EpisodeScope, "patientId">,
  age: number,
): Patient {
  const { random, today } = ctx;
  const area = random.pick(AREAS);
  const history = random.pick(condition.medicalHistory);
  const [referralSource, referralDetail] = random.weighted(REFERRALS.map(([source, detail, weight]) => [[source, detail] as const, weight] as const));
  const medications = [
    history.includes("Diabetes") ? "Metformin 500 mg BD" : null,
    history.includes("Hypertension") ? "Amlodipine 5 mg OD" : null,
    history.includes("Hypothyroidism") ? "Thyroxine 50 mcg OD" : null,
  ].filter(Boolean);
  const hasInsurance = random.chance(0.25);

  return {
    id: formatId(ID_PREFIX.patient, index + 1),
    clinicId: CLINIC_ID,
    branchId: scope.branchId,
    firstName: profile.firstName,
    middleName: random.chance(0.3) ? random.pick(["Kumar", "Bhai", "Ben", "Prakash", "Devi"]) : "",
    lastName: profile.lastName,
    gender: profile.gender,
    dateOfBirth: today.subtract(age, "year").subtract(random.int(10, 340), "day").format(ISO),
    bloodGroup: random.weighted(BLOOD_GROUP_WEIGHTS),
    photo: null,
    occupation: age > 62 ? "Retired" : age < 23 ? "Student" : random.pick(OCCUPATIONS.filter((o) => o !== "Retired" && o !== "Student")),
    phone: randomPhone(random),
    alternatePhone: random.chance(0.3) ? randomPhone(random) : "",
    email: `${profile.firstName}.${profile.lastName}${random.int(1, 99)}@gmail.com`.toLowerCase(),
    address: {
      line: `${random.int(1, 120)}, ${random.pick(SOCIETIES)}, ${area.line}`,
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      pincode: area.pincode,
    },
    emergencyContact: {
      name: `${random.pick(["Ramesh", "Kiran", "Nita", "Mukesh", "Sejal", "Alpesh", "Daksha"])} ${profile.lastName}`,
      relation: random.pick(RELATIONS_BY_GENDER[profile.gender]),
      phone: randomPhone(random),
    },
    medical: {
      primaryCondition: condition.diagnosis,
      currentCondition: "",
      existingConditions: history.includes("Diabetes") || history.includes("Hypertension") ? history : "None",
      medicalHistory: history,
      surgicalHistory:
        condition.key === "acl"
          ? "ACL reconstruction (hamstring graft)"
          : condition.key === "tkr"
            ? "Total knee replacement"
            : random.chance(0.15)
              ? random.pick(["Appendectomy (2015)", "Caesarean section (2018)", "Hernia repair (2019)"])
              : "None",
      familyHistory: random.pick(["Not significant", "Father — diabetes", "Mother — hypertension", "Mother — osteoarthritis"]),
      allergies: random.weighted([
        ["None known", 80],
        ["Penicillin", 6],
        ["Sulfa drugs", 4],
        ["Dust allergy", 6],
        ["Adhesive tape sensitivity", 4],
      ] as const),
      currentMedications: medications.length > 0 ? medications.join(", ") : "None",
      lifestyle: random.pick(["Sedentary desk job", "Moderately active, walks daily", "Regular gym 4×/week", "Homemaker, active", "Plays badminton weekly"]),
    },
    referral: { source: referralSource, detail: referralDetail },
    insurance: hasInsurance
      ? {
          provider: random.pick(["Star Health", "HDFC ERGO", "Niva Bupa", "ICICI Lombard"]),
          policyNumber: `POL${random.int(1000000, 9999999)}`,
          validTill: today.add(random.int(30, 330), "day").format(ISO),
        }
      : { provider: "", policyNumber: "", validTill: "" },
    identification: random.chance(0.6) ? { type: "Aadhaar", number: `XXXX XXXX ${random.int(1000, 9999)}` } : { type: "", number: "" },
    consent: { treatment: true, communication: random.chance(0.97), date: registeredOn },
    primaryProviderId: scope.providerId,
    status: "Active",
    registeredOn,
    notes: random.chance(0.3)
      ? random.pick([
          "Prefers evening appointments.",
          "Requires wheelchair assistance at entry.",
          "Corporate employee — needs invoice with company name.",
          "Prefers communication over WhatsApp.",
        ])
      : "",
    createdAt: timestamp(registeredOn, "09:00"),
    updatedAt: timestamp(registeredOn, "09:00"),
  };
}

function describeCondition(result: EpisodeResult): string {
  if (result.outcome === "Discharged") return "Discharged — treatment goals achieved, independent with home programme.";
  if (result.outcome === "Inactive") return `Discontinued treatment after ${result.completedSessions} sessions.`;
  if (result.completedSessions === 0) return `Newly registered — initial pain ${result.firstPain}/10, plan of ${result.plannedSessions} sessions.`;
  return `Improving — pain reduced from ${result.firstPain}/10 to ${result.latestPain ?? result.firstPain}/10 after ${result.completedSessions} of ${result.plannedSessions} sessions.`;
}

function assignIds(ctx: Context): void {
  const map = new Map<string, string>();
  const byDateTime = <T extends { date: string; startTime?: string }>(a: T, b: T) =>
    `${a.date}${a.startTime ?? ""}`.localeCompare(`${b.date}${b.startTime ?? ""}`);

  ctx.appointments.sort(byDateTime).forEach((item, index) => {
    const id = formatId(ID_PREFIX.appointment, index + 1);
    map.set(item.id, id);
    item.id = id;
  });
  ctx.consultations.sort(byDateTime).forEach((item, index) => {
    item.id = formatId(ID_PREFIX.consultation, index + 1);
    item.appointmentId = item.appointmentId ? (map.get(item.appointmentId) ?? null) : null;
  });
  ctx.serviceRecords.sort(byDateTime).forEach((item, index) => {
    const id = formatId(ID_PREFIX.serviceRecord, index + 1);
    map.set(item.id, id);
    item.id = id;
    item.appointmentId = item.appointmentId ? (map.get(item.appointmentId) ?? null) : null;
  });

  // Link each service record to the plan of care (consultation) it belongs to.
  const consultationsByPatient = new Map<string, Consultation[]>();
  for (const consultation of ctx.consultations) {
    const list = consultationsByPatient.get(consultation.patientId) ?? [];
    list.push(consultation);
    consultationsByPatient.set(consultation.patientId, list);
  }
  for (const record of ctx.serviceRecords) {
    const plans = (consultationsByPatient.get(record.patientId) ?? []).filter((c) => c.date <= record.date && c.plannedSessions > 0);
    record.consultationId = plans.at(-1)?.id ?? null;
  }

  ctx.invoices
    .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate) || a.createdAt.localeCompare(b.createdAt))
    .forEach((invoice, index) => {
      invoice.id = formatId(ID_PREFIX.invoice, index + 1);
      invoice.appointmentId = invoice.appointmentId ? (map.get(invoice.appointmentId) ?? null) : null;
      invoice.items = invoice.items.map((item) => ({
        ...item,
        serviceRecordId: item.serviceRecordId ? (map.get(item.serviceRecordId) ?? null) : null,
      }));
    });

  const payments = ctx.invoices.flatMap((invoice) => invoice.payments).sort((a, b) => a.date.localeCompare(b.date));
  let receipts = 0;
  let creditNotes = 0;
  payments.forEach((payment, index) => {
    payment.id = formatId(ID_PREFIX.payment, index + 1);
    payment.receiptNumber = payment.kind === "refund" ? formatId("CN", ++creditNotes) : formatId("RCPT", ++receipts);
  });
}

export function generateClinicalRecords(random: Random, today: Dayjs, patientCount: number, bopalOpenedOn: string): ClinicalSeed {
  const ctx: Context = {
    random,
    today,
    todayISO: today.format(ISO),
    now: dayjs(),
    bookedSlots: new Set(),
    appointments: [],
    consultations: [],
    serviceRecords: [],
    invoices: [],
    counter: 0,
  };

  const profiles = buildPatientProfiles(patientCount, random);
  const patients: Patient[] = [];

  profiles.forEach((profile, index) => {
    // Registrations accelerate over the last year — the clinic is growing.
    const progress = patientCount > 1 ? index / (patientCount - 1) : 1;
    const daysAgo = Math.round(360 * Math.pow(1 - progress, 1.35));
    const registeredOn = nextWorkingDay(today.subtract(daysAgo, "day"));
    const condition = CONDITIONS.find((item) => item.key === profile.conditionKey) ?? random.pick(CONDITIONS);
    const branchId = registeredOn.format(ISO) >= bopalOpenedOn && random.chance(0.38) ? "BR-002" : "BR-001";
    const providerId = condition.key === "stroke" ? "MEM-002" : random.weighted(BRANCH_PROVIDERS[branchId]);
    const age = profile.age ?? random.int(condition.ageRange[0], condition.ageRange[1]);
    const scopeBase = { branchId, providerId };

    const patient = buildPatient(ctx, index, profile, condition, registeredOn.format(ISO), scopeBase, age);
    const scope = { ...scopeBase, patientId: patient.id };
    let result = buildEpisode(ctx, scope, registeredOn, condition, age, daysAgo > 45, "New");

    const returning = RETURN_EPISODES[index];
    if (returning) {
      const returnCondition = CONDITIONS.find((item) => item.key === returning.conditionKey) ?? condition;
      const episode = buildEpisode(ctx, scope, today.subtract(returning.daysAgo, "day"), returnCondition, age, false, "Follow-up");
      result = { ...episode, lastVisit: episode.lastVisit ?? result.lastVisit };
      patient.medical.primaryCondition = returnCondition.diagnosis;
      patient.medical.medicalHistory = `${patient.medical.medicalHistory}. Previously treated for ${condition.diagnosis}.`;
    }

    patient.status = result.outcome;
    patient.medical.currentCondition = describeCondition(result);
    patients.push(patient);
  });

  assignIds(ctx);

  return {
    patients,
    appointments: ctx.appointments,
    consultations: ctx.consultations,
    serviceRecords: ctx.serviceRecords,
    invoices: ctx.invoices,
  };
}
