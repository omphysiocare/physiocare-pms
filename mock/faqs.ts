import type { Faq } from "@/types";

const faq = (id: number, category: Faq["category"], question: string, answer: string): Faq => ({ id: `FAQ-${String(id).padStart(3, "0")}`, category, question, answer });

export const FAQS_SEED: Faq[] = [
  faq(1, "Getting started", "How do I set up my clinic for the first time?", "Go to Clinic → Profile to add your clinic name, logo, address and specialty. Then add branches, working hours and your clinical services catalog. Finally invite your team from Members."),
  faq(2, "Getting started", "Can I use the PMS for any medical specialty?", "Yes. Choose your primary specialty under Clinic → Specialty. Terminology (e.g. Treatments vs Procedures), appointment types, consultation templates and default services adapt automatically. Multi-specialty clinics can enable several specialties."),
  faq(3, "Getting started", "How do I switch between branches?", "Use the branch selector in the top bar. Choose “All branches” for a consolidated view or a specific branch to see only its patients, appointments, billing and reports."),
  faq(4, "Patients", "How do I register a new patient?", "Open Patients → Add Patient. Mobile number, name, date of birth and emergency contact are required. You can attach documents and record consent from the patient profile afterwards."),
  faq(5, "Patients", "Can I upload reports and X-rays?", "Yes. Open the patient profile → Documents → Upload. Files are categorised (Report, Imaging, Prescription…) and available to everyone with patient access."),
  faq(6, "Patients", "Why can't I delete a patient?", "Patients with appointments, clinical records or invoices cannot be deleted to protect medical and financial history. Mark them Inactive instead."),
  faq(7, "Appointments", "How do I send an appointment confirmation on WhatsApp?", "Open the appointment and click “Send WhatsApp”. The confirmation is generated from your clinic's template with the patient name, date, time and provider. You can also pick reminder, reschedule or cancellation messages from the dropdown."),
  faq(8, "Appointments", "What is the difference between Cancelled and No Show?", "Cancelled means the visit was called off in advance. No Show means the patient did not turn up without notice. Both are tracked separately in the Appointment report."),
  faq(9, "Appointments", "How does check-in work?", "When the patient arrives, click Check In. When the provider starts, click Start Consultation, and Complete when done. Each step is recorded in the activity log."),
  faq(10, "Consultations", "Can I customise the consultation form for my specialty?", "Consultations include universal sections (history, vitals, examination, diagnosis, plan) plus a specialty template — e.g. pain scale and ROM for physiotherapy or tooth findings for dental."),
  faq(11, "Consultations", "How do I print a prescription?", "Open the consultation and click Print. Only the prescription document with your clinic letterhead and provider signature is printed — no app buttons or navigation."),
  faq(12, "Billing", "How do I record a partial payment?", "Open the invoice and click Record Payment. Enter the amount received; the invoice becomes Partially Paid and the balance is tracked in the Outstanding report."),
  faq(13, "Billing", "How do refunds work?", "Users with the billing.refund permission can refund a paid amount from the invoice page. A credit note number is generated and the invoice status updates to Refunded when fully refunded."),
  faq(14, "Billing", "Can I send the invoice to the patient on WhatsApp?", "Yes. Click “Send Invoice on WhatsApp” on the invoice page. A branded PDF is generated and sent with a message. Receipts can be sent from each payment row."),
  faq(15, "Reports", "Which reports are available?", "Daily, Patients, Appointments, Consultations, Services, Payments, Revenue, Expenses, Profit & Loss, Members, Referrals, Branches, Outstanding and Activity/Audit — each with filters, print, PDF and CSV export."),
  faq(16, "Reports", "Does CSV export include my filters?", "Yes. Exports contain exactly the rows shown for the selected date range, branch and filters."),
  faq(17, "Members", "How do I invite a team member?", "Go to Members → Invite Member, enter their email, role and branches. They appear as Invited until they accept."),
  faq(18, "Permissions", "Can I change what a role can do?", "Yes. Go to Permissions, pick a role and toggle permissions. The Owner role always has full access."),
  faq(19, "Subscription", "How do I upgrade my plan?", "Go to Subscription and choose Upgrade on the plan you want. The change is applied immediately and pro-rated on your next invoice."),
  faq(20, "Clinic settings", "Where do I change invoice branding?", "Clinic → Billing & Branding lets you set invoice prefix, footer, terms, accent colour and signature label used on invoices, receipts, prescriptions and reports."),
];
