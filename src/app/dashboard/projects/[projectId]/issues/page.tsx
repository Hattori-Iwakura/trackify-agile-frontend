"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card, Input, Label } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { fetchIssuesForProject, fetchProject } from "@/lib/projects-issues-api";
import type { PaginatedResult } from "@/lib/types/api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

function pickStr(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

export default function ProjectIssuesListPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Debounce: update committed search 300ms after typing stops
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(draft.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [draft]);
  const [result, setResult] = React.useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const limit = 20;

  const load = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, paginated] = await Promise.all([
        fetchProject(projectId),
        fetchIssuesForProject(projectId, {
          page,
          limit,
          ...(search.trim() ? { search: search.trim() } : {}),
        }),
      ]);
      setProjectName(proj.name);
      setResult(paginated);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được danh sách issue."));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, page, search]);

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

  const totalPages = result?.meta.totalPages ?? 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-1">
            Issue{projectName ? `: ${projectName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tìm theo tiêu đề, mô tả hoặc issue key.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/dashboard/projects/${projectId}/board`}>
            <Button size="sm" variant="outline">Board</Button>
          </Link>
          <Link href={`/dashboard/projects/${projectId}/issues/new`}>
            <Button size="sm" variant="default">Tạo issue</Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="issue-search">Tìm kiếm</Label>
            <Input
              id="issue-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="VD: TRK-1, lỗi đăng nhập…"
            />
          </div>
          {draft ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDraft("")}
            >
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !result ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : result ? (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left border-b border-border">
                    <th className="px-3 py-2 font-medium">Key</th>
                    <th className="px-3 py-2 font-medium">Tiêu đề</th>
                    <th className="px-3 py-2 font-medium">Trạng thái</th>
                    <th className="px-3 py-2 font-medium">Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((row) => {
                    const key = pickStr(row, "issueKey");
                    const id = typeof row.id === "string" ? row.id : key;
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
                        <td className="px-3 py-2 max-w-md truncate" title={pickStr(row, "title")}>
                          {pickStr(row, "title") || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{pickStr(row, "status") || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{pickStr(row, "type") || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground">
            {result.meta.total} issue — trang {result.meta.page}/{totalPages || 1}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}
