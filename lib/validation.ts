import { z } from "zod";

/** Reusable Zod building blocks so every form validates the same way. */

export const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

export const optionalText = (max = 1000) => z.string().trim().max(max, `Must be at most ${max} characters`);

export const phoneNumber = (label = "Mobile number") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => /^(\+?91[\s-]?)?[6-9]\d{4}\s?\d{5}$/.test(value), "Enter a valid 10-digit Indian mobile number");

export const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address");

export const isoDate = (label = "Date") =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} is invalid`);

export const timeOfDay = (label = "Time") =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^\d{2}:\d{2}$/, `${label} is invalid`);

export const requiredNumber = (label: string, { min, max, integer }: { min?: number; max?: number; integer?: boolean } = {}) => {
  let schema = z.number({
    error: (issue) => (issue.input === undefined || issue.input === null ? `${label} is required` : `${label} must be a number`),
  });
  if (integer) schema = schema.int(`${label} must be a whole number`);
  if (min !== undefined) schema = schema.min(min, `${label} must be at least ${min}`);
  if (max !== undefined) schema = schema.max(max, `${label} must be at most ${max}`);
  return schema;
};

export const selectOne = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `Select a ${label.toLowerCase()}` });
