const BASE_URL = "http://localhost:8000/api";

let _accessToken: string | null = localStorage.getItem("access_token");
let _refreshToken: string | null = localStorage.getItem("refresh_token");
let _onLogout: (() => void) | null = null;

export function setLogoutHandler(fn: () => void) {
  _onLogout = fn;
}

function storeTokens(access: string, refresh: string) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, err.detail ?? "Request failed");
  }
  const data = await res.json();
  storeTokens(data.access_token, data.refresh_token);
  return data;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // if 401, try refresh
  if (res.status === 401 && _refreshToken) {
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: _refreshToken }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      storeTokens(data.access_token, data.refresh_token);
      headers["Authorization"] = `Bearer ${_accessToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      _onLogout?.();
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Request failed");
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Auth convenience functions
// register/login use authFetch to store tokens from response
export const authApi = {
  register: (email: string, password: string, name: string) =>
    authFetch<import("@fin/shared").TokenResponse>("/auth/register", { email, password, name }),

  login: (email: string, password: string) =>
    authFetch<import("@fin/shared").TokenResponse>("/auth/login", { email, password }),

  me: () => api<import("@fin/shared").UserOut>("/auth/me"),
};