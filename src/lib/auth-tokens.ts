import { clearUserProfile } from "@/lib/auth-profile";

const ACCESS_KEY = "trackify_access_token";
const REFRESH_KEY = "trackify_refresh_token";
/** Legacy key từ bản mock cũ */
const LEGACY_TOKEN_KEY = "token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function setAccessTokenOnly(accessToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  clearUserProfile();
}
