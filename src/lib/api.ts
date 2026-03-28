import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import type { ApiSuccessEnvelope, AuthTokens, AuthUser, RefreshResult } from "@/lib/types/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessTokenOnly,
  setTokens,
} from "@/lib/auth-tokens";
import { setUserProfile } from "@/lib/auth-profile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isNestEnvelope<T>(body: unknown): body is ApiSuccessEnvelope<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    "statusCode" in body
  );
}

/** Parse body thành `data` từ Nest, hoặc fallback mock Next `{ token }`. */
export function unwrapApiData<T>(body: unknown): T {
  if (isNestEnvelope<T>(body)) {
    return body.data;
  }
  return body as T;
}

export function getApiErrorMessage(err: unknown, fallback = "Đã xảy ra lỗi."): string {
  if (!isAxiosError(err)) return fallback;
  const data = err.response?.data as Record<string, unknown> | string | undefined;
  if (data == null) return err.message || fallback;
  if (typeof data === "string") return data;
  const msg = data.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg.filter(Boolean).join(", ");

  const fieldErrors = data.errors as Record<string, string[] | string | undefined> | undefined;
  if (fieldErrors && typeof fieldErrors === "object") {
    const parts: string[] = [];
    for (const [, v] of Object.entries(fieldErrors)) {
      if (Array.isArray(v)) parts.push(...v.filter(Boolean).map(String));
      else if (typeof v === "string" && v) parts.push(v);
    }
    if (parts.length) return parts.join(" ");
  }

  return fallback;
}

/** Đăng nhập: hỗ trợ Nest envelope + mock `{ token }`. */
export function parseLoginPayload(body: unknown): AuthTokens {
  const raw = unwrapApiData<AuthTokens | { token?: string }>(body);
  if (raw && typeof raw === "object" && "accessToken" in raw && "refreshToken" in raw) {
    return raw as AuthTokens;
  }
  const legacy = raw as { token?: string };
  if (legacy?.token) {
    return { accessToken: legacy.token, refreshToken: "" };
  }
  throw new Error("Invalid login response");
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as RetryRequestConfig | undefined;
    if (!original || !isAxiosError(err) || err.response?.status !== 401) {
      return Promise.reject(err);
    }

    const url = String(original.url ?? "");
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh")
    ) {
      return Promise.reject(err);
    }

    if (original._retry) {
      if (typeof window !== "undefined") {
        clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      if (typeof window !== "undefined") {
        clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }

    original._retry = true;
    try {
      const { data: body } = await axios.post<unknown>(
        `${API_BASE}/auth/refresh`,
        { refreshToken: refresh },
        { headers: { "Content-Type": "application/json" } }
      );
      const payload = unwrapApiData<RefreshResult>(body);
      if (!payload?.accessToken) throw new Error("No access token");
      setAccessTokenOnly(payload.accessToken);
      original.headers.Authorization = `Bearer ${payload.accessToken}`;
      return api(original);
    } catch {
      if (typeof window !== "undefined") {
        clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<unknown>("/auth/login", { email, password }),

  register: (fullName: string, email: string, password: string) =>
    api.post<unknown>("/auth/register", { fullName, email, password }),

  refresh: (refreshToken: string) =>
    axios.post<unknown>(`${API_BASE}/auth/refresh`, { refreshToken }),

  logout: () => api.post<unknown>("/auth/logout"),
};

export async function loginAndStoreTokens(email: string, password: string): Promise<void> {
  const res = await authApi.login(email, password);
  const tokens = parseLoginPayload(res.data);
  if (!tokens.refreshToken) {
    setAccessTokenOnly(tokens.accessToken);
  } else {
    setTokens(tokens.accessToken, tokens.refreshToken);
  }

  try {
    const me = await api.get("/users/me");
    const user = unwrapApiData<AuthUser>(me.data);
    setUserProfile({
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
    });
  } catch {
    const payload = unwrapApiData<Record<string, unknown>>(res.data);
    const u = payload?.user as { email?: string; name?: string; fullName?: string } | undefined;
    if (u?.email) {
      setUserProfile({
        fullName: u.fullName ?? u.name ?? u.email.split("@")[0] ?? u.email,
        email: u.email,
      });
    } else {
      setUserProfile({ fullName: email.split("@")[0] ?? email, email });
    }
  }
}

export async function registerUser(
  fullName: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await authApi.register(fullName, email, password);
  return unwrapApiData<AuthUser>(res.data);
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get<unknown>("/users/me");
  return unwrapApiData<AuthUser>(res.data);
}

export type UpdateProfilePayload = { fullName?: string; email?: string };

export async function updateMyProfile(dto: UpdateProfilePayload): Promise<AuthUser> {
  const res = await api.patch<unknown>("/users/me", dto);
  const user = unwrapApiData<AuthUser>(res.data);
  setUserProfile({
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
  });
  return user;
}

export async function uploadMyAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append("avatar", file);
  const res = await api.post<unknown>("/users/me/avatar", form, {
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData && headers && typeof headers === "object") {
          delete (headers as Record<string, unknown>)["Content-Type"];
        }
        return data as FormData;
      },
    ],
  });
  const user = unwrapApiData<AuthUser>(res.data);
  setUserProfile({
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
  });
  return user;
}

export async function logoutAndClear(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    /* vẫn xóa token local */
  } finally {
    clearTokens();
  }
}
