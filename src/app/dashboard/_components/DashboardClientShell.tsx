"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/layout";
import { WebSocketProvider, useWebSocket } from "@/components/providers/WebSocketProvider";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Home";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    const title = segments[1];
    if (title === "projects") return "Projects";
    if (title === "tasks") return "Issues";
    if (title === "notifications") return "Notifications";
    if (title === "profile") return "Profile";
    if (title === "settings") return "Settings";
    return title;
  }
  return "Dashboard";
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reconnecting } = useWebSocket();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background-subtle">
      {reconnecting && (
        <div className="flex items-center justify-center gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-xs text-yellow-700 dark:text-yellow-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
          Đang kết nối lại...
        </div>
      )}
      <Header title={getPageTitle(pathname)} />
      <main className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto bg-background-subtle p-4 md:p-6 lg:p-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-auto min-h-full w-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default function DashboardClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider>
      <ShellInner>{children}</ShellInner>
    </WebSocketProvider>
  );
}
