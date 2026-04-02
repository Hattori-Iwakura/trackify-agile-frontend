"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ProjectSettingsPanel } from "@/components/projects/ProjectSettingsPanel";
import { Button, Card } from "@/components/ui";
import { Dropdown } from "@/components/ui/Dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import {
  addIssueToSprint,
  fetchBacklog,
  fetchProject,
  fetchProjectSprints,
  reorderIssue,
} from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import type { Sprint } from "@/lib/types/issues";

function pickStr(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

function SortableRow({
  row,
  projectId,
  sprints,
  onMoveToSprint,
}: {
  row: Record<string, unknown>;
  projectId: string;
  sprints: Sprint[];
  onMoveToSprint: (issueKey: string, sprintId: string) => Promise<void>;
}) {
  const key = pickStr(row, "issueKey");
  const title = pickStr(row, "title");
  const status = pickStr(row, "status");
  const type = pickStr(row, "type");
  const priority = pickStr(row, "priority");
  const id = typeof row.id === "string" ? row.id : key;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t border-border hover:bg-muted/30"
    >
      <td className="px-2 py-2 w-6">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-3 py-2 font-mono">
        {key ? (
          <Link
            href={`/dashboard/projects/${projectId}/issues/${encodeURIComponent(key)}`}
            className="text-primary hover:underline"
          >
            {key}
          </Link>
        ) : "—"}
      </td>
      <td className="px-3 py-2 max-w-xs truncate" title={title}>{title || "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{status || "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{type || "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{priority || "—"}</td>
      <td className="px-3 py-2">
        {sprints.length > 0 && key ? (
          <Select onValueChange={(sprintId) => void onMoveToSprint(key, String(sprintId))}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Move to Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </td>
    </tr>
  );
}

export default function ProjectBacklogPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, backlog, sp] = await Promise.all([
        fetchProject(projectId),
        fetchBacklog(projectId),
        fetchProjectSprints(projectId),
      ]);
      setProjectName(proj.name);
      setRows(backlog);
      setSprints(sp.filter((s) => s.status !== "COMPLETED"));
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => (typeof r.id === "string" ? r.id : pickStr(r, "issueKey")) === active.id);
    const newIndex = rows.findIndex((r) => (typeof r.id === "string" ? r.id : pickStr(r, "issueKey")) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(rows, oldIndex, newIndex);
    setRows(reordered);

    const issueKey = pickStr(rows[oldIndex], "issueKey");
    if (!issueKey) return;
    try {
      await reorderIssue(projectId, issueKey, pickStr(rows[oldIndex], "status"), newIndex);
    } catch {
      setRows(rows);
    }
  }

  async function handleMoveToSprint(issueKey: string, sprintId: string) {
    try {
      await addIssueToSprint(projectId, sprintId, issueKey);
      setRows((prev) => prev.filter((r) => pickStr(r, "issueKey") !== issueKey));
    } catch (e) {
      setError(getApiErrorMessage(e, "Không chuyển được issue vào sprint."));
    }
  }

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

  const sortableIds = rows.map((r) => (typeof r.id === "string" ? r.id : pickStr(r, "issueKey")));

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
            <Button size="sm" variant="outline">Board</Button>
          </Link>
          <Link href={`/dashboard/projects/${projectId}/issues`}>
            <Button size="sm" variant="outline">Tìm issue</Button>
          </Link>
          <Dropdown
            align="right"
            contentClassName="w-[min(36rem,calc(100vw-1.25rem))] max-h-[min(90vh,36rem)] overflow-hidden p-0"
            trigger={
              <Button size="sm" variant="outline" type="button">Cài đặt</Button>
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
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Không có issue nào trong backlog.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} onDragEnd={(e) => void handleDragEnd(e)}>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left border-b border-border">
                      <th className="px-2 py-2 w-6" />
                      <th className="px-3 py-2 font-medium">Key</th>
                      <th className="px-3 py-2 font-medium">Tiêu đề</th>
                      <th className="px-3 py-2 font-medium">Trạng thái</th>
                      <th className="px-3 py-2 font-medium">Loại</th>
                      <th className="px-3 py-2 font-medium">Ưu tiên</th>
                      <th className="px-3 py-2 font-medium">Sprint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <SortableRow
                        key={typeof r.id === "string" ? r.id : pickStr(r, "issueKey")}
                        row={r}
                        projectId={projectId}
                        sprints={sprints}
                        onMoveToSprint={handleMoveToSprint}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
