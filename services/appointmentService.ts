import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb, nowISO } from "@/lib/api/mock/db";
import { assertProvider, findPatient, lastMessageIndex, patientName, withAppointmentRelations } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { formatDate, formatTime } from "@/lib/format";
import { ID_PREFIX } from "@/lib/ids";
import { ACTIVE_APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus, type AppointmentWithRelations, type CreateInput } from "@/types";

import { scopeMatches, type PatientScopedFilters } from "./types";

export type AppointmentInput = Omit<CreateInput<Appointment>, "checkedInAt" | "rescheduledFrom">;

export interface RescheduleInput {
  date: string;
  startTime: string;
  endTime: string;
  providerId: string;
  reason: string;
}

export interface AppointmentService {
  list(filters?: PatientScopedFilters): Promise<AppointmentWithRelations[]>;
  get(id: string): Promise<AppointmentWithRelations>;
  create(input: AppointmentInput): Promise<Appointment>;
  update(id: string, input: AppointmentInput): Promise<Appointment>;
  updateStatus(id: string, status: AppointmentStatus, reason?: string): Promise<Appointment>;
  reschedule(id: string, input: RescheduleInput): Promise<Appointment>;
  remove(id: string): Promise<void>;
}

const RESOURCE = "Appointment";

/** Allowed lifecycle transitions — the backend should enforce the same table. */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  Scheduled: ["Confirmed", "Checked In", "Cancelled", "No Show", "Rescheduled"],
  Confirmed: ["Checked In", "Cancelled", "No Show", "Rescheduled"],
  Rescheduled: ["Confirmed", "Checked In", "Cancelled", "No Show", "Rescheduled"],
  "Checked In": ["In Consultation", "Completed", "Cancelled"],
  "In Consultation": ["Completed"],
  Completed: [],
  Cancelled: ["Scheduled"],
  "No Show": ["Scheduled"],
};

function assertNoConflict(input: Pick<Appointment, "providerId" | "date" | "startTime" | "endTime" | "status">, ignoreId?: string): void {
  const db = getDb();
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(input.status) || db.clinic.appointmentSettings.allowOverlapping) return;
  if (input.endTime <= input.startTime) throw new ApiError("End time must be after start time.", 400);
  const conflict = db.appointments.find(
    (item) =>
      item.id !== ignoreId &&
      item.providerId === input.providerId &&
      item.date === input.date &&
      ACTIVE_APPOINTMENT_STATUSES.includes(item.status) &&
      item.startTime < input.endTime &&
      item.endTime > input.startTime,
  );
  if (conflict) {
    throw new ApiError(`The provider already has appointment ${conflict.id} from ${formatTime(conflict.startTime)} to ${formatTime(conflict.endTime)} on this date.`, 409);
  }
}

function assertWorkingDay(date: string): void {
  const holiday = getDb().clinic.holidays.find((item) => item.date === date);
  if (holiday) throw new ApiError(`The clinic is closed on ${formatDate(date)} (${holiday.name}).`, 409);
}

