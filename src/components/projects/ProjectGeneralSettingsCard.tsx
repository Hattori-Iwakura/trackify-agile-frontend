"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Input, Label } from "@/components/ui";
import { getApiErrorMessage, fetchMe } from "@/lib/api";
import { fetchProject, updateProject, deleteProject, fetchProjectMembersPage } from "@/lib/projects-issues-api";
import type { ProjectSummary } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { canManageProjectDanger } from "@/lib/project-role";

export type ProjectGeneralSettingsCardProps = {
  projectId: string;
  onSaved?: () => void;
  /** `page` — bọc Card như trang cài đặt; `embed` — chỉ nội dung (dropdown/popover) */
  variant?: "page" | "embed";
  /**
   * Dữ liệu đã tải bởi ProjectSettingsPanel.loadAll — tránh gọi lại fetchProject + fetchProjectMembersPage + fetchMe.
   */
  prefetched?: {
    project: ProjectSummary;
    myRole: string;
  };
};

function applyProjectToForm(
  proj: ProjectSummary,
  role: string,
  setters: {
    setName: (v: string) => void;
    setProjKey: (v: string) => void;
    setDescription: (v: string) => void;
    setMyRole: (v: string) => void;
  }
) {
  setters.setName(proj.name);
  setters.setProjKey(proj.key);
  setters.setDescription(proj.description ?? "");
  setters.setMyRole(role);
}

export function ProjectGeneralSettingsCard({
  projectId,
  onSaved,
  variant = "page",
  prefetched,
}: ProjectGeneralSettingsCardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(!prefetched);
  const [name, setName] = React.useState(prefetched?.project.name ?? "");
  const [projKey, setProjKey] = React.useState(prefetched?.project.key ?? "");
  const [description, setDescription] = React.useState(prefetched?.project.description ?? "");
  const [myRole, setMyRole] = React.useState(prefetched?.myRole ?? "");
  const [savingGeneral, setSavingGeneral] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!projectId || !isNestBackendConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [proj, memPage, me] = await Promise.all([
        fetchProject(projectId),
        fetchProjectMembersPage(projectId, 1, 100),
        fetchMe(),
      ]);
      applyProjectToForm(
        proj,
        memPage.data.find((m) => m.userId === me.id)?.role ?? "",
        { setName, setProjKey, setDescription, setMyRole }
      );
    } catch {
      setName("");
      setProjKey("");
      setDescription("");
      setMyRole("");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    if (prefetched) {
      applyProjectToForm(prefetched.project, prefetched.myRole, {
        setName,
        setProjKey,
        setDescription,
        setMyRole,
      });
      setLoading(false);
      return;
    }
    void load();
  }, [prefetched, load]);

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await updateProject(projectId, { name, description });
      onSaved?.();
      toast.success("Cập nhật thành công!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không cập nhật được."));
    } finally {
      setSavingGeneral(false);
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Bạn có chắc chắn muốn xóa project này? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteProject(projectId);
      router.push("/dashboard/projects");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không xóa được project."));
    }
  }

  if (loading) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  const body = (
    <>
      {canManageProjectDanger(myRole) ? (
        <form onSubmit={(e) => void handleUpdateProject(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Key (Không thể đổi)</Label>
            <Input value={projKey} disabled className="bg-muted font-mono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-name">
              Tên project <span className="text-destructive">*</span>
            </Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Mô tả</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={savingGeneral}>
            {savingGeneral ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chỉ <strong>OWNER</strong> mới chỉnh tên / mô tả project.
        </p>
      )}

      {canManageProjectDanger(myRole) && (
        <div className="border-t border-border pt-6">
          <h3 className="mb-2 text-lg font-medium text-destructive">Xóa Project</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Hành động này sẽ xóa toàn bộ issue, comment, và dữ liệu liên quan. Chỉ OWNER mới có quyền này.
          </p>
          <Button variant="destructive" onClick={() => void handleDeleteProject()}>
            Xóa Project
          </Button>
        </div>
      )}
    </>
  );

  if (variant === "embed") {
    return <div className="space-y-6">{body}</div>;
  }

  return <Card className="space-y-6 p-6">{body}</Card>;
}
