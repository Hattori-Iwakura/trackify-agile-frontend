export const dynamic = "force-dynamic";

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api";
import { deleteSprint, fetchProject, fetchSprint } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import type { BoardIssue, Sprint } from "@/lib/types/issues";

export default function SprintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params.projectId ?? "");
  const sprintId = String(params.sprintId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [sprint, setSprint] = React.useState<Sprint | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!projectId || !sprintId || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, sp] = await Promise.all([fetchProject(projectId), fetchSprint(projectId, sprintId)]);
      setProjectName(proj.name);
      setSprint(sp);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được sprint."));
      setSprint(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const issuesSorted = React.useMemo(() => {
    const list = sprint?.issues ?? [];
    return [...list].sort((a, b) => String(a.status).localeCompare(String(b.status)));
  }, [sprint?.issues]);

  async function handleDeleteSprint() {
    if (!confirm("Xóa sprint này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      await deleteSprint(projectId, sprintId);
      toast.success("Đã xóa sprint.");
      router.push(`/dashboard/projects/${projectId}/settings`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không xóa được sprint."));
    } finally {
      setDeleting(false);
    }
  }

  if (!isNestBackendConfigured()) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Cần NEXT_PUBLIC_API_URL trỏ Nest.</p>
      </Card>
    );
  }

  const name = sprint?.name ?? "";
  const goal = sprint?.goal ?? "";
  const status = sprint?.status ?? "";
  const startDate = sprint?.startDate ?? "";
  const endDate = sprint?.endDate ?? "";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/projects/${projectId}/settings`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Cài đặt project
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-1">
            Sprint{name ? `: ${name}` : ""}
            {projectName ? (
              <span className="text-muted-foreground font-normal text-base"> — {projectName}</span>
            ) : null}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/projects/${projectId}/board`}>
            <Button size="sm" variant="outline">
              Board
            </Button>
          </Link>
          {sprint && !loading ? (
            <Button size="sm" variant="destructive" disabled={deleting} onClick={() => void handleDeleteSprint()}>
              {deleting ? "Đang xóa…" : "Xóa sprint"}
            </Button>
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !sprint ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : sprint ? (
        <>
          <Card className="p-4 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  status === "ACTIVE"
                    ? "bg-primary/15 text-primary"
                    : status === "COMPLETED"
                      ? "bg-green-500/15 text-green-600"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {status || "—"}
              </span>
            </div>
            {goal ? <p className="text-sm text-muted-foreground">{goal}</p> : null}
            <p className="text-xs text-muted-foreground">
              {startDate ? new Date(startDate).toLocaleString() : "Chưa có"} —{" "}
              {endDate ? new Date(endDate).toLocaleString() : "Chưa có"}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Issue trong sprint ({issuesSorted.length})</h2>
              <span className="text-xs text-muted-foreground">Sắp xếp theo trạng thái</span>
            </div>
            <div className="overflow-x-auto">
              {issuesSorted.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Chưa có issue trong sprint này.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium">Key</th>
                      <th className="px-3 py-2 font-medium">Tiêu đề</th>
                      <th className="px-3 py-2 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesSorted.map((row: BoardIssue) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">
                          {row.issueKey ? (
                            <Link
                              href={`/dashboard/projects/${projectId}/issues/${encodeURIComponent(row.issueKey)}`}
                              className="text-primary hover:underline"
                            >
                              {row.issueKey}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{row.title || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </motion.div>
  );
}
