"use client";

import Link from "next/link";
import { Nav, NavItem } from "./Nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { logoutAndClear } from "@/lib/api";
import { useRouter } from "next/navigation";

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAndClear();
    router.push("/login");
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-[var(--sidebar)] text-[var(--sidebar-foreground)] z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-16 px-6 flex items-center shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg leading-none">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Trackify</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <Nav items={items} />
      </ScrollArea>

      <div className="p-4 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => void handleLogout()}
        >
          <LogoutIcon className="w-5 h-5 mr-3 shrink-0" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M15.75 9L12 12.75m0 0L8.25 9m3.75 3.75V21" />
    </svg>
  );
}
