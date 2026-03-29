"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Input, Label } from "@/components/ui";
import { fetchMe, getApiErrorMessage } from "@/lib/api";
import {
  fetchProject,
  fetchProjectMembersPage,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  leaveProject,
  fetchProjectLabels,
  createProjectLabel,
  updateProjectLabel,
  deleteProjectLabel,
  fetchProjectSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
} from "@/lib/projects-issues-api";
import type { ProjectMemberRow } from "@/lib/projects-issues-api";
import type { Label as ProjectLabel, ProjectSummary, Sprint } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { LabelColorPicker } from "@/components/projects/label-color-picker";
import { ProjectGeneralSettingsCard } from "@/components/projects/ProjectGeneralSettingsCard";
import {
  canCreateOrEditLabel,
  canDeleteLabel,
  canManageMembers,
  canManageSprints,
} from "@/lib/project-role";

/** PR này gói client API + settings UI; tách PR nhỏ hơn khi codebase ổn định. */
export type ProjectSettingsTab = "general" | "members" | "labels" | "sprints";

export type ProjectSettingsPanelProps = {
  projectId: string;
  /** `page` — tabs + Card như trang settings; `embed` — gọn trong dropdown */
  variant: "page" | "embed";
  /** Mỗi lần load/mutation xong (để board đồng bộ tên project, v.v.) */
  onDataChanged?: () => void;
  /** Lần đầu tải xong */
  onProjectLoaded?: (info: { name: string }) => void;
};

const TABS: { id: ProjectSettingsTab; labelPage: string; labelEmbed: string }[] = [
  { id: "general", labelPage: "Chung", labelEmbed: "Chung" },
  { id: "members", labelPage: "Thành viên", labelEmbed: "Thành viên" },
  { id: "labels", labelPage: "Nhãn (Labels)", labelEmbed: "Nhãn" },
  { id: "sprints", labelPage: "Sprints", labelEmbed: "Sprints" },
];

