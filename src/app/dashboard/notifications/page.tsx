"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/projects-issues-api";
import { subscribeNotifications } from "@/lib/socket";
import type { AppNotification } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Filter = "all" | "unread" | "read";

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [unreadCount, setUnreadCount] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadFirstPage = React.useCallback(async () => {
    if (!isNestBackendConfigured()) {
      setLoading(false);
      setError("Cần NEXT_PUBLIC_API_URL trỏ Nest.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [res, count] = await Promise.all([
        fetchNotifications(1, PAGE_SIZE),
        fetchUnreadNotificationCount(),
      ]);
      setNotifications(res.data);
      setPage(1);
      setTotalPages(res.meta.totalPages);
      setUnreadCount(count);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Cập nhật lại trang 1 + unread khi có socket — không bật full-screen loading. */
  const refreshFromSocket = React.useCallback(async () => {
    if (!isNestBackendConfigured()) return;
    try {
      const [res, count] = await Promise.all([
        fetchNotifications(1, PAGE_SIZE),
        fetchUnreadNotificationCount(),
      ]);
      setNotifications(res.data);
      setPage(1);
      setTotalPages(res.meta.totalPages);
      setUnreadCount(count);
    } catch {
      /* im lặng — realtime là best-effort */
    }
  }, []);

  React.useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  React.useEffect(() => {
    const unsub = subscribeNotifications(() => {
      void refreshFromSocket();
    });
    return () => {
      unsub?.();
    };
  }, [refreshFromSocket]);

  async function loadMore() {
    const next = page + 1;
    if (next > totalPages) return;
    setLoadingMore(true);
    try {
      const res = await fetchNotifications(next, PAGE_SIZE);
      setNotifications((prev) => [...prev, ...res.data]);
      setPage(next);
      setTotalPages(res.meta.totalPages);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải thêm được."));
    } finally {
      setLoadingMore(false);
    }
  }

  const displayed = React.useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filter]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => (c !== null ? Math.max(0, c - 1) : c));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không đánh dấu đã đọc được."));
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không đánh dấu đã đọc được."));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Thông báo</h1>
          {unreadCount !== null && unreadCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {unreadCount} chưa đọc
            </span>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tất cả"],
            ["unread", "Chưa đọc"],
            ["read", "Đã đọc"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant={filter === id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Không có thông báo nào.</p>
          </CardContent>
        </Card>
      ) : displayed.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Không có thông báo trong bộ lọc này.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {displayed.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-start sm:gap-4",
                  n.isRead ? "bg-card" : "bg-muted/50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      n.isRead ? "text-muted-foreground" : "font-medium text-foreground"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {n.message || n.content || ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="shrink-0 self-start sm:self-center"
                    onClick={() => void handleMarkRead(n.id)}
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && notifications.length > 0 && page < totalPages ? (
        <div className="flex justify-center">
          <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "Đang tải…" : "Tải thêm"}
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}
