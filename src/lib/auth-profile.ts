const KEY = "trackify_user_profile";

export type StoredUserProfile = {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

export function setUserProfile(p: StoredUserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("trackify-profile-changed"));
}

export function getUserProfile(): StoredUserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as StoredUserProfile;
    if (typeof p?.email === "string" && typeof p?.fullName === "string") return p;
    return null;
  } catch {
    return null;
  }
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("trackify-profile-changed"));
}

/** Chữ cái đại diện cho avatar (tối đa 2 ký tự). */
export function displayInitials(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0];
    const b = parts[parts.length - 1]![0];
    return (a + b).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}
