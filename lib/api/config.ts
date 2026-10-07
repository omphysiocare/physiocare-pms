/**
 * `mock` serves data from the in-browser mock database.
 * `live` sends requests to the backend at NEXT_PUBLIC_API_URL (NestJS).
 */
export type ApiMode = "mock" | "live";

export const API_MODE: ApiMode = process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const isMockApi = API_MODE === "mock";
