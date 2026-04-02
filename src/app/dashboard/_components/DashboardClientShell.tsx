"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/layout";

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

export default function DashboardClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background-subtle">
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
