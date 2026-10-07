import dayjs, { type Dayjs } from "dayjs";

import type { SupportTicket } from "@/types";

import { CLINIC_ID } from "./clinics";

export function buildSupportTickets(today: Dayjs): SupportTicket[] {
  const at = (daysAgo: number, time: string) => dayjs(`${today.subtract(daysAgo, "day").format("YYYY-MM-DD")}T${time}:00`).toISOString();
  return [
    {
      id: "TCK-0003",
      clinicId: CLINIC_ID,
      subject: "WhatsApp reminders not going to one patient",
      category: "Technical issue",
      priority: "High",
      status: "In Progress",
      createdBy: "MEM-004",
      createdByName: "Hetal Parmar",
      createdAt: at(2, "10:12"),
      updatedAt: at(1, "16:40"),
      messages: [
        { id: "m1", author: { type: "member", name: "Hetal Parmar" }, body: "Reminders for PT-0042 show as failed since yesterday. Other patients are fine.", at: at(2, "10:12") },
        { id: "m2", author: { type: "support", name: "Priya (Support)" }, body: "Thanks Hetal. The number seems to have WhatsApp disabled. Could you confirm the patient's alternate number?", at: at(1, "16:40") },
      ],
      history: [
        { at: at(2, "10:12"), text: "Ticket opened by Hetal Parmar" },
        { at: at(1, "16:40"), text: "Status changed to In Progress" },
      ],
    },
    {
      id: "TCK-0002",
      clinicId: CLINIC_ID,
      subject: "Need GST number on subscription invoice",
      category: "Billing & subscription",
      priority: "Low",
      status: "Resolved",
      createdBy: "MEM-006",
      createdByName: "Mehul Shah",
      createdAt: at(12, "11:05"),
      updatedAt: at(10, "09:20"),
      messages: [
        { id: "m1", author: { type: "member", name: "Mehul Shah" }, body: "Please add our GSTIN on the subscription invoices for input credit.", at: at(12, "11:05") },
        { id: "m2", author: { type: "support", name: "Arjun (Billing)" }, body: "Done — GSTIN 24ABCPM1234F1Z5 now appears on all invoices from this month.", at: at(10, "09:20") },
      ],
      history: [
        { at: at(12, "11:05"), text: "Ticket opened by Mehul Shah" },
        { at: at(10, "09:20"), text: "Status changed to Resolved" },
      ],
    },
    {
      id: "TCK-0001",
      clinicId: CLINIC_ID,
      subject: "How to import old patient records?",
      category: "Data & import",
      priority: "Medium",
      status: "Closed",
      createdBy: "MEM-001",
      createdByName: "Dr. Gopi Mehta",
      createdAt: at(40, "15:30"),
      updatedAt: at(35, "12:00"),
      messages: [
        { id: "m1", author: { type: "member", name: "Dr. Gopi Mehta" }, body: "We have ~600 patients in Excel from our old software. Can these be imported?", at: at(40, "15:30") },
        { id: "m2", author: { type: "support", name: "Priya (Support)" }, body: "Yes, share the file through a secure link and our onboarding team will import it within 2 working days.", at: at(39, "10:00") },
      ],
      history: [
        { at: at(40, "15:30"), text: "Ticket opened by Dr. Gopi Mehta" },
        { at: at(37, "18:00"), text: "Status changed to Resolved" },
        { at: at(35, "12:00"), text: "Status changed to Closed" },
      ],
    },
  ];
}
