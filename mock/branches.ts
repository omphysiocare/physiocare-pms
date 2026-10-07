import type { Branch } from "@/types";

import { CLINIC_ID } from "./clinics";

/** Bopal opened ~150 days before "today"; dates are filled in by the seed. */
export function buildBranches(bopalOpenedOn: string): Branch[] {
  const created = "2024-04-01T09:00:00.000Z";
  return [
    {
      id: "BR-001",
      clinicId: CLINIC_ID,
      name: "Ambawadi (Main)",
      code: "AMB",
      address: "2nd Floor, Shivalik Plaza, Near IIM Road, Ambawadi",
      city: "Ahmedabad",
      phone: "+91 79 4000 1234",
      email: "care@omhealthcare.in",
      isMain: true,
      active: true,
      openedOn: "2019-06-01",
      createdAt: created,
      updatedAt: created,
    },
    {
      id: "BR-002",
      clinicId: CLINIC_ID,
      name: "Bopal",
      code: "BOP",
      address: "Shop 12, Sun Avenue, Bopal–Ghuma Road, Bopal",
      city: "Ahmedabad",
      phone: "+91 79 4000 5678",
      email: "bopal@omhealthcare.in",
      isMain: false,
      active: true,
      openedOn: bopalOpenedOn,
      createdAt: `${bopalOpenedOn}T09:00:00.000Z`,
      updatedAt: `${bopalOpenedOn}T09:00:00.000Z`,
    },
  ];
}

export const BRANCH_LOCATIONS: Record<string, string[]> = {
  "BR-001": ["Room 1", "Room 2", "Rehab Gym"],
  "BR-002": ["Room A", "Room B"],
};
