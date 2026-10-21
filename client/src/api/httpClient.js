import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Extracts payload data from the standard success envelope: { data: T }
 */
export function extractApiData(response) {
  return response?.data?.data !== undefined
    ? response.data.data
    : response?.data;
}

/**
 * Normalizes error responses from the standard error envelope:
 * { error: { code, message, details } }
 */
export function extractApiError(error) {
  if (error.response?.data?.error) {
    const { code, message, details } = error.response.data.error;
    const normalizedError = new Error(
      message || "An unexpected error occurred.",
    );
    normalizedError.code = code || "UNKNOWN_ERROR";
    normalizedError.details = details ?? null;
    normalizedError.status = error.response.status;
    return normalizedError;
  }

  const fallbackError = new Error(
    error.message || "Network communication failed.",
  );
  fallbackError.code = "NETWORK_ERROR";
  fallbackError.details = null;
  fallbackError.status = error.response?.status ?? 500;
  return fallbackError;
}
apiClient.interceptors.response.use(
  (response) => extractApiData(response),
  (error) => Promise.reject(extractApiError(error)),
);
