"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe, getApiErrorMessage } from "@/lib/api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { fetchMyAssignedIssues, type AssignedIssueRow } from "@/lib/my-assigned-issues";
import {
  fetchNotifications,
  fetchProjectsPage,
  fetchUnreadNotificationCount,
} from "@/lib/projects-issues-api";
import type { AppNotification, ProjectSummary } from "@/lib/types/issues";
import type { AuthUser } from "@/lib/types/api";

function isDone(status: string) {
  return status === "DONE" || status === "CANCELLED";
}

function sortIssuesForHome(rows: AssignedIssueRow[]) {
  return [...rows].sort((a, b) => {
    const aOpen = !isDone(a.status) ? 0 : 1;
    const bOpen = !isDone(b.status) ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return b.issueKey.localeCompare(a.issueKey);
  });
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 45) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-muted/60" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-xl bg-muted/60" />
        <div className="h-24 rounded-xl bg-muted/60" />
        <div className="h-24 rounded-xl bg-muted/60" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-muted/60" />
        <div className="h-72 rounded-xl bg-muted/60" />
      </div>
      <div className="h-32 rounded-xl bg-muted/60" />
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<AuthUser | null>(null);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectPreview, setProjectPreview] = useState<ProjectSummary[]>([]);
  const [assignedRows, setAssignedRows] = useState<AssignedIssueRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!isNestBackendConfigured()) {
      setLoading(false);
      setError("Đặt NEXT_PUBLIC_API_URL trỏ Nest để xem tổng quan workspace.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await fetchMe();
      const [projPage, assigned, unread, notifPage] = await Promise.all([
        fetchProjectsPage(1, 6),
        fetchMyAssignedIssues(user.id),
        fetchUnreadNotificationCount(),
        fetchNotifications(1, 5),
      ]);
      setMe(user);
      setProjectTotal(projPage.meta.total);
      setProjectPreview(projPage.data);
      setAssignedRows(assigned);
      setUnreadCount(unread);
      setRecentNotifications(notifPage.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được dữ liệu trang chủ."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const greetingLine = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return fmt.format(new Date());
  }, []);

  const openAssignedCount = useMemo(
    () => assignedRows.filter((r) => !isDone(r.status)).length,
    [assignedRows],
  );

  const homeIssues = useMemo(() => sortIssuesForHome(assignedRows).slice(0, 8), [assignedRows]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:p-6"
      >
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {me ? `Chào ${me.fullName.split(/\s+/)[0] ?? me.fullName}` : "Chào bạn"}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">{greetingLine}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/projects?create=1">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo project
              </Button>
            </Link>
            <Link href="/dashboard/tasks?create=1">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo issue
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.04, ease: "easeOut" }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <StatLinkCard
          href="/dashboard/projects"
          label="Project tham gia"
          value={projectTotal}
          icon={<FolderKanban className="h-5 w-5 text-primary" />}
        />
        <StatLinkCard
          href="/dashboard/tasks"
          label="Issue gán bạn (đang mở)"
          value={openAssignedCount}
          icon={<Inbox className="h-5 w-5 text-primary" />}
        />
        <StatLinkCard
          href="/dashboard/notifications"
          label="Thông báo chưa đọc"
          value={unreadCount}
          icon={<Bell className="h-5 w-5 text-primary" />}
          highlight={unreadCount > 0}
        />
      </motion.section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08, ease: "easeOut" }}
          className="lg:col-span-3"
        >
          <Card className="h-full border-border/70 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg">Việc của tôi</CardTitle>
                <CardDescription>Issue được gán, ưu tiên đang mở.</CardDescription>
              </div>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {!isNestBackendConfigured() ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Kết nối API để hiển thị issue.
                </p>
              ) : homeIssues.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Chưa có issue được gán.</p>
                  <Link href="/dashboard/tasks?create=1">
                    <Button size="sm" variant="outline" className="mt-1">
                      Tạo issue
                    </Button>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {homeIssues.map((task, i) => (
                    <motion.li
                      key={`${task.projectId}-${task.issueKey}`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2) }}
                    >
                      <Link
                        href={`/dashboard/projects/${task.projectId}/issues/${encodeURIComponent(task.issueKey)}`}
                        className="flex flex-col gap-2 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-lg sm:px-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-medium text-foreground">{task.title}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {task.issueKey}{" "}
                            <span className="text-border">·</span> {task.projectName}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Badge
                            variant={isDone(task.status) ? "secondary" : "default"}
                            className={`font-normal ${
                              !isDone(task.status)
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : ""
                            }`}
                          >
                            {isDone(task.status) ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                              <CircleDashed className="mr-1 h-3 w-3" />
                            )}
                            {task.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider text-muted-foreground"
                          >
                            {task.type}
                          </Badge>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-border/70 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg">Project</CardTitle>
                <CardDescription>Mở nhanh board hoặc danh sách đầy đủ.</CardDescription>
              </div>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  Tất cả
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {!isNestBackendConfigured() ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Kết nối API để hiển thị project.
                </p>
              ) : projectPreview.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Chưa có project.</p>
                  <Link href="/dashboard/projects?create=1">
                    <Button size="sm">Tạo project</Button>
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {projectPreview.map((p, i) => (
                    <motion.li
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2) }}
                    >
                      <Link
                        href={`/dashboard/projects/${p.id}/board`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/35"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{p.key}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12, ease: "easeOut" }}
      >
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Thông báo gần đây</CardTitle>
                <CardDescription className="text-xs">Tối đa 5 mục mới nhất.</CardDescription>
              </div>
            </div>
            <Link href="/dashboard/notifications">
              <Button variant="outline" size="sm" className="gap-1">
                Mở trung tâm thông báo
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {!isNestBackendConfigured() ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Kết nối API để xem thông báo.</p>
            ) : recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {recentNotifications.map((n) => (
                  <li key={n.id} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {n.message || n.content || ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" title="Chưa đọc" />
                      )}
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}

function StatLinkCard({
  href,
  label,
  value,
  icon,
  highlight,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block h-full min-h-[5.75rem] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        size="sm"
        className={`flex h-full min-h-[5.75rem] flex-col justify-center border-border/70 py-4 data-[size=sm]:py-4 transition-colors hover:bg-muted/20 ${
          highlight ? "border-primary/30 bg-primary/[0.04]" : ""
        }`}
      >
        <CardContent className="flex items-center gap-3 px-4 py-0 sm:px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-2xl font-bold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
