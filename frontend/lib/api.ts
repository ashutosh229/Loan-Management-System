const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  reasons?: string[];
  constructor(message: string, status: number, reasons?: string[]) {
    super(message);
    this.status = status;
    this.reasons = reasons;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData = false } = opts;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include", // send the httpOnly JWT cookie
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Request failed.", res.status, data?.reasons);
  }

  return data as T;
}