const mockAppointmentService: AppointmentService = {
  list: (filters) =>
    run(() => {
      const messages = lastMessageIndex("appointment");
      return getDb()
        .appointments.filter((item) => scopeMatches(filters, item))
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
        .map((item) => withAppointmentRelations(item, messages));
    }),
  get: (id) => run(() => withAppointmentRelations(findOrThrow(getDb().appointments, id, RESOURCE))),
  create: (input) =>
    run(() => {
      const patient = findPatient(input.patientId);
      assertProvider(input.providerId);
      assertWorkingDay(input.date);
      assertNoConflict(input);
      const appointment = insertRecord<Appointment>(getDb().appointments, ID_PREFIX.appointment, {
        ...input,
        checkedInAt: input.status === "Checked In" ? nowISO() : null,
        rescheduledFrom: null,
      });
      logActivity("created", "Appointments", appointment.id, `Booked ${appointment.type.toLowerCase()} for ${patientName(patient)} on ${formatDate(input.date)}`, appointment.branchId);
      return appointment;
    }),
  update: (id, input) =>
    run(() => {
      findPatient(input.patientId);
      assertProvider(input.providerId);
      assertNoConflict(input, id);
      const appointment = updateRecord(getDb().appointments, id, input, RESOURCE);
      logActivity("updated", "Appointments", id, "Updated appointment details", appointment.branchId);
      return appointment;
    }),
  updateStatus: (id, status, reason = "") =>
    run(() => {
      const db = getDb();
      const current = findOrThrow(db.appointments, id, RESOURCE);
      if (!APPOINTMENT_TRANSITIONS[current.status].includes(status)) {
        throw new ApiError(`An appointment that is ${current.status} cannot be marked as ${status}.`, 409);
      }
      if (status === "Scheduled") assertNoConflict({ ...current, status }, id);
      const patch: Partial<Appointment> = { status };
      if (status === "Checked In") patch.checkedInAt = nowISO();
      if (status === "Cancelled") patch.cancellationReason = reason;
      const appointment = updateRecord(db.appointments, id, patch, RESOURCE);
      // Keep the linked service record in step with the visit.
      const record = db.serviceRecords.find((item) => item.appointmentId === id);
      if (record && record.status !== "Completed") {
        if (status === "In Consultation") record.status = "In Progress";
        if (status === "Completed") record.status = "Completed";
        if (status === "Cancelled" || status === "No Show") record.status = "Cancelled";
        if (status === "Scheduled") record.status = "Scheduled";
      }
      logActivity("status_changed", "Appointments", id, `Marked appointment for ${patientName(findPatient(current.patientId))} as ${status}${reason ? ` (${reason})` : ""}`, appointment.branchId);
      return appointment;
    }),
  reschedule: (id, input) =>
    run(() => {
      const db = getDb();
      const current = findOrThrow(db.appointments, id, RESOURCE);
      if (!APPOINTMENT_TRANSITIONS[current.status].includes("Rescheduled")) {
        throw new ApiError(`An appointment that is ${current.status} cannot be rescheduled.`, 409);
      }
      assertProvider(input.providerId);
      assertWorkingDay(input.date);
      assertNoConflict({ ...input, status: "Rescheduled" }, id);
      const appointment = updateRecord(db.appointments, id, {
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        providerId: input.providerId,
        status: "Rescheduled",
        rescheduledFrom: { date: current.date, startTime: current.startTime },
        notes: input.reason ? `${current.notes ? `${current.notes}\n` : ""}Rescheduled: ${input.reason}` : current.notes,
      }, RESOURCE);
      const record = db.serviceRecords.find((item) => item.appointmentId === id && item.status === "Scheduled");
      if (record) Object.assign(record, { date: input.date, startTime: input.startTime, providerId: input.providerId });
      logActivity("updated", "Appointments", id, `Rescheduled from ${formatDate(current.date)} ${formatTime(current.startTime)} to ${formatDate(input.date)} ${formatTime(input.startTime)}`, appointment.branchId);
      return appointment;
    }),
  remove: (id) =>
    run(() => {
      const db = getDb();
      if (db.invoices.some((invoice) => invoice.appointmentId === id && !invoice.cancelled)) {
        throw new ApiError("This appointment is linked to an invoice. Cancel the appointment instead of deleting it.", 409);
      }
      const removed = removeRecord(db.appointments, id, RESOURCE);
      db.serviceRecords.forEach((item) => item.appointmentId === id && (item.appointmentId = null));
      db.consultations.forEach((item) => item.appointmentId === id && (item.appointmentId = null));
      logActivity("deleted", "Appointments", id, "Deleted appointment", removed.branchId);
    }),
};

const httpAppointmentService: AppointmentService = {
  list: (filters) => http.get<AppointmentWithRelations[]>("/appointments", filters),
  get: (id) => http.get<AppointmentWithRelations>(`/appointments/${id}`),
  create: (input) => http.post<Appointment>("/appointments", input),
  update: (id, input) => http.put<Appointment>(`/appointments/${id}`, input),
  updateStatus: (id, status, reason) => http.patch<Appointment>(`/appointments/${id}/status`, { status, reason }),
  reschedule: (id, input) => http.post<Appointment>(`/appointments/${id}/reschedule`, input),
  remove: (id) => http.delete(`/appointments/${id}`),
};

export const appointmentService = isMockApi ? mockAppointmentService : httpAppointmentService;
