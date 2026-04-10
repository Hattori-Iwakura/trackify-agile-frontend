/** Khóa localStorage — dùng chung Profile (email notifications). Chế độ tối dùng next-themes (ThemeProvider). */
export const STORAGE_EMAIL_NOTIFICATIONS = "trackify-email-notifications";

const THEME_STORAGE_KEY = "trackify-theme";

/** Read current dark mode preference (mirrors next-themes storageKey). */
export function readDarkModePreference(): boolean {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

/** Persist dark mode preference and apply the class to <html> (mirrors next-themes behavior). */
export function persistDarkMode(dark: boolean): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  } catch {
    /* ignore SSR / private-browsing */
  }
}
