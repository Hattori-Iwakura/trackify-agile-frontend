"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import {
  createIssue,
  fetchProject,
  fetchProjectMembersPage,
  fetchProjectLabels,
} from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import type { IssuePriorityBE, IssueTypeBE, Label as ProjectLabel } from "@/lib/types/issues";

const TYPES: IssueTypeBE[] = ["TASK", "BUG", "STORY", "EPIC", "SUBTASK"];
const PRIORITIES: IssuePriorityBE[] = ["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"];

export default function NewIssuePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<IssueTypeBE>("TASK");
  const [priority, setPriority] = React.useState<IssuePriorityBE>("MEDIUM");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [members, setMembers] = React.useState<{ id: string; name: string }[]>([]);
  const [projectLabels, setProjectLabels] = React.useState<ProjectLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projectId || !isNestBackendConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, memPage, labPage] = await Promise.all([
          fetchProject(projectId),
          fetchProjectMembersPage(projectId, 1, 100),
          fetchProjectLabels(projectId, 1, 100),
        ]);
        if (cancelled) return;
        setProjectName(p.name);
        setMembers(memPage.data.map((m) => ({ id: m.userId, name: m.user?.fullName ?? m.userId })));
        setProjectLabels(labPage.data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isNestBackendConfigured()) {
      setError("Cần NEXT_PUBLIC_API_URL trỏ Nest.");
      return;
    }
    setSubmitting(true);
    try {
      const labelIds = Array.from(selectedLabelIds);
      const created = await createIssue(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        ...(assigneeId ? { assigneeId } : {}),
        ...(labelIds.length > 0 ? { labelIds } : {}),
      });
      const issueKey = String(created.issueKey ?? "");
      if (issueKey) {
        router.push(`/dashboard/projects/${projectId}/issues/${encodeURIComponent(issueKey)}`);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6">
          <Link href={`/dashboard/projects/${projectId}/board`}>
            <Button type="button" variant="ghost" size="icon" aria-label="Quay lại">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <CardTitle className="text-xl">Tạo issue</CardTitle>
            {projectName && <CardDescription>{projectName}</CardDescription>}
          </div>
        </CardHeader>
        <CardContent>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="issue-title">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Mô tả ngắn công việc"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-desc">Mô tả</Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Loại</Label>
              <Select value={type} onValueChange={(v) => setType((v || "TASK") as IssueTypeBE)}>
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-priority">Độ ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority((v || "MEDIUM") as IssuePriorityBE)}>
                <SelectTrigger id="issue-priority">
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-assignee">Người phụ trách (tuỳ chọn)</Label>
            <Select value={assigneeId || "unassigned"} onValueChange={(v) => setAssigneeId(v === "unassigned" ? "" : (v || ""))}>
              <SelectTrigger id="issue-assignee">
                <SelectValue placeholder="— Không gán —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">— Không gán —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projectLabels.length > 0 && (
            <div className="space-y-2">
              <Label>Nhãn (tuỳ chọn)</Label>
              <div className="flex flex-wrap gap-2 border border-border rounded-lg p-3 bg-muted/20">
                {projectLabels.map((l) => (
                  <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLabelIds.has(l.id)}
                      onChange={() => toggleLabel(l.id)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    {l.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo…" : "Tạo issue"}
            </Button>
            <Link href={`/dashboard/projects/${projectId}/board`}>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
          </div>
        </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}
