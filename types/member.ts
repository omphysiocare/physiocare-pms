import type { MemberRole } from "./auth";
import type { BaseEntity, ISODate, ISODateTime } from "./common";
import type { SpecialtyId } from "./specialty";

export const MEMBER_STATUSES = ["Active", "Invited", "Inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export interface Member extends BaseEntity {
  clinicId: string;
  name: string;
  email: string;
  mobile: string;
  role: MemberRole;
  specialty: SpecialtyId | "";
  designation: string;
  qualification: string;
  registrationNumber: string;
  joiningDate: ISODate;
  status: MemberStatus;
  branchIds: string[];
  /** Providers can be booked for appointments and perform clinical services. */
  isProvider: boolean;
  /** Calendar colour. */
  color: string;
  lastActiveAt: ISODateTime | null;
}
