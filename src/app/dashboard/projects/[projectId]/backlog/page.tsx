"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ProjectSettingsPanel } from "@/components/projects/ProjectSettingsPanel";
import { Button, Card } from "@/components/ui";
import { Dropdown } from "@/components/ui/Dropdown";
import { getApiErrorMessage } from "@/lib/api";
import { fetchBacklog, fetchProject } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

function pickStr(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

export default function ProjectBacklogPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, backlog] = await Promise.all([fetchProject(projectId), fetchBacklog(projectId)]);
      setProjectName(proj.name);
      setRows(backlog);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được backlog."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!isNestBackendConfigured()) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Đặt NEXT_PUBLIC_API_URL trỏ Nest và đăng nhập.</p>
        <Link href="/dashboard/projects" className="text-primary text-sm mt-2 inline-block">
          ← Danh sách project
        </Link>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-5xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-1">
            Backlog{projectName ? `: ${projectName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Các issue chưa gán sprint.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/dashboard/projects/${projectId}/board`}>
            <Button size="sm" variant="outline">
              Board
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${projectId}/issues`}>
            <Button size="sm" variant="outline">
              Tìm issue
            </Button>
          </Link>
          <Dropdown
            align="right"
            contentClassName="w-[min(36rem,calc(100vw-1.25rem))] max-h-[min(90vh,36rem)] overflow-hidden p-0"
            trigger={
              <Button size="sm" variant="outline" type="button">
                Cài đặt
              </Button>
            }
          >
            <div className="flex max-h-[min(90vh,36rem)] flex-col p-4 text-left">
              <p className="text-sm font-semibold text-foreground">Cài đặt project</p>
              {projectName ? <p className="mt-0.5 text-xs text-muted-foreground">{projectName}</p> : null}
              <div className="mt-2 min-h-0 flex-1 overflow-hidden">
                <ProjectSettingsPanel
                  projectId={projectId}
                  variant="embed"
                  onDataChanged={() => void load()}
                />
              </div>
            </div>
          </Dropdown>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải backlog…</p>
      ) : rows.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Không có issue nào trong backlog.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left border-b border-border">
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Tiêu đề</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Loại</th>
                  <th className="px-3 py-2 font-medium">Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const key = pickStr(r, "issueKey");
                  const title = pickStr(r, "title");
                  const status = pickStr(r, "status");
                  const type = pickStr(r, "type");
                  const priority = pickStr(r, "priority");
                  const id = typeof r.id === "string" ? r.id : key;
                  return (
                    <tr key={id} className="border-t border-border hover:bg-muted/30">
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
                      <td className="px-3 py-2 max-w-xs truncate" title={title}>
                        {title || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{status || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{type || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{priority || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
