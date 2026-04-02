export const dynamic = "force-dynamic";

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Settings, SquareStack } from "lucide-react";
import { ProjectSettingsPanel } from "@/components/projects/ProjectSettingsPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import {
  createIssue,
  fetchIssueBoard,
  fetchProject,
  fetchProjectLabels,
  fetchProjectMembersPage,
  fetchProjectSprints,
  reorderIssue,
  updateIssueStatus,
} from "@/lib/projects-issues-api";
import type {
  BoardIssue,
  IssuePriorityBE,
  IssueStatusBE,
  IssueTypeBE,
  Label as ProjectLabel,
  Sprint,
} from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { joinProject, leaveProjectSocketRoom, subscribeKanban } from "@/lib/socket";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

const COLUMN_ORDER: { status: IssueStatusBE; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "IN_REVIEW", label: "In review" },
  { status: "DONE", label: "Done" },
  { status: "CANCELLED", label: "Cancelled" },
];

const TYPES: IssueTypeBE[] = ["TASK", "BUG", "STORY", "EPIC", "SUBTASK"];
const PRIORITIES: IssuePriorityBE[] = ["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"];

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "");

  const [projectName, setProjectName] = React.useState("");
  const [board, setBoard] = React.useState<Record<IssueStatusBE, BoardIssue[]> | null>(null);
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeIssue, setActiveIssue] = React.useState<BoardIssue | null>(null);
  const [justDraggedIssueKey, setJustDraggedIssueKey] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createStatus, setCreateStatus] = React.useState<IssueStatusBE>("TODO");
  const [createTitle, setCreateTitle] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createType, setCreateType] = React.useState<IssueTypeBE>("TASK");
  const [createPriority, setCreatePriority] = React.useState<IssuePriorityBE>("MEDIUM");
  const [createAssigneeId, setCreateAssigneeId] = React.useState("");
  const [modalMembers, setModalMembers] = React.useState<{ id: string; name: string }[]>([]);
  const [modalLabels, setModalLabels] = React.useState<ProjectLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<Set<string>>(new Set());
  const [submittingCreate, setSubmittingCreate] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Khoảng cách tối thiểu trước khi bắt đầu drag — tap/trackpad 1 nhấp không kích hoạt kéo.
      activationConstraint: { distance: 10 },
    })
  );

  const boardScrollRef = React.useRef<HTMLDivElement | null>(null);
  const boardPanRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    active: boolean;
    decided: boolean;
  } | null>(null);

  function boardStripPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-issue-card]") || t.closest("button") || t.closest("a")) return;
    const el = boardScrollRef.current;
    if (!el) return;
    boardPanRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      active: false,
      decided: false,
    };
  }

  function boardStripPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = boardPanRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    const el = boardScrollRef.current;
    if (!el) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.decided) {
      const thresh = 8;
      if (Math.abs(dx) < thresh && Math.abs(dy) < thresh) return;
      state.decided = true;
      if (Math.abs(dx) <= Math.abs(dy)) {
        boardPanRef.current = null;
        return;
      }
      state.active = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      el.classList.add("cursor-grabbing");
    }
    if (state.active) {
      el.scrollLeft = state.scrollLeft - dx;
      e.preventDefault();
    }
  }

  function boardStripPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = boardPanRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    const el = boardScrollRef.current;
    if (state.active) {
      try {
        if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    el?.classList.remove("cursor-grabbing");
    boardPanRef.current = null;
  }

  const load = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const actualSprintId = selectedSprintId === "all" ? "" : selectedSprintId;
      const [proj, sp, b] = await Promise.all([
        fetchProject(projectId),
        fetchProjectSprints(projectId),
        fetchIssueBoard(projectId, actualSprintId || undefined),
      ]);
      setProjectName(proj.name);
      setSprints(sp);
      setBoard(b);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được board."));
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedSprintId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!projectId || !isNestBackendConfigured()) return;
    joinProject(projectId);
    const off = subscribeKanban(() => {
      void load();
    });
    return () => {
      leaveProjectSocketRoom(projectId);
      if (typeof off === "function") off();
    };
  }, [projectId, load]);

  function toggleModalLabel(id: string) {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  React.useEffect(() => {
    if (!createOpen || !projectId || !isNestBackendConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const [memPage, labPage] = await Promise.all([
          fetchProjectMembersPage(projectId, 1, 100),
          fetchProjectLabels(projectId, 1, 100),
        ]);
        if (cancelled) return;
        setModalMembers(memPage.data.map((m) => ({ id: m.userId, name: m.user?.fullName ?? m.userId })));
        setModalLabels(labPage.data);
      } catch {
        if (!cancelled) {
          setModalMembers([]);
          setModalLabels([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createOpen, projectId]);

  function openCreateModal(status: IssueStatusBE) {
    setCreateStatus(status);
    setCreateTitle("");
    setCreateDescription("");
    setCreateType("TASK");
    setCreatePriority("MEDIUM");
    setCreateAssigneeId("");
    setSelectedLabelIds(new Set());
    setCreateOpen(true);
  }

  async function handleCreateFromModal() {
    const title = createTitle.trim();
    if (!title || submittingCreate) return;

    setSubmittingCreate(true);
    try {
      const labelIds = Array.from(selectedLabelIds);
      const created = await createIssue(projectId, {
        title,
        description: createDescription.trim() || undefined,
        type: createType,
        priority: createPriority,
        ...(createAssigneeId ? { assigneeId: createAssigneeId } : {}),
        ...(labelIds.length > 0 ? { labelIds } : {}),
      });

      const createdIssueKey = String((created as { issueKey?: string }).issueKey ?? "");
      if (createdIssueKey && createStatus !== "TODO") {
        await updateIssueStatus(projectId, createdIssueKey, createStatus);
      }

      setCreateOpen(false);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tạo được issue mới."));
    } finally {
      setSubmittingCreate(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    if (board) {
      for (const col of Object.values(board)) {
        const found = col.find((i) => i.issueKey === active.id);
        if (found) {
          setActiveIssue(found);
          break;
        }
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setActiveIssue(null);
    const { active, over } = event;
    const draggedIssueKey = active.id as string;
    setJustDraggedIssueKey(draggedIssueKey);
    window.setTimeout(() => setJustDraggedIssueKey(null), 220);
    if (!over || !board) return;

    const issueKey = draggedIssueKey;
    const newStatus = over.id as IssueStatusBE;

    let oldStatus: IssueStatusBE | null = null;
    let issue: BoardIssue | null = null;
    for (const [status, issues] of Object.entries(board)) {
      const found = issues.find((i) => i.issueKey === issueKey);
      if (found) {
        oldStatus = status as IssueStatusBE;
        issue = found;
        break;
      }
    }

    if (!issue || !oldStatus) return;

    const newBoard = { ...board };
    newBoard[oldStatus] = newBoard[oldStatus].filter((i) => i.issueKey !== issueKey);
    const updatedIssue = { ...issue, status: newStatus };
    newBoard[newStatus] = [...newBoard[newStatus], updatedIssue];
    setBoard(newBoard);

    try {
      const position = newBoard[newStatus].findIndex((i) => i.issueKey === issueKey);
      if (position < 0) {
        await load();
        return;
      }
      await reorderIssue(projectId, issueKey, newStatus, position);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không cập nhật được vị trí / trạng thái trên board."));
      await load();
    }
  }

  if (!isNestBackendConfigured()) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Đặt NEXT_PUBLIC_API_URL trỏ Nest và đăng nhập để xem board.</p>
        <Link href="/dashboard/projects" className="text-primary text-sm mt-2 inline-block">
          ← Danh sách project
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/dashboard/projects" className="text-xs text-muted-foreground hover:text-foreground">
                ← Projects
              </Link>
              <h1 className="mt-0.5 text-lg font-semibold text-foreground">
                Board{projectName ? `: ${projectName}` : ""}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedSprintId} onValueChange={(val) => setSelectedSprintId(val || "") }>
                <SelectTrigger className="h-8 w-[210px] text-xs">
                  <SelectValue placeholder="Tất cả (Backlog + Sprints)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả (Backlog + Sprints)</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openCreateModal("TODO")}>
                  <Plus className="h-3.5 w-3.5" />
                  Tạo issue
                </Button>
                <Link href={`/dashboard/projects/${projectId}/issues`}>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <Search className="h-3.5 w-3.5" />
                    Tìm issue
                  </Button>
                </Link>
                <Link href={`/dashboard/projects/${projectId}/backlog`}>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <SquareStack className="h-3.5 w-3.5" />
                    Backlog
                  </Button>
                </Link>
                <Dropdown
                  align="right"
                  contentClassName="w-[min(36rem,calc(100vw-1.25rem))] max-h-[min(90vh,36rem)] overflow-hidden p-0"
                  trigger={
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" type="button">
                      <Settings className="h-3.5 w-3.5" />
                      Cài đặt
                    </Button>
                  }
                >
                  <div className="flex max-h-[min(90vh,36rem)] flex-col p-4 text-left">
                    <p className="text-sm font-semibold text-foreground">Cài đặt project</p>
                    {projectName ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{projectName}</p>
                    ) : null}
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
          </div>
        </div>

     

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading && !board ? (
          <p className="text-sm text-muted-foreground">Đang tải board…</p>
        ) : board ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
              ref={boardScrollRef}
              className="overflow-x-auto rounded-lg border border-border/60 bg-muted/20 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onPointerDown={boardStripPointerDown}
              onPointerMove={boardStripPointerMove}
              onPointerUp={boardStripPointerUp}
              onPointerCancel={boardStripPointerUp}
            >
              <div className="inline-flex w-max min-w-full flex-col p-2">
                <div className="flex min-h-[480px] gap-2.5 pb-2">
                  {COLUMN_ORDER.map((col, colIndex) => {
                    const issues = board[col.status] ?? [];
                    return (
                      <motion.div
                        key={col.status}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: colIndex * 0.03, ease: "easeOut" }}
                        className="w-[250px] shrink-0"
                      >
                        <DroppableColumn
                          status={col.status}
                          label={col.label}
                          issues={issues}
                          onOpenIssue={(issueKey) =>
                            router.push(
                              `/dashboard/projects/${projectId}/issues/${encodeURIComponent(issueKey)}`
                            )
                          }
                          justDraggedIssueKey={justDraggedIssueKey}
                          onOpenCreateModal={openCreateModal}
                        />
                      </motion.div>
                    );
                  })}
                </div>
                {/* Vùng trống dưới cột: nhấn–kéo ngang để cuộn board (không hiển thị thanh UI) */}
                <div
                  role="presentation"
                  aria-hidden
                  title="Kéo ngang để cuộn board"
                  className="min-h-[min(12rem,24vh)] w-full shrink-0 cursor-grab select-none active:cursor-grabbing"
                />
              </div>
            </div>
            <DragOverlay>
              {activeId && activeIssue ? (
                <IssueCard issue={activeIssue} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : null}
      </div>

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          if (!submittingCreate) setCreateOpen(open);
        }}
        className="max-w-2xl"
        title={`Tạo thẻ mới (${createStatus})`}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submittingCreate}>
              Hủy
            </Button>
            <Button onClick={() => void handleCreateFromModal()} disabled={submittingCreate || !createTitle.trim()}>
              {submittingCreate ? "Đang tạo…" : "Tạo thẻ"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-title">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quick-title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Mô tả ngắn công việc"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-desc">Mô tả</Label>
            <Textarea
              id="quick-desc"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-type">Loại</Label>
              <Select value={createType} onValueChange={(v) => setCreateType((v || "TASK") as IssueTypeBE)}>
                <SelectTrigger id="quick-type">
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
              <Label htmlFor="quick-priority">Độ ưu tiên</Label>
              <Select
                value={createPriority}
                onValueChange={(v) => setCreatePriority((v || "MEDIUM") as IssuePriorityBE)}
              >
                <SelectTrigger id="quick-priority">
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
            <Label htmlFor="quick-assignee">Người phụ trách (tuỳ chọn)</Label>
            <Select
              value={createAssigneeId || "unassigned"}
              onValueChange={(v) => setCreateAssigneeId(v === "unassigned" ? "" : (v || ""))}
            >
              <SelectTrigger id="quick-assignee">
                <SelectValue placeholder="— Không gán —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">— Không gán —</SelectItem>
                {modalMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {modalLabels.length > 0 && (
            <div className="space-y-2">
              <Label>Nhãn (tuỳ chọn)</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-3">
                {modalLabels.map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedLabelIds.has(l.id)}
                      onChange={() => toggleModalLabel(l.id)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function DroppableColumn({
  status,
  label,
  issues,
  onOpenIssue,
  justDraggedIssueKey,
  onOpenCreateModal,
}: {
  status: IssueStatusBE;
  label: string;
  issues: BoardIssue[];
  onOpenIssue: (issueKey: string) => void;
  justDraggedIssueKey: string | null;
  onOpenCreateModal: (status: IssueStatusBE) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Card className={`flex h-full flex-col overflow-hidden border transition-colors ${isOver ? "border-primary/50 bg-muted/60" : "bg-card"}`}>
      <div className="p-2 pb-1.5">
        <h2 className="rounded-md bg-foreground px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-background">
          {label} <span className="font-normal text-muted-foreground">({issues.length})</span>
        </h2>
      </div>

      <div ref={setNodeRef} className="flex min-h-[220px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {issues.map((issue) => (
          <DraggableIssue
            key={issue.issueKey}
            issue={issue}
            onOpenIssue={onOpenIssue}
            justDraggedIssueKey={justDraggedIssueKey}
          />
        ))}
      </div>

      <div className="px-2 pb-2">
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => onOpenCreateModal(status)}
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm thẻ
        </button>
      </div>
    </Card>
  );
}

function DraggableIssue({
  issue,
  onOpenIssue,
  justDraggedIssueKey,
}: {
  issue: BoardIssue;
  onOpenIssue: (issueKey: string) => void;
  justDraggedIssueKey: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.issueKey });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-issue-card
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
      onClick={() => {
        if (justDraggedIssueKey === issue.issueKey) return;
        onOpenIssue(issue.issueKey);
      }}
    >
      <IssueCard issue={issue} />
    </div>
  );
}

function IssueCard({ issue, isOverlay }: { issue: BoardIssue; isOverlay?: boolean }) {
  return (
    <Card className={`rounded-md border-border/80 bg-card p-2 shadow-sm transition-all hover:border-border hover:shadow-md ${isOverlay ? "scale-105 rotate-1 shadow-lg" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-[11px] font-semibold leading-snug text-foreground">{issue.issueKey}</span>
        <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {issue.type}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{issue.title}</p>
      {issue.assignee && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-foreground">
            {issue.assignee.fullName.slice(0, 1).toUpperCase()}
          </span>
          <p className="truncate text-[10px] text-muted-foreground">{issue.assignee.fullName}</p>
        </div>
      )}
    </Card>
  );
}
