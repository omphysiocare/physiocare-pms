import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import type { ISODate } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/** Short currency label for chart axes, e.g. ₹1.2L. */
export function formatCurrencyCompact(amount: number): string {
  return `₹${compactFormatter.format(amount)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export function formatDate(date: ISODate | null | undefined, format = "DD MMM YYYY"): string {
  if (!date) return "—";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format(format) : "—";
}

export function formatDateTime(date: string | null | undefined): string {
  return formatDate(date, "DD MMM YYYY, hh:mm A");
}

/** Formats a `HH:mm` string as `hh:mm A`. */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  const [hours, minutes] = time.split(":").map(Number);
  return dayjs().hour(hours).minute(minutes).format("hh:mm A");
}

export function formatRelativeDay(date: ISODate): string {
  const diff = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDate(date);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  return dayjs().hour(hours).minute(mins).add(minutes, "minute").format("HH:mm");
}

export function getInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function calculateAge(dateOfBirth: ISODate): number {
  return dayjs().diff(dayjs(dateOfBirth), "year");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Percentage change between two values, or null if not computable. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** "3 hours ago", "in 2 days". */
export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return "—";
  return dayjs(date).fromNow();
}
