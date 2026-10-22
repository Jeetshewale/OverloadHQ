// ---------------------------------------------------------------
// OverloadHQ – API Client (Frontend)
// All API calls go through Next.js rewrites → backend
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

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error || "Request failed", body.details);
  }

  // Handle CSV downloads
  if (res.headers.get("content-type")?.includes("text/csv")) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
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

    logout: () => request<any>("/auth/logout", { method: "POST" }),

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
