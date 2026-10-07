import { isAxiosError } from "axios";

/** Normalised error thrown by every service, regardless of mock or live mode. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} was not found.`, 404);
    this.name = "NotFoundError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    return new ApiError(
      Array.isArray(message) ? message.join(", ") : (message ?? error.message),
      error.response?.status ?? 0,
      error.response?.data,
    );
  }
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError("Something went wrong. Please try again.");
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
