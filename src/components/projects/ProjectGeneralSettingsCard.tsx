"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { getApiErrorMessage, fetchMe } from "@/lib/api";
import { fetchProject, updateProject, deleteProject, fetchProjectMembersPage } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { canManageProjectDanger } from "@/lib/project-role";

export type ProjectGeneralSettingsCardProps = {
  projectId: string;
  onSaved?: () => void;
  /** `page` — bọc Card như trang cài đặt; `embed` — chỉ nội dung (dropdown/popover) */
  variant?: "page" | "embed";
};

export function ProjectGeneralSettingsCard({
  projectId,
  onSaved,
  variant = "page",
}: ProjectGeneralSettingsCardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [projKey, setProjKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [myRole, setMyRole] = React.useState("");
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
      setName(proj.name);
      setProjKey(proj.key);
      setDescription(proj.description ?? "");
      setMyRole(memPage.data.find((m) => m.userId === me.id)?.role ?? "");
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
    void load();
  }, [load]);

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await updateProject(projectId, { name, description });
      onSaved?.();
      alert("Cập nhật thành công!");
    } catch (err) {
      alert(getApiErrorMessage(err, "Không cập nhật được."));
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
      alert(getApiErrorMessage(err, "Không xóa được project."));
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
