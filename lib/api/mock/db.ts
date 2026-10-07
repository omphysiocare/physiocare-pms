import dayjs from "dayjs";

import { createSeedData, type MockDatabase } from "@/mock";

import { deleteValue, readValue, writeValue } from "./storage";

const STORAGE_KEY = "mock-db:v2";
const LATENCY_MS = 220;

interface StoredDatabase {
  seededOn: string;
  modified: boolean;
  data: MockDatabase;
}

let state: StoredDatabase | null = null;
let loading: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function freshState(): StoredDatabase {
  return { seededOn: dayjs().format("YYYY-MM-DD"), modified: false, data: createSeedData() };
}

async function load(): Promise<void> {
  try {
    const stored = await readValue<StoredDatabase>(STORAGE_KEY);
    // Untouched demo data is regenerated daily so "today" stays meaningful.
    const stale = stored && !stored.modified && stored.seededOn !== dayjs().format("YYYY-MM-DD");
    state = stored?.data?.clinic && !stale ? stored : freshState();
  } catch {
    state = freshState();
  }
}

/** Loads the mock database once (from IndexedDB, or a fresh seed). Every mock service awaits this. */
export function ensureDb(): Promise<void> {
  if (state) return Promise.resolve();
  loading ??= load();
  return loading;
}

/** Synchronous access for helpers; only valid after `ensureDb()` resolved. */
export function getDb(): MockDatabase {
  if (!state) state = freshState();
  return state.data;
}

/** Marks the data as changed and persists it (debounced). */
export function commit(): void {
  if (!state) return;
  state.modified = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (state) void writeValue(STORAGE_KEY, state).catch(() => undefined);
  }, 250);
}

/** Restores the original demo dataset. */
export async function resetDb(): Promise<void> {
  state = freshState();
  loading = null;
  await deleteValue(STORAGE_KEY).catch(() => undefined);
}

/** Resolves after simulated network latency with a detached copy of the value. */
export async function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return structuredClone(value);
}

export function nowISO(): string {
  return new Date().toISOString();
}
