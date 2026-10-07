import { delay, ensureDb } from "./db";

/** Runs a mock handler after the database is loaded, with simulated latency. */
export async function run<T>(handler: () => T | Promise<T>, latencyMs?: number): Promise<T> {
  await ensureDb();
  const result = await handler();
  return delay(result, latencyMs);
}
