import dayjs, { type Dayjs } from "dayjs";

import { formatId, ID_PREFIX } from "@/lib/ids";

import { CLINIC_ID } from "./clinics";
import type { Random } from "@/lib/random";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/types";

const ISO = "YYYY-MM-DD";

type ExpenseDraft = Omit<Expense, "id" | "clinicId" | "createdAt" | "updatedAt" | "status" | "notes" | "reference" | "archived"> & {
  notes?: string;
};

const SUPPLY_ITEMS = [
  { description: "Kinesio tapes & electrode pads", vendor: "Medisure Surgicals" },
  { description: "Ultrasound gel & disposable couch sheets", vendor: "Medisure Surgicals" },
  { description: "Dry needles (box of 500)", vendor: "PhysioMart India" },
  { description: "Therabands, exercise balls & weights", vendor: "PhysioMart India" },
  { description: "Hot packs & cold gel packs", vendor: "Shree Medical Agency" },
  { description: "Sanitiser, gloves & masks", vendor: "Shree Medical Agency" },
];

const MAINTENANCE_ITEMS = [
  { description: "AC servicing (3 units)", vendor: "CoolCare Services", range: [2400, 3600] },
  { description: "IFT & TENS machine calibration", vendor: "Electro Medical Services", range: [2500, 4500] },
  { description: "Plumbing repair — washroom", vendor: "Local contractor", range: [900, 1800] },
  { description: "Treatment couch upholstery repair", vendor: "Comfort Furnishers", range: [1500, 3000] },
];

const MARKETING_ITEMS = [
  { description: "Google Ads campaign", vendor: "Google India", range: [3000, 6000] },
  { description: "Instagram & Facebook promotion", vendor: "Meta Platforms", range: [2000, 4500] },
  { description: "Pamphlet & visiting card printing", vendor: "Rang Printers", range: [1500, 3500] },
  { description: "Free posture-screening camp", vendor: "Society event", range: [2500, 5000] },
];

const EQUIPMENT = [
  { monthsAgo: 10, description: "Interferential therapy (IFT) machine", vendor: "Electro Medical Services", amount: 42000 },
  { monthsAgo: 6, description: "Hi-lo electric treatment couch", vendor: "Comfort Furnishers", amount: 24500 },
  { monthsAgo: 3, description: "Shoulder wheel, pulley & parallel bars", vendor: "PhysioMart India", amount: 11800 },
  { monthsAgo: 1, description: "Therapeutic ultrasound unit (1 & 3 MHz)", vendor: "Electro Medical Services", amount: 28500 },
];

function reference(method: PaymentMethod, random: Random): string {
  switch (method) {
    case "UPI":
      return `UPI${random.int(100000000, 999999999)}`;
    case "Bank Transfer":
      return `NEFT${random.int(10000000, 99999999)}`;
    case "Card":
      return `XXXX-${random.int(1000, 9999)}`;
    case "Cheque":
      return `CHQ ${random.int(100000, 999999)}`;
    default:
      return "";
  }
}

