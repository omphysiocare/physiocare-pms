/** Builds the next sequential, zero-padded ID for a prefix, e.g. `PT-0042`. */
export function nextId(prefix: string, existingIds: readonly string[], width = 4): string {
  const max = existingIds.reduce((highest, id) => {
    const value = Number(id.slice(prefix.length + 1));
    return Number.isFinite(value) && value > highest ? value : highest;
  }, 0);
  return formatId(prefix, max + 1, width);
}

export function formatId(prefix: string, value: number, width = 4): string {
  return `${prefix}-${String(value).padStart(width, "0")}`;
}

export const ID_PREFIX = {
  patient: "PT",
  member: "MEM",
  branch: "BR",
  service: "SVC",
  appointment: "APT",
  consultation: "CON",
  serviceRecord: "SR",
  invoice: "INV",
  payment: "PAY",
  receipt: "RCPT",
  creditNote: "CN",
  expense: "EXP",
  message: "MSG",
  activity: "ACT",
  ticket: "TCK",
  document: "DOC",
  note: "NOTE",
} as const;
