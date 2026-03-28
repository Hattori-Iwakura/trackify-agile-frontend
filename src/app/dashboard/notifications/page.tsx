"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/projects-issues-api";
import type { AppNotification } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!isNestBackendConfigured()) {
      setLoading(false);
      setError("Cần NEXT_PUBLIC_API_URL trỏ Nest.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotifications(1, 50);
      setNotifications(res.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      alert(getApiErrorMessage(err, "Không đánh dấu đã đọc được."));
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      alert(getApiErrorMessage(err, "Không đánh dấu đã đọc được."));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Thông báo</h1>
        <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Không có thông báo nào.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-black/80">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 flex gap-4 transition-colors ${n.isRead ? "bg-card" : "bg-black/5"}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {n.message || n.content || ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => void handleMarkRead(n.id)}
                    className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
                    title="Đánh dấu đã đọc"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