export function generateExpenses(random: Random, today: Dayjs, bopalOpenedOn: string): Expense[] {
  const drafts: ExpenseDraft[] = [];
  const add = (
    date: Dayjs,
    category: ExpenseCategory,
    description: string,
    vendor: string,
    amount: number,
    paymentMethod: PaymentMethod,
    paidBy = "Dr. Gopi Mehta",
    branchId = "BR-001",
  ) => {
    if (date.isAfter(today, "day")) return;
    if (branchId === "BR-002" && date.format(ISO) < bopalOpenedOn) return;
    drafts.push({
      branchId,
      date: date.format(ISO),
      category,
      description,
      vendor,
      amount: Math.round(amount),
      paymentMethod,
      paidBy,
    });
  };

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo -= 1) {
    const month = today.subtract(monthsAgo, "month").startOf("month");
    const label = month.format("MMMM YYYY");
    const summer = [3, 4, 5].includes(month.month());

    add(month, "Rent", `Clinic rent — ${label}`, "Shivalik Estates", 18000, "Bank Transfer");
    add(month.add(1, "day"), "Staff Salary", `Salary — Hetal Parmar (Front Desk), ${label}`, "Hetal Parmar", 14000, "Bank Transfer");
    add(month.add(1, "day"), "Staff Salary", `Salary — Dr. Kavya Iyer, ${label}`, "Dr. Kavya Iyer", 22000, "Bank Transfer", "Dr. Gopi Mehta", monthsAgo <= 4 ? "BR-002" : "BR-001");
    if (monthsAgo <= 7) {
      add(month.add(2, "day"), "Staff Salary", `Consultant retainer — Dr. Nirav Desai, ${label}`, "Dr. Nirav Desai", 15000, "Bank Transfer");
    }
    add(
      month.add(random.int(8, 12), "day"),
      "Electricity",
      `Electricity bill — ${label}`,
      "Torrent Power",
      summer ? random.int(5200, 6800) : random.int(3100, 4400),
      "UPI",
      "Hetal Parmar",
    );
    add(month.add(4, "day"), "Internet", `Broadband & phone — ${label}`, "Airtel Business", 1299, "UPI", "Hetal Parmar");
    add(month.add(5, "day"), "Software", `Practice management subscription — ${label}`, "PMS (Professional plan)", monthsAgo >= 6 ? 999 : 2499, "Card");
    // Bopal branch running costs
    add(month.add(1, "day"), "Rent", `Bopal clinic rent — ${label}`, "Sun Avenue Properties", 12000, "Bank Transfer", "Dr. Gopi Mehta", "BR-002");
    add(month.add(2, "day"), "Staff Salary", `Salary — Sneha Rathod (Front Desk, Bopal), ${label}`, "Sneha Rathod", 12000, "Bank Transfer", "Dr. Gopi Mehta", "BR-002");
    add(month.add(random.int(8, 12), "day"), "Electricity", `Electricity bill (Bopal) — ${label}`, "Torrent Power", random.int(1800, 2900), "UPI", "Sneha Rathod", "BR-002");
    add(month.add(4, "day"), "Internet", `Broadband (Bopal) — ${label}`, "JioFiber", 999, "UPI", "Sneha Rathod", "BR-002");
    if (random.chance(0.5)) {
      add(month.add(random.int(6, 24), "day"), "Office Supplies", random.pick(["Printer paper & toner", "Stationery & files", "Appointment cards"]), "Shree Stationers", random.int(450, 1800), "Cash", "Hetal Parmar");
    }
    if (month.month() === 3) {
      add(month.add(10, "day"), "Insurance", "Professional indemnity & clinic insurance (annual)", "New India Assurance", 18500, "Bank Transfer");
    }
    add(month.add(random.int(14, 18), "day"), "Other", "Housekeeping & pantry supplies", "D-Mart", random.int(800, 1600), "Cash", "Hetal Parmar");

    const supplyCount = random.int(1, 2);
    for (let i = 0; i < supplyCount; i += 1) {
      const item = random.pick(SUPPLY_ITEMS);
      add(month.add(random.int(3, 25), "day"), "Medical Supplies", item.description, item.vendor, random.int(1800, 5200), random.pick(["UPI", "Cash", "Card"] as const));
    }
    if (random.chance(0.45)) {
      const item = random.pick(MAINTENANCE_ITEMS);
      add(month.add(random.int(5, 26), "day"), "Maintenance", item.description, item.vendor, random.int(item.range[0], item.range[1]), random.pick(["Cash", "UPI"] as const));
    }
    if (random.chance(0.6)) {
      const item = random.pick(MARKETING_ITEMS);
      add(month.add(random.int(5, 26), "day"), "Marketing", item.description, item.vendor, random.int(item.range[0], item.range[1]), "Card");
    }
    const equipment = EQUIPMENT.find((entry) => entry.monthsAgo === monthsAgo);
    if (equipment) {
      add(month.add(random.int(6, 20), "day"), "Equipment", equipment.description, equipment.vendor, equipment.amount, "Bank Transfer");
    }
  }

  return drafts
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((draft, index) => {
      const age = today.diff(dayjs(draft.date), "day");
      const status = age <= 6 && random.chance(0.35) ? "Pending" : "Paid";
      const created = dayjs(`${draft.date}T11:00:00`).toISOString();
      return {
        ...draft,
        id: formatId(ID_PREFIX.expense, index + 1),
        reference: status === "Paid" ? reference(draft.paymentMethod, random) : "",
        clinicId: CLINIC_ID,
        status,
        archived: false,
        notes: status === "Pending" ? "Payment due — awaiting bill verification." : (draft.notes ?? ""),
        createdAt: created,
        updatedAt: created,
      } satisfies Expense;
    });
}
