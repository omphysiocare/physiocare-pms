import dayjs, { type Dayjs } from "dayjs";

import type { ISODate } from "@/types";

export const ISO_FORMAT = "YYYY-MM-DD";

export function today(): ISODate {
  return dayjs().format(ISO_FORMAT);
}

export function toISODate(date: Dayjs | Date | string): ISODate {
  return dayjs(date).format(ISO_FORMAT);
}

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

export const PERIOD_PRESETS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "custom", label: "Custom Range" },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["value"];

/** Resolves a reporting period preset to an inclusive date range. */
export function resolvePeriod(preset: PeriodPreset, custom?: Partial<DateRange>): DateRange {
  const now = dayjs();
  switch (preset) {
    case "today":
      return { from: toISODate(now), to: toISODate(now) };
    case "this_week": {
      // Weeks start on Monday.
      const start = now.subtract((now.day() + 6) % 7, "day");
      return { from: toISODate(start), to: toISODate(start.add(6, "day")) };
    }
    case "this_month":
      return { from: toISODate(now.startOf("month")), to: toISODate(now.endOf("month")) };
    case "last_month": {
      const last = now.subtract(1, "month");
      return { from: toISODate(last.startOf("month")), to: toISODate(last.endOf("month")) };
    }
    case "last_12_months":
      return {
        from: toISODate(now.subtract(11, "month").startOf("month")),
        to: toISODate(now.endOf("month")),
      };
    case "custom": {
      const from = custom?.from || toISODate(now.startOf("month"));
      const to = custom?.to || toISODate(now);
      return from <= to ? { from, to } : { from: to, to: from };
    }
  }
}

/** Limits a range so it never extends past today (reports only cover elapsed time). */
export function capAtToday(range: DateRange): DateRange {
  const now = today();
  if (range.from > now) return { from: now, to: now };
  return { from: range.from, to: range.to > now ? now : range.to };
}

/**
 * Comparison period for a range. Ranges starting on the 1st compare with the
 * same dates of the previous month(s); others shift back by their own length.
 */
export function previousRange(range: DateRange): DateRange {
  const start = dayjs(range.from);
  if (start.date() === 1) {
    const months = Math.max(1, dayjs(range.to).diff(start, "month") + 1);
    const end = dayjs(range.to);
    const prevStart = start.subtract(months, "month");
    const shiftedEnd = end.subtract(months, "month");
    // Whole months compare with whole months (e.g. Sep 1–30 vs Aug 1–31).
    const prevEnd = end.isSame(end.endOf("month"), "day") ? shiftedEnd.endOf("month") : shiftedEnd;
    return { from: toISODate(prevStart), to: toISODate(prevEnd) };
  }
  const length = dayjs(range.to).diff(start, "day") + 1;
  // Partial weeks starting Monday compare with the same weekdays of last week.
  if (start.day() === 1 && length < 7) {
    return { from: toISODate(start.subtract(7, "day")), to: toISODate(dayjs(range.to).subtract(7, "day")) };
  }
  const days = dayjs(range.to).diff(dayjs(range.from), "day") + 1;
  return {
    from: toISODate(dayjs(range.from).subtract(days, "day")),
    to: toISODate(dayjs(range.from).subtract(1, "day")),
  };
}

export function isWithin(date: ISODate, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/** Filters used by list pages for date columns. */
export const DATE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "custom", label: "Specific date" },
] as const;

export type DateFilter = (typeof DATE_FILTERS)[number]["value"];

export function matchesDateFilter(date: ISODate, filter: DateFilter, specificDate?: ISODate): boolean {
  const now = today();
  switch (filter) {
    case "all":
      return true;
    case "today":
      return date === now;
    case "tomorrow":
      return date === toISODate(dayjs().add(1, "day"));
    case "this_week":
      return isWithin(date, resolvePeriod("this_week"));
    case "this_month":
      return isWithin(date, resolvePeriod("this_month"));
    case "upcoming":
      return date >= now;
    case "past":
      return date < now;
    case "custom":
      return !specificDate || date === specificDate;
  }
}

export type Granularity = "day" | "week" | "month";

export interface TimeBucket {
  key: string;
  label: string;
  from: ISODate;
  to: ISODate;
}

/** Splits a range into chart buckets with a granularity suited to its length. */
export function bucketRange(range: DateRange): TimeBucket[] {
  const start = dayjs(range.from);
  const end = dayjs(range.to);
  const days = end.diff(start, "day") + 1;
  const granularity: Granularity = days <= 31 ? "day" : days <= 120 ? "week" : "month";
  const buckets: TimeBucket[] = [];

  let cursor = granularity === "month" ? start.startOf("month") : start;
  while (!cursor.isAfter(end)) {
    const next =
      granularity === "day"
        ? cursor
        : granularity === "week"
          ? cursor.add(6, "day")
          : cursor.endOf("month");
    const bucketEnd = next.isAfter(end) ? end : next;
    const bucketStart = cursor.isBefore(start) ? start : cursor;
    buckets.push({
      key: toISODate(cursor),
      label:
        granularity === "day"
          ? cursor.format("DD MMM")
          : granularity === "week"
            ? `${bucketStart.format("DD MMM")}`
            : cursor.format("MMM YY"),
      from: toISODate(bucketStart),
      to: toISODate(bucketEnd),
    });
    cursor = granularity === "month" ? cursor.add(1, "month").startOf("month") : bucketEnd.add(1, "day");
  }
  return buckets;
}
