"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const activeLink =
  "border border-border/70 bg-card font-medium text-foreground shadow-sm rounded-xl";
const inactiveLink =
  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-xl";

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavProps {
  items: NavItem[];
}

/** Home chỉ khớp đúng `/dashboard`; các mục khác sáng khi đúng path hoặc route con (vd. board project). */
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ items }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
              isActive ? activeLink : inactiveLink
            }`}
          >
            {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
