"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { fetchProject, fetchSprint } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

function pickStr(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

export default function SprintDetailPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "");
  const sprintId = String(params.sprintId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [sprint, setSprint] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
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

  if (!isNestBackendConfigured()) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Cần NEXT_PUBLIC_API_URL trỏ Nest.</p>
      </Card>
    );
  }

  const name = sprint ? pickStr(sprint, "name") : "";
  const goal = sprint ? pickStr(sprint, "goal") : "";
  const status = sprint ? pickStr(sprint, "status") : "";
  const startDate = sprint ? pickStr(sprint, "startDate") : "";
  const endDate = sprint ? pickStr(sprint, "endDate") : "";
  const issues = (sprint?.issues as Record<string, unknown>[] | undefined) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/dashboard/projects/${projectId}/settings`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Cài đặt project
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-1">
            Sprint{name ? `: ${name}` : ""}
            {projectName ? (
              <span className="text-muted-foreground font-normal text-base"> — {projectName}</span>
            ) : null}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${projectId}/board`}>
            <Button size="sm" variant="outline">Board</Button>
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !sprint ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : sprint ? (
        <>
          <Card className="p-4 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                status === "ACTIVE" ? "bg-primary/15 text-primary" :
                status === "COMPLETED" ? "bg-green-500/15 text-green-600" :
                "bg-muted text-muted-foreground"
              }`}>
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
            <div className="px-4 py-2 border-b border-border bg-muted/40">
              <h2 className="text-sm font-semibold">Issue trong sprint ({issues.length})</h2>
            </div>
            <div className="overflow-x-auto">
              {issues.length === 0 ? (
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
                    {issues.map((row) => {
                      const key = pickStr(row, "issueKey");
                      const id = typeof row.id === "string" ? row.id : key;
                      return (
                        <tr key={id} className="border-t border-border">
                          <td className="px-3 py-2 font-mono">
                            {key ? (
                              <Link
                                href={`/dashboard/projects/${projectId}/issues/${encodeURIComponent(key)}`}
                                className="text-primary hover:underline"
                              >
                                {key}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2">{pickStr(row, "title") || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{pickStr(row, "status") || "—"}</td>
                        </tr>
                      );
                    })}
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
