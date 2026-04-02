"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage, fetchMe } from "@/lib/api";
import {
  fetchIssue,
  updateIssue,
  deleteIssue,
  fetchIssueComments,
  postIssueComment,
  updateIssueComment,
  deleteIssueComment,
  fetchIssueAttachments,
  uploadIssueAttachment,
  deleteIssueAttachment,
  fetchProjectMembersPage,
  fetchProjectLabels,
  addIssueLabel,
  removeIssueLabel,
  fetchProjectSprints,
  addIssueToSprint,
  removeIssueFromSprint,
} from "@/lib/projects-issues-api";
import type { IssueComment, Attachment, Label as ProjectLabel, Sprint } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { subscribeComments } from "@/lib/socket";
import { CreateSubTaskModal } from "@/components/forms/CreateSubTaskModal";
import { resolvePublicFileUrl } from "@/lib/api-origin";
import { canDeleteIssue } from "@/lib/project-role";

function pickString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "");
  const issueKeyRaw = params.issueKey;
  const issueKey = decodeURIComponent(Array.isArray(issueKeyRaw) ? issueKeyRaw[0] : String(issueKeyRaw ?? ""));

  const [myUserId, setMyUserId] = React.useState("");
  const [issue, setIssue] = React.useState<Record<string, unknown> | null>(null);
  const [comments, setComments] = React.useState<IssueComment[]>([]);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit Issue State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editType, setEditType] = React.useState("");
  const [editPriority, setEditPriority] = React.useState("");
  const [editAssigneeId, setEditAssigneeId] = React.useState("");
  const [members, setMembers] = React.useState<{ id: string; name: string }[]>([]);

  // Labels State
  const [projectLabels, setProjectLabels] = React.useState<ProjectLabel[]>([]);
  const [issueLabels, setIssueLabels] = React.useState<ProjectLabel[]>([]);

  // Comments State
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editCommentText, setEditCommentText] = React.useState("");
  const [replyOpenForId, setReplyOpenForId] = React.useState<string | null>(null);
  const [replyDraft, setReplyDraft] = React.useState("");
  const [postingReply, setPostingReply] = React.useState(false);

  // Attachments State
  const [uploadingFile, setUploadingFile] = React.useState(false);

  // Sprints State
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [issueSprintId, setIssueSprintId] = React.useState<string | null>(null);
  const [myRole, setMyRole] = React.useState<string>("");

  // Subtask modal
  const [subTaskModalOpen, setSubTaskModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!projectId || !issueKey || !isNestBackendConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const [iss, comm, att, memPage, labPage, sp, me] = await Promise.all([
        fetchIssue(projectId, issueKey),
        fetchIssueComments(projectId, issueKey),
        fetchIssueAttachments(projectId, issueKey),
        fetchProjectMembersPage(projectId, 1, 100),
        fetchProjectLabels(projectId, 1, 100),
        fetchProjectSprints(projectId),
        fetchMe(),
      ]);
      setIssue(iss);
      setComments(comm);
      setAttachments(att);
      setMembers(memPage.data.map((m) => ({ id: m.userId, name: m.user?.fullName ?? m.userId })));
      setProjectLabels(labPage.data);
      setIssueLabels(
        ((iss.labels as { label: ProjectLabel }[] | undefined) ?? []).map((l) => l.label)
      );
      setSprints(sp);
      setIssueSprintId(pickString(iss, "sprintId") || null);
      setMyUserId(me.id);
      setMyRole(memPage.data.find((m) => m.userId === me.id)?.role ?? "");

      setEditTitle(pickString(iss, "title"));
      setEditDesc(pickString(iss, "description"));
      setEditType(pickString(iss, "type"));
      setEditPriority(pickString(iss, "priority"));
      setEditAssigneeId(pickString(iss, "assigneeId"));
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được issue."));
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, issueKey]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!issueKey || !isNestBackendConfigured()) return;
    const off = subscribeComments(issueKey, (data: unknown) => {
      const payload = data as { content?: string; authorId?: string };
      if (payload?.content) {
        void load();
      }
    });
    return () => {
      off?.();
    };
  }, [issueKey, load]);

  // --- Issue Actions ---
  async function handleSaveIssue(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateIssue(projectId, issueKey, {
        title: editTitle,
        description: editDesc,
        type: editType,
        priority: editPriority,
        assigneeId: editAssigneeId || null,
      });
      setIsEditing(false);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không lưu được."));
    }
  }

  async function handleDeleteIssue() {
    if (!confirm("Xóa issue này?")) return;
    try {
      await deleteIssue(projectId, issueKey);
      router.push(`/dashboard/projects/${projectId}/board`);
    } catch (err) {
      alert(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  // --- Label Actions ---
  async function handleToggleLabel(labelId: string, hasLabel: boolean) {
    try {
      if (hasLabel) {
        await removeIssueLabel(projectId, issueKey, labelId);
      } else {
        await addIssueLabel(projectId, issueKey, labelId);
      }
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không cập nhật được nhãn."));
    }
  }

  // --- Comment Actions ---
  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !projectId || !issueKey) return;
    setPosting(true);
    try {
      await postIssueComment(projectId, issueKey, text);
      setNewComment("");
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không gửi được bình luận."));
    } finally {
      setPosting(false);
    }
  }

  async function handlePostReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    const text = replyDraft.trim();
    if (!text || !projectId || !issueKey) return;
    setPostingReply(true);
    try {
      await postIssueComment(projectId, issueKey, text, parentId);
      setReplyDraft("");
      setReplyOpenForId(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không gửi được trả lời."));
    } finally {
      setPostingReply(false);
    }
  }

  async function handleSaveEditComment(commentId: string) {
    try {
      await updateIssueComment(projectId, issueKey, commentId, editCommentText);
      setEditingCommentId(null);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không sửa được."));
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Xóa bình luận này?")) return;
    try {
      await deleteIssueComment(projectId, issueKey, commentId);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  // --- Attachment Actions ---
  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      await uploadIssueAttachment(projectId, issueKey, file);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không tải lên được."));
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Xóa file này?")) return;
    try {
      await deleteIssueAttachment(projectId, issueKey, attachmentId);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không xóa được."));
    }
  }

  // --- Sprint Actions ---
  async function handleSprintChange(newSprintId: string) {
    try {
      if (issueSprintId) {
        await removeIssueFromSprint(projectId, issueSprintId, issueKey);
      }
      if (newSprintId) {
        await addIssueToSprint(projectId, newSprintId, issueKey);
      }
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, "Không cập nhật được sprint."));
    }
  }

  if (!isNestBackendConfigured()) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Cần NEXT_PUBLIC_API_URL trỏ Nest.</p>
      </Card>
    );
  }

  const subtasks = issue
    ? ((issue.subtasks ?? issue.children) as Record<string, unknown>[] | undefined) ?? []
    : [];

  const title = issue ? pickString(issue, "title") : "";
  const description = issue ? pickString(issue, "description") : "";
  const status = issue ? pickString(issue, "status") : "";
  const priority = issue ? pickString(issue, "priority") : "";
  const type = issue ? pickString(issue, "type") : "";
  const assignee = issue?.assignee as { fullName?: string } | null | undefined;

  function isMyComment(c: IssueComment): boolean {
    const aid = c.authorId ?? c.author?.id ?? "";
    return Boolean(myUserId && aid === myUserId);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <CreateSubTaskModal
        open={subTaskModalOpen}
        onOpenChange={setSubTaskModalOpen}
        projectId={projectId}
        parentIssueKey={issueKey}
        parentTaskName={title || issueKey}
        onCreated={() => void load()}
      />
      <div>
        <Link href={`/dashboard/projects/${projectId}/board`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Board
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !issue ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : issue ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardDescription className="font-mono text-primary">{issueKey}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Hủy sửa" : "Sửa"}
                  </Button>
                  {canDeleteIssue(myRole) && (
                    <Button variant="destructive" size="sm" onClick={() => void handleDeleteIssue()}>
                      Xóa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
              {isEditing ? (
                <form onSubmit={(e) => void handleSaveIssue(e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loại</Label>
                      <Select value={editType} onValueChange={(v) => setEditType(v || "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {["EPIC", "STORY", "TASK", "BUG", "SUBTASK"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Độ ưu tiên</Label>
                      <Select value={editPriority} onValueChange={(v) => setEditPriority(v || "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn độ ưu tiên" />
                        </SelectTrigger>
                        <SelectContent>
                          {["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"].map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Người phụ trách</Label>
                      <Select value={editAssigneeId || "unassigned"} onValueChange={(v) => setEditAssigneeId(v === "unassigned" ? "" : (v || ""))}>
                        <SelectTrigger>
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
                  </div>
                  <Button type="submit">Lưu thay đổi</Button>
                </form>
              ) : (
                <>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary">{status}</Badge>
                    <Badge variant="outline">{type}</Badge>
                    <Badge variant="outline">{priority}</Badge>
                    {assignee?.fullName && (
                      <Badge variant="secondary">Assignee: {assignee.fullName}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {issueLabels.map((l) => (
                      <Badge key={l.id} style={{ backgroundColor: l.color, color: 'white' }}>
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                  {description ? (
                    <p className="text-sm text-foreground mt-4 whitespace-pre-wrap">{description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-4">Không có mô tả.</p>
                  )}
                </>
              )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bình luận</CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={(e) => void handlePostComment(e)} className="space-y-3 mb-6">
                <Label htmlFor="new-comment">Thêm bình luận</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  placeholder="Nội dung…"
                />
                <Button type="submit" size="sm" disabled={posting || !newComment.trim()}>
                  {posting ? "Đang gửi…" : "Gửi"}
                </Button>
              </form>

              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <p className="text-xs text-muted-foreground">
                        {c.author?.fullName ?? "User"} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-end shrink-0">
                        {isMyComment(c) && (
                          <>
                            <button type="button" onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} className="text-xs text-primary hover:underline">Sửa</button>
                            <button type="button" onClick={() => void handleDeleteComment(c.id)} className="text-xs text-destructive hover:underline">Xóa</button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyOpenForId((prev) => (prev === c.id ? null : c.id));
                            setReplyDraft("");
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {replyOpenForId === c.id ? "Đóng trả lời" : "Trả lời"}
                        </button>
                      </div>
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void handleSaveEditComment(c.id)}>Lưu</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Hủy</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                    )}
                    {replyOpenForId === c.id && (
                      <form onSubmit={(e) => void handlePostReply(e, c.id)} className="mt-3 space-y-2 border-l-2 border-border pl-3">
                        <Textarea
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          rows={2}
                          maxLength={5000}
                          placeholder="Trả lời…"
                        />
                        <Button type="submit" size="sm" disabled={postingReply || !replyDraft.trim()}>
                          {postingReply ? "Đang gửi…" : "Gửi trả lời"}
                        </Button>
                      </form>
                    )}
                    {(c.replies?.length ?? 0) > 0 && (
                      <ul className="mt-3 ml-4 pl-3 border-l border-border space-y-3">
                        {c.replies!.map((r) => (
                          <li key={r.id}>
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <p className="text-xs text-muted-foreground">
                                {r.author?.fullName ?? "User"} · {new Date(r.createdAt).toLocaleString()}
                              </p>
                              {isMyComment(r) && (
                                <div className="flex gap-2 shrink-0">
                                  <button type="button" onClick={() => { setEditingCommentId(r.id); setEditCommentText(r.content); }} className="text-xs text-primary hover:underline">Sửa</button>
                                  <button type="button" onClick={() => void handleDeleteComment(r.id)} className="text-xs text-destructive hover:underline">Xóa</button>
                                </div>
                              )}
                            </div>
                            {editingCommentId === r.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => void handleSaveEditComment(r.id)}>Lưu</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Hủy</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              {comments.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg">Subtasks</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSubTaskModalOpen(true)}>
                  + Thêm subtask
                </Button>
              </CardHeader>
              <CardContent>
                {subtasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có subtask.</p>
                ) : (
                  <ul className="space-y-2">
                    {subtasks.map((s) => {
                      const sKey = pickString(s, "issueKey");
                      const sTitle = pickString(s, "title");
                      const sStatus = pickString(s, "status");
                      return (
                        <li key={sKey || sTitle} className="flex items-center justify-between gap-2 text-sm border border-border rounded-lg px-3 py-2">
                          <Link
                            href={`/dashboard/projects/${projectId}/issues/${encodeURIComponent(sKey)}`}
                            className="font-mono text-primary hover:underline shrink-0"
                          >
                            {sKey}
                          </Link>
                          <span className="flex-1 truncate text-foreground">{sTitle}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{sStatus}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sprint</CardTitle>
              </CardHeader>
              <CardContent>
              <Select value={issueSprintId || "backlog"} onValueChange={(v) => handleSprintChange(v === "backlog" ? "" : (v || ""))}>
                <SelectTrigger>
                  <SelectValue placeholder="— Backlog (Không có Sprint) —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">— Backlog (Không có Sprint) —</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Nhãn (Labels)</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projectLabels.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Project chưa có nhãn.</p>
                ) : (
                  projectLabels.map((l) => {
                    const hasLabel = issueLabels.some((il) => il.id === l.id);
                    return (
                      <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasLabel}
                          onChange={() => void handleToggleLabel(l.id, hasLabel)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name}
                      </label>
                    );
                  })
                )}
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Đính kèm</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">Chọn file</span>
                  <input
                    type="file"
                    onChange={(e) => void handleUploadFile(e)}
                    disabled={uploadingFile}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </label>
                {uploadingFile && <p className="text-xs text-muted-foreground">Đang tải lên...</p>}
                
                <ul className="space-y-2 mt-3">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between gap-2 text-xs border border-border p-2 rounded bg-muted/30">
                      <a href={resolvePublicFileUrl(att.url) || "#"} target="_blank" rel="noreferrer" className="truncate hover:underline text-primary">
                        {att.filename}
                      </a>
                      <button onClick={() => void handleDeleteAttachment(att.id)} className="text-destructive hover:underline shrink-0">
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
                {attachments.length === 0 && <p className="text-xs text-muted-foreground">Chưa có file nào.</p>}
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
