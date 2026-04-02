"use client";

import { useEffect } from "react";
import { applyDarkModeClass, readDarkModePreference } from "@/lib/theme-preferences";

/** Áp dụng class `dark` trên <html> theo localStorage khi vào app (trước khi mở Profile). */
export function ThemeHydration() {
  useEffect(() => {
    applyDarkModeClass(readDarkModePreference());
  }, []);
  return null;
}