export function ProjectSettingsPanel({
  projectId,
  variant,
  onDataChanged,
  onProjectLoaded,
}: ProjectSettingsPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<ProjectSettingsTab>("general");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [project, setProject] = React.useState<ProjectSummary | null>(null);
  const [members, setMembers] = React.useState<ProjectMemberRow[]>([]);
  const [myUserId, setMyUserId] = React.useState("");
  const [newMemberId, setNewMemberId] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState("MEMBER");

  const [labels, setLabels] = React.useState<ProjectLabel[]>([]);
  const [newLabelName, setNewLabelName] = React.useState("");
  const [newLabelColor, setNewLabelColor] = React.useState("#000000");
  const [editingLabelId, setEditingLabelId] = React.useState<string | null>(null);
  const [editLabelName, setEditLabelName] = React.useState("");
  const [editLabelColor, setEditLabelColor] = React.useState("#000000");

  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [newSprintName, setNewSprintName] = React.useState("");
  const [newSprintGoal, setNewSprintGoal] = React.useState("");
  const [newSprintStart, setNewSprintStart] = React.useState("");
  const [newSprintEnd, setNewSprintEnd] = React.useState("");
  const [editingSprintId, setEditingSprintId] = React.useState<string | null>(null);
  const [editSprintName, setEditSprintName] = React.useState("");
  const [editSprintGoal, setEditSprintGoal] = React.useState("");
  const [editSprintStart, setEditSprintStart] = React.useState("");
  const [editSprintEnd, setEditSprintEnd] = React.useState("");

  const onDataChangedRef = React.useRef(onDataChanged);
  const onProjectLoadedRef = React.useRef(onProjectLoaded);
  React.useEffect(() => {
    onDataChangedRef.current = onDataChanged;
    onProjectLoadedRef.current = onProjectLoaded;
  }, [onDataChanged, onProjectLoaded]);

  const loadAll = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) {
      setLoading(false);
      if (!isNestBackendConfigured()) setError("Cần NEXT_PUBLIC_API_URL trỏ Nest.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [proj, memPage, labPage, sp, me] = await Promise.all([
        fetchProject(projectId),
        fetchProjectMembersPage(projectId, 1, 100),
        fetchProjectLabels(projectId, 1, 100),
        fetchProjectSprints(projectId),
        fetchMe(),
      ]);
      onProjectLoadedRef.current?.({ name: proj.name });
      setProject(proj);
      setMembers(memPage.data);
      setLabels(labPage.data);
      setSprints(sp);
      setMyUserId(me.id);
      onDataChangedRef.current?.();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được project."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const myRole = React.useMemo(
    () => members.find((m) => m.userId === myUserId)?.role ?? "",
    [members, myUserId]
  );

  const generalPrefetched = React.useMemo(
    () => (project ? { project, myRole } : undefined),
    [project, myRole]
  );

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberId.trim()) return;
    try {
      await addProjectMember(projectId, newMemberId.trim(), newMemberRole);
      setNewMemberId("");
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thêm được thành viên."));
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    try {
      await updateProjectMemberRole(projectId, userId, role);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không đổi được vai trò."));
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Xóa thành viên này?")) return;
    try {
      await removeProjectMember(projectId, userId);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  async function handleLeaveProject() {
    if (!confirm("Rời khỏi project này?")) return;
    try {
      await leaveProject(projectId);
      router.push("/dashboard/projects");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không rời được."));
    }
  }

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      await createProjectLabel(projectId, { name: newLabelName.trim(), color: newLabelColor });
      setNewLabelName("");
      setNewLabelColor("#000000");
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không tạo được nhãn."));
    }
  }

  async function handleDeleteLabel(labelId: string) {
    if (!confirm("Xóa nhãn này?")) return;
    try {
      await deleteProjectLabel(projectId, labelId);
      if (editingLabelId === labelId) setEditingLabelId(null);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  async function handleSaveLabelEdit(e: React.FormEvent, labelId: string) {
    e.preventDefault();
    if (!editLabelName.trim()) return;
    try {
      await updateProjectLabel(projectId, labelId, { name: editLabelName.trim(), color: editLabelColor });
      setEditingLabelId(null);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không cập nhật được nhãn."));
    }
  }

  async function handleAddSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    try {
      await createSprint(projectId, {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
        startDate: newSprintStart ? new Date(newSprintStart).toISOString() : undefined,
        endDate: newSprintEnd ? new Date(newSprintEnd).toISOString() : undefined,
      });
      setNewSprintName("");
      setNewSprintGoal("");
      setNewSprintStart("");
      setNewSprintEnd("");
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không tạo được sprint."));
    }
  }

  async function handleDeleteSprint(sprintId: string) {
    if (!confirm("Xóa sprint này?")) return;
    try {
      await deleteSprint(projectId, sprintId);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  async function handleStartSprint(sprintId: string) {
    try {
      await startSprint(projectId, sprintId);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không bắt đầu sprint được."));
    }
  }

  async function handleCompleteSprint(sprintId: string) {
    if (!confirm("Hoàn thành sprint này? Các issue chưa xong sẽ chuyển về backlog.")) return;
    try {
      await completeSprint(projectId, sprintId);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không hoàn thành sprint được."));
    }
  }

  async function handleSaveSprintEdit(e: React.FormEvent, sprintId: string) {
    e.preventDefault();
    if (!editSprintName.trim()) return;
    try {
      await updateSprint(projectId, sprintId, {
        name: editSprintName.trim(),
        goal: editSprintGoal.trim() || undefined,
        startDate: editSprintStart ? new Date(editSprintStart).toISOString() : undefined,
        endDate: editSprintEnd ? new Date(editSprintEnd).toISOString() : undefined,
      });
      setEditingSprintId(null);
      await loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không cập nhật được sprint."));
    }
  }

  const tabBarClass =
    variant === "embed"
      ? "mb-3 flex gap-0.5 overflow-x-auto border-b border-border pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      : "mb-6 flex gap-4 border-b border-border";

  const tabBtnClass = (t: ProjectSettingsTab) =>
    variant === "embed"
      ? `shrink-0 border-b-2 px-2 py-2 text-xs font-medium transition-colors ${
          activeTab === t
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`
      : `border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
          activeTab === t
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`;

  const sectionCardClass = variant === "embed" ? "space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm" : "space-y-6 p-6";

  const headingClass = variant === "embed" ? "text-base font-medium" : "text-lg font-medium";

  if (loading) {
    return (
      <div className={`text-sm text-muted-foreground ${variant === "embed" ? "py-6" : "p-6"}`}>
        Đang tải…
      </div>
    );
  }

  return (
    <div className={variant === "embed" ? "flex min-h-0 min-w-0 flex-1 flex-col" : ""}>
      {error && (
        <p className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className={tabBarClass}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={tabBtnClass(tab.id)}
          >
            {variant === "embed" ? tab.labelEmbed : tab.labelPage}
          </button>
        ))}
      </div>

      <div
        className={
          variant === "embed"
            ? "min-h-0 min-w-0 max-h-[min(70vh,520px)] flex-1 overflow-y-auto overflow-x-hidden pr-1"
            : ""
        }
      >
        {activeTab === "general" && (
          <ProjectGeneralSettingsCard
            projectId={projectId}
            variant={variant === "embed" ? "embed" : "page"}
            prefetched={generalPrefetched}
            onSaved={() => {
              void loadAll();
            }}
          />
        )}

        {activeTab === "members" && (
          <Card className={sectionCardClass}>
            {canManageMembers(myRole) && (
              <div>
                <h3 className={`${headingClass} mb-4`}>Thêm thành viên</h3>
                <form onSubmit={(e) => void handleAddMember(e)} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[160px] flex-1 space-y-2">
                    <Label htmlFor={`${variant}-new-member-id`}>User ID (UUID)</Label>
                    <Input
                      id={`${variant}-new-member-id`}
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      placeholder="Nhập ID người dùng..."
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Vai trò</Label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                  <Button type="submit">Thêm</Button>
                </form>
              </div>
            )}

            <div>
              <h3 className={`${headingClass} mb-4`}>Danh sách thành viên</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium">Người dùng</th>
                      <th className="px-3 py-2 font-medium">Vai trò</th>
                      <th className="px-3 py-2 text-right font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isMe = m.userId === myUserId;
                      return (
                        <tr key={m.userId} className="border-t border-border">
                          <td className="px-3 py-2">
                            <div className="font-medium">
                              {m.user?.fullName ?? "—"} {isMe && "(Bạn)"}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.user?.email ?? "—"}</div>
                          </td>
                          <td className="px-3 py-2">
                            {canManageMembers(myRole) ? (
                              <select
                                value={m.role}
                                onChange={(e) => void handleUpdateRole(m.userId, e.target.value)}
                                disabled={m.role === "OWNER" && isMe}
                                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                              >
                                <option value="OWNER">OWNER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="MEMBER">MEMBER</option>
                                <option value="VIEWER">VIEWER</option>
                              </select>
                            ) : (
                              <span className="text-xs font-medium">{m.role}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isMe ? (
                              <Button variant="outline" size="sm" onClick={() => void handleLeaveProject()}>
                                Rời nhóm
                              </Button>
                            ) : canManageMembers(myRole) ? (
                              <Button variant="destructive" size="sm" onClick={() => void handleRemoveMember(m.userId)}>
                                Xóa
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "labels" && (
          <Card className={sectionCardClass}>
            {canCreateOrEditLabel(myRole) && (
              <div>
                <h3 className={`${headingClass} mb-4`}>Tạo nhãn mới</h3>
                <form onSubmit={(e) => void handleAddLabel(e)} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[160px] flex-1 space-y-2">
                    <Label htmlFor={`${variant}-new-label-name`}>Tên nhãn</Label>
                    <Input
                      id={`${variant}-new-label-name`}
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="VD: bug, feature..."
                      required
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label htmlFor={`${variant}-new-label-color`}>Màu sắc</Label>
                    <LabelColorPicker
                      id={`${variant}-new-label-color`}
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Tạo</Button>
                </form>
              </div>
            )}
            {!canCreateOrEditLabel(myRole) && (
              <p className="text-sm text-muted-foreground">
                Vai trò <strong>VIEWER</strong> chỉ xem nhãn; tạo/sửa cần MEMBER trở lên; xóa nhãn cần ADMIN/OWNER.
              </p>
            )}

            <div>
              <h3 className={`${headingClass} mb-4`}>Danh sách nhãn</h3>
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có nhãn nào.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {labels.map((l) =>
                    editingLabelId === l.id ? (
                      <form
                        key={l.id}
                        onSubmit={(e) => void handleSaveLabelEdit(e, l.id)}
                        className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/20 p-3"
                      >
                        <div className="min-w-[120px] flex-1 space-y-1">
                          <Label className="text-xs">Tên</Label>
                          <Input value={editLabelName} onChange={(e) => setEditLabelName(e.target.value)} required />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs" htmlFor={`${variant}-edit-label-${l.id}`}>
                            Màu
                          </Label>
                          <LabelColorPicker
                            id={`${variant}-edit-label-${l.id}`}
                            value={editLabelColor}
                            onChange={(e) => setEditLabelColor(e.target.value)}
                          />
                        </div>
                        <Button type="submit" size="sm">
                          Lưu
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingLabelId(null)}>
                          Hủy
                        </Button>
                      </form>
                    ) : (
                      <div
                        key={l.id}
                        className="flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/30 py-1 pl-3 pr-1"
                      >
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="truncate text-sm font-medium">{l.name}</span>
                        {canCreateOrEditLabel(myRole) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLabelId(l.id);
                              setEditLabelName(l.name);
                              setEditLabelColor(l.color);
                            }}
                            className="rounded-full px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                          >
                            Sửa
                          </button>
                        )}
                        {canDeleteLabel(myRole) && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteLabel(l.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Xóa nhãn"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "sprints" && (
          <Card className={sectionCardClass}>
            {canManageSprints(myRole) && (
              <div>
                <h3 className={`${headingClass} mb-4`}>Tạo Sprint mới</h3>
                <form onSubmit={(e) => void handleAddSprint(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${variant}-new-sprint-name`}>
                      Tên Sprint <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`${variant}-new-sprint-name`}
                      value={newSprintName}
                      onChange={(e) => setNewSprintName(e.target.value)}
                      placeholder="VD: Sprint 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${variant}-new-sprint-goal`}>Mục tiêu (Goal)</Label>
                    <Input
                      id={`${variant}-new-sprint-goal`}
                      value={newSprintGoal}
                      onChange={(e) => setNewSprintGoal(e.target.value)}
                      placeholder="Hoàn thành tính năng..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${variant}-new-sprint-start`}>Ngày bắt đầu</Label>
                    <Input
                      id={`${variant}-new-sprint-start`}
                      type="datetime-local"
                      value={newSprintStart}
                      onChange={(e) => setNewSprintStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${variant}-new-sprint-end`}>Ngày kết thúc</Label>
                    <Input
                      id={`${variant}-new-sprint-end`}
                      type="datetime-local"
                      value={newSprintEnd}
                      onChange={(e) => setNewSprintEnd(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit">Tạo Sprint</Button>
                  </div>
                </form>
              </div>
            )}
            {!canManageSprints(myRole) && (
              <p className="mb-4 text-sm text-muted-foreground">
                Tạo / sửa / bắt đầu / hoàn thành sprint cần vai trò <strong>ADMIN</strong> hoặc <strong>OWNER</strong>.
              </p>
            )}

            <div>
              <h3 className={`${headingClass} mb-4`}>Danh sách Sprint</h3>
              {sprints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có sprint nào.</p>
              ) : (
                <div className="space-y-4">
                  {sprints.map((s) => (
                    <div key={s.id} className="rounded-lg border border-border bg-muted/20 p-4">
                      {editingSprintId === s.id && s.status === "PLANNING" && canManageSprints(myRole) ? (
                        <form onSubmit={(e) => void handleSaveSprintEdit(e, s.id)} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Tên sprint</Label>
                              <Input value={editSprintName} onChange={(e) => setEditSprintName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Mục tiêu</Label>
                              <Input value={editSprintGoal} onChange={(e) => setEditSprintGoal(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Ngày bắt đầu</Label>
                              <Input
                                type="datetime-local"
                                value={editSprintStart}
                                onChange={(e) => setEditSprintStart(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Ngày kết thúc</Label>
                              <Input
                                type="datetime-local"
                                value={editSprintEnd}
                                onChange={(e) => setEditSprintEnd(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm">
                              Lưu
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingSprintId(null)}>
                              Hủy
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-foreground">{s.name}</h4>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  s.status === "ACTIVE"
                                    ? "bg-primary/15 text-primary"
                                    : s.status === "COMPLETED"
                                      ? "bg-green-500/15 text-green-600"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {s.status}
                              </span>
                              <Link
                                href={`/dashboard/projects/${projectId}/sprints/${s.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                Chi tiết
                              </Link>
                            </div>
                            {s.goal && <p className="mt-1 text-sm text-muted-foreground">{s.goal}</p>}
                            <p className="mt-2 text-xs text-muted-foreground">
                              {s.startDate ? new Date(s.startDate).toLocaleDateString() : "Chưa có"} -{" "}
                              {s.endDate ? new Date(s.endDate).toLocaleDateString() : "Chưa có"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {canManageSprints(myRole) && s.status === "PLANNING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSprintId(s.id);
                                    setEditSprintName(s.name);
                                    setEditSprintGoal(s.goal ?? "");
                                    setEditSprintStart(
                                      s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : ""
                                    );
                                    setEditSprintEnd(
                                      s.endDate ? new Date(s.endDate).toISOString().slice(0, 16) : ""
                                    );
                                  }}
                                >
                                  Sửa
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => void handleStartSprint(s.id)}>
                                  Bắt đầu
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => void handleDeleteSprint(s.id)}>
                                  Xóa
                                </Button>
                              </>
                            )}
                            {canManageSprints(myRole) && s.status === "ACTIVE" && (
                              <Button size="sm" variant="default" onClick={() => void handleCompleteSprint(s.id)}>
                                Hoàn thành
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {variant === "embed" && (
        <div className="mt-3 shrink-0 border-t border-border pt-3">
          <Link
            href={`/dashboard/projects/${projectId}/settings`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Mở cài đặt trên trang riêng →
          </Link>
        </div>
      )}
    </div>
  );
}
