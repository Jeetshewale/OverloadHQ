// ---------------------------------------------------------------
// OverloadHQ – API Client (Frontend)
// All API calls go through Next.js rewrites → backend
// Includes dual token authorization (Cookie + Bearer token)
// ---------------------------------------------------------------

import { API_BASE } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Retrieve token from localStorage if in browser
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("overloadhq_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Merge any caller-provided headers
  if (options.headers) {
    const incoming = options.headers as Record<string, string>;
    Object.assign(headers, incoming);
  }

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error || "Request failed", body.details);
  }

  // Handle CSV downloads
  if (res.headers.get("content-type")?.includes("text/csv")) {
    return (await res.text()) as unknown as T;
  }

  const json = await res.json();

  // If token received in response, persist it locally for resilience
  if (json?.token && typeof window !== "undefined") {
    localStorage.setItem("overloadhq_token", json.token);
  }

  return json;
}

// ---- Auth ----
export const api = {
  auth: {
    register: (data: {
      email: string;
      username: string;
      password: string;
      name: string;
      inviteCode?: string;
    }) => request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("overloadhq_token");
      }
      return request<any>("/auth/logout", { method: "POST" });
    },

    me: () => request<any>("/auth/me"),

    forgotPassword: (email: string) =>
      request<any>("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }),

    resetPassword: (token: string, password: string) =>
      request<any>("/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },

  user: {
    getProfile: () => request<any>("/user/profile"),

    updateProfile: (data: any) =>
      request<any>("/user/profile", { method: "PATCH", body: JSON.stringify(data) }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<any>("/user/password", { method: "PATCH", body: JSON.stringify(data) }),

    deleteAccount: () => request<any>("/user", { method: "DELETE" }),
  },

  workouts: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/workouts${query}`);
    },

    get: (id: string) => request<any>(`/workouts/${id}`),

    create: (data: any) =>
      request<any>("/workouts", { method: "POST", body: JSON.stringify(data) }),

    update: (id: string, data: any) =>
      request<any>(`/workouts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

    delete: (id: string) =>
      request<any>(`/workouts/${id}`, { method: "DELETE" }),

    loadSample: () =>
      request<any>("/workouts/sample", { method: "POST" }),

    deleteSample: () =>
      request<any>("/workouts/sample/all", { method: "DELETE" }),
  },

  exercises: {
    list: (muscleGroup?: string) => {
      const query = muscleGroup ? `?muscleGroup=${muscleGroup}` : "";
      return request<any>(`/exercises${query}`);
    },

    create: (data: { name: string; muscleGroup: string }) =>
      request<any>("/exercises", { method: "POST", body: JSON.stringify(data) }),
  },

  progress: {
    exercise: (name: string) =>
      request<any>(`/progress/exercise/${encodeURIComponent(name)}`),

    summary: () => request<any>("/progress/summary"),

    prs: () => request<any>("/progress/prs"),

    splitOverload: (muscleGroup?: string, split?: string) => {
      const params = new URLSearchParams();
      if (muscleGroup) params.set("muscleGroup", muscleGroup);
      if (split) params.set("split", split);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any>(`/progress/split-overload${query}`);
    },
  },

  ai: {
    analyze: () =>
      request<any>("/ai/analyze", { method: "POST" }),
  },

  export: {
    csv: () =>
      request<string>("/export/csv"),
  },

  health: () => request<any>("/health"),
};
