import axios from "axios";

import { API_BASE_URL } from "./config";
import { toApiError } from "./errors";

const TOKEN_STORAGE_KEY = "physio-pms:access-token";

/** Shared Axios instance for the NestJS backend. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

/** Typed helpers that unwrap `response.data`. */
export const http = {
  get: <T>(url: string, params?: object) => apiClient.get<T>(url, { params }).then((res) => res.data),
  post: <T>(url: string, body?: unknown) => apiClient.post<T>(url, body).then((res) => res.data),
  patch: <T>(url: string, body?: unknown) => apiClient.patch<T>(url, body).then((res) => res.data),
  put: <T>(url: string, body?: unknown) => apiClient.put<T>(url, body).then((res) => res.data),
  delete: <T = void>(url: string) => apiClient.delete<T>(url).then((res) => res.data),
};
