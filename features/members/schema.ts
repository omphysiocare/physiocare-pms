import { z } from "zod";

import { today } from "@/lib/dates";
import { isoDate, optionalText, phoneNumber, requiredText, selectOne } from "@/lib/validation";
import type { MemberInput } from "@/services/memberService";
import { MEMBER_ROLES, MEMBER_STATUSES, SPECIALTY_IDS, type Member } from "@/types";

export const memberSchema = z.object({
  name: requiredText("Name", 80),
  email: z.email("Enter a valid email address"),
  mobile: phoneNumber(),
  role: selectOne(MEMBER_ROLES, "Role"),
  specialty: z.union([z.enum(SPECIALTY_IDS), z.literal("")]),
  designation: optionalText(80),
  qualification: optionalText(120),
  registrationNumber: optionalText(60),
  joiningDate: isoDate("Joining date"),
  status: selectOne(MEMBER_STATUSES, "Status"),
  branchIds: z.array(z.string()).min(1, "Assign at least one branch"),
  isProvider: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

export const MEMBER_COLORS = ["#2a78d6", "#1baf7a", "#eb6834", "#4a3aa7", "#e87ba4", "#eda100", "#008300", "#e34948"];

export function emptyMemberValues(branchIds: string[]): MemberFormValues {
  return { name: "", email: "", mobile: "", role: "Doctor", specialty: "", designation: "", qualification: "", registrationNumber: "", joiningDate: today(), status: "Invited", branchIds, isProvider: true, color: MEMBER_COLORS[3] };
}

export function memberToFormValues(member: Member): MemberFormValues {
  const { name, email, mobile, role, specialty, designation, qualification, registrationNumber, joiningDate, status, branchIds, isProvider, color } = member;
  return { name, email, mobile, role, specialty, designation, qualification, registrationNumber, joiningDate, status, branchIds: [...branchIds], isProvider, color };
}

export function formValuesToMemberInput(values: MemberFormValues): MemberInput {
  return { ...values };
}
