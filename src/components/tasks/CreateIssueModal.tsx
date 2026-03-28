"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api";
import { fetchAllProjectSummaries, createIssue } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import type { IssuePriorityBE, IssueTypeBE, ProjectSummary } from "@/lib/types/issues";

const TYPES: IssueTypeBE[] = ["TASK", "BUG", "STORY", "EPIC", "SUBTASK"];
const PRIORITIES: IssuePriorityBE[] = ["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"];

export interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  /** Khi mở từ URL (?projectId=) */
  initialProjectId?: string;
}

export function CreateIssueModal({
  open,
  onOpenChange,
  onCreated,
  initialProjectId = "",
}: CreateIssueModalProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<IssueTypeBE>("TASK");
  const [priority, setPriority] = React.useState<IssuePriorityBE>("MEDIUM");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setProjectId("");
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setError(null);
    setLoadErr(null);
    setSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    setError(null);
  }, [open, resetForm]);

  React.useEffect(() => {
    if (!open || !isNestBackendConfigured()) {
      if (open && !isNestBackendConfigured()) setLoadErr("Cần NEXT_PUBLIC_API_URL trỏ Nest.");
      return;
    }
    let cancelled = false;
    setLoadErr(null);
    (async () => {
      try {
        const list = await fetchAllProjectSummaries();
        if (cancelled) return;
        setProjects(list);
        setProjectId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          if (initialProjectId && list.some((p) => p.id === initialProjectId)) return initialProjectId;
          return list[0]?.id ?? "";
        });
      } catch (e) {
        if (!cancelled) setLoadErr(getApiErrorMessage(e, "Không tải được project."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialProjectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!projectId) {
      setError("Chọn project.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createIssue(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
      });
      const key = String(created.issueKey ?? "");
      onOpenChange(false);
      onCreated?.();
      if (key) {
        router.push(`/dashboard/projects/${projectId}/issues/${encodeURIComponent(key)}`);
      } else {
        router.push(`/dashboard/projects/${projectId}/board`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tạo được issue."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[min(90vh,40rem)] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Tạo issue</DialogTitle>
          <DialogDescription>Chọn project, nhập tiêu đề và tùy chọn mô tả, loại, độ ưu tiên.</DialogDescription>
        </DialogHeader>

        {(loadErr || error) && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error ?? loadErr}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-issue-project">Project</Label>
            <select
              id="modal-issue-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              required
            >
              {projects.length === 0 ? (
                <option value="">— Chưa có project —</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              Cần project trước — tạo tại{" "}
              <Link href="/dashboard/projects?create=1" className="text-primary hover:underline">
                Tạo project
              </Link>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-issue-title">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-issue-desc">Mô tả</Label>
            <Textarea
              id="modal-issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-issue-type">Loại</Label>
              <select
                id="modal-issue-type"
                value={type}
                onChange={(e) => setType(e.target.value as IssueTypeBE)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-issue-priority">Độ ưu tiên</Label>
              <select
                id="modal-issue-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriorityBE)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={submitting || !projects.length}>
              {submitting ? "Đang tạo…" : "Tạo issue"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
