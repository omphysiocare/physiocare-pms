import { NotFoundError } from "@/lib/api/errors";
import { nextId } from "@/lib/ids";
import type { BaseEntity } from "@/types";

import { commit, getDb, nowISO } from "./db";

export function findOrThrow<T extends { id: string }>(list: T[], id: string, resource: string): T {
  const item = list.find((entry) => entry.id === id);
  if (!item) throw new NotFoundError(resource, id);
  return item;
}

/** Inserts a record with a sequential ID; clinicId comes from the session's clinic. */
export function insertRecord<T extends BaseEntity>(list: T[], prefix: string, input: object, width = 4): T {
  const timestamp = nowISO();
  const record = {
    ...input,
    clinicId: getDb().clinic.id,
    id: nextId(prefix, list.map((item) => item.id), width),
    createdAt: timestamp,
    updatedAt: timestamp,
  } as unknown as T;
  list.push(record);
  commit();
  return record;
}

export function updateRecord<T extends BaseEntity>(list: T[], id: string, input: Partial<T>, resource: string): T {
  const record = findOrThrow(list, id, resource);
  Object.assign(record, input, { id, updatedAt: nowISO() });
  commit();
  return record;
}

export function removeRecord<T extends { id: string }>(list: T[], id: string, resource: string): T {
  const index = list.findIndex((entry) => entry.id === id);
  if (index === -1) throw new NotFoundError(resource, id);
  const [removed] = list.splice(index, 1);
  commit();
  return removed;
}

/** Branch scope: "all" (or undefined) means consolidated. */
export function inBranch(branchId: string | undefined, recordBranchId: string): boolean {
  return !branchId || branchId === "all" || branchId === recordBranchId;
}
