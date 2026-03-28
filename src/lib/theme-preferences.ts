/** Khóa localStorage — dùng chung Profile + hydrate theme khi vào dashboard */
export const STORAGE_DARK_MODE = "trackify-dark-mode";
export const STORAGE_EMAIL_NOTIFICATIONS = "trackify-email-notifications";

export function readDarkModePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_DARK_MODE) === "true";
  } catch {
    return false;
  }
}

export function applyDarkModeClass(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", enabled);
}

export function persistDarkMode(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_DARK_MODE, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
  applyDarkModeClass(enabled);
}
