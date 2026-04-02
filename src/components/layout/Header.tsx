"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { displayInitials, getUserProfile, type StoredUserProfile } from "@/lib/auth-profile";
import { resolvePublicFileUrl } from "@/lib/api-origin";
import { logoutAndClear } from "@/lib/api";
import { fetchUnreadNotificationCount } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { getAccessToken } from "@/lib/auth-tokens";

export function Header({ title }: { title?: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setProfile(getUserProfile());
    sync();
    window.addEventListener("trackify-profile-changed", sync);
    return () => window.removeEventListener("trackify-profile-changed", sync);
  }, []);

  useEffect(() => {
    if (!isNestBackendConfigured() || typeof window === "undefined" || !getAccessToken()) {
      setUnreadNotifications(null);
      return;
    }
    let cancelled = false;
    const tick = () => {
      void (async () => {
        try {
          const n = await fetchUnreadNotificationCount();
          if (!cancelled) setUnreadNotifications(n);
        } catch {
          if (!cancelled) setUnreadNotifications(null);
        }
      })();
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [profile?.email]);

  const displayName = profile?.fullName ?? "User";
  const displayEmail = profile?.email ?? "";
  const avatarInitial = profile ? displayInitials(profile.fullName) : "?";
  const avatarSrc = profile ? resolvePublicFileUrl(profile.avatarUrl ?? null) : null;

  async function handleLogout() {
    await logoutAndClear();
    router.push("/login");
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 bg-card/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <h2 className="text-lg font-semibold text-foreground hidden sm:block capitalize">
          {title || "Dashboard"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label={
              unreadNotifications != null && unreadNotifications > 0
                ? `${unreadNotifications} thông báo chưa đọc`
                : "Thông báo"
            }
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotifications != null && unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground border-2 border-background">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-black/5 p-1 pr-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            <Avatar className="h-8 w-8 border border-black/5">
              <AvatarImage src={avatarSrc || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{avatarInitial}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
            <ChevronDownIcon className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/profile")}>
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/profile")}>
              <GearIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogoutIcon className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M15.75 9L12 12.75m0 0L8.25 9m3.75 3.75V21" />
    </svg>
  );
}
