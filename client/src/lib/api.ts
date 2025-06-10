import { queryClient } from "./queryClient";

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiRequestJson<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  return await res.json();
}

// Utility functions for common API operations
export const api = {
  get: <T>(url: string) => apiRequestJson<T>("GET", url),
  post: <T>(url: string, data?: unknown) => apiRequestJson<T>("POST", url, data),
  put: <T>(url: string, data?: unknown) => apiRequestJson<T>("PUT", url, data),
  delete: <T>(url: string) => apiRequestJson<T>("DELETE", url),
  patch: <T>(url: string, data?: unknown) => apiRequestJson<T>("PATCH", url, data),
};

// Cache invalidation helpers
export const invalidateQueries = (queryKey: string | string[]) => {
  queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
};

export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};
