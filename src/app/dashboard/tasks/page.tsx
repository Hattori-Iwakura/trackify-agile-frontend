"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, Inbox, CheckCircle2, CircleDashed } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { CreateIssueModal } from "@/components/tasks/CreateIssueModal";
import { fetchMe, getApiErrorMessage } from "@/lib/api";
import { fetchMyAssignedIssues, type AssignedIssueRow } from "@/lib/my-assigned-issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

type Filter = "All" | "Open" | "Done";

function isDone(status: string) {
  return status === "DONE" || status === "CANCELLED";
}

function MyTasksListPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createFromUrl = searchParams.get("create") === "1";
  const projectIdFromUrl = searchParams.get("projectId") ?? "";
  const [createOpenExtra, setCreateOpenExtra] = useState(false);
  const createModalOpen = createFromUrl || createOpenExtra;

  const handleCreateModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setCreateOpenExtra(false);
        if (searchParams.get("create") === "1") {
          router.replace("/dashboard/tasks", { scroll: false });
        }
      }
    },
    [router, searchParams],
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [rows, setRows] = useState<AssignedIssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRows = useCallback(async () => {
    if (!isNestBackendConfigured()) return;
    try {
      const me = await fetchMe();
      const list = await fetchMyAssignedIssues(me.id);
      setRows(list);
    } catch {
      /* silent refresh */
    }
  }, []);

  useEffect(() => {
    if (!isNestBackendConfigured()) {
      setLoading(false);
      setError("Đặt NEXT_PUBLIC_API_URL trỏ Nest để xem issue được gán cho bạn.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        const list = await fetchMyAssignedIssues(me.id);
        if (cancelled) return;
        setRows(list);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Không tải được danh sách issue."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter === "Open") out = out.filter((r) => !isDone(r.status));
    if (filter === "Done") out = out.filter((r) => isDone(r.status));
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.issueKey.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q),
      );
    }
    return out;
  }, [rows, filter, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      <CreateIssueModal
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCreateModalOpenChange(false);
        }}
        initialProjectId={projectIdFromUrl}
        onCreated={() => void refreshRows()}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="w-6 h-6 text-primary" />
            Issue của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách các công việc được gán cho bạn trên tất cả project.
          </p>
        </div>
        <Button type="button" className="gap-2 shadow-sm" onClick={() => setCreateOpenExtra(true)}>
          <Plus className="w-4 h-4" />
          Tạo issue
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/40">
            {(["All", "Open", "Done"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {f === "All" ? "Tất cả" : f === "Open" ? "Đang mở" : "Hoàn thành"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4">
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Loại / Ưu tiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((task, i) => (
                  <motion.tr
                    key={`${task.projectId}-${task.issueKey}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="group hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/projects/${task.projectId}/issues/${encodeURIComponent(task.issueKey)}`}
                        className="block"
                      >
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">{task.issueKey}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{task.projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={isDone(task.status) ? "secondary" : "default"}
                        className={`font-normal ${!isDone(task.status) ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground"}`}
                      >
                        {isDone(task.status) ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <CircleDashed className="w-3 h-3 mr-1" />
                        )}
                        {task.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider border-border/60 text-muted-foreground"
                        >
                          {task.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{task.priority.toLowerCase()}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                      <p>Không tìm thấy issue nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function MyTasksListPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Đang tải…</CardContent>
        </Card>
      }
    >
      <MyTasksListPageInner />
    </Suspense>
  );
}
