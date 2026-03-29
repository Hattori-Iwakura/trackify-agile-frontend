import { api, unwrapApiData } from "@/lib/api";
import { stripJsonContentTypeForFormData } from "@/lib/axios-form-data";
import type { PaginatedResult } from "@/lib/types/api";
import type {
  BoardData,
  IssueComment,
  Label,
  Attachment,
  Sprint,
  AppNotification,
  ProjectSummary,
} from "@/lib/types/issues";

export async function fetchProjectsPage(page = 1, limit = 100) {
  const res = await api.get<unknown>("/projects", { params: { page, limit } });
  return unwrapApiData<PaginatedResult<ProjectSummary>>(res.data);
}

export async function fetchAllProjectSummaries(): Promise<ProjectSummary[]> {
  const out: ProjectSummary[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const paginated = await fetchProjectsPage(page, limit);
    out.push(...paginated.data);
    if (page >= paginated.meta.totalPages) break;
    page += 1;
  }
  return out;
}

export async function createProject(body: { name: string; key: string; description?: string }) {
  const res = await api.post<unknown>("/projects", body);
  return unwrapApiData<ProjectSummary>(res.data);
}

export async function fetchProject(projectId: string) {
  const res = await api.get<unknown>(`/projects/${projectId}`);
  return unwrapApiData<ProjectSummary>(res.data);
}

export async function fetchIssueBoard(projectId: string, sprintId?: string) {
  const res = await api.get<unknown>(`/projects/${projectId}/issues/board`, {
    params: sprintId ? { sprintId } : {},
  });
  return unwrapApiData<BoardData>(res.data);
}

export async function createIssue(
  projectId: string,
  body: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    assigneeId?: string;
    labelIds?: string[];
  }
) {
  const res = await api.post<unknown>(`/projects/${projectId}/issues`, body);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function fetchIssue(projectId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.get<unknown>(`/projects/${projectId}/issues/${key}`);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function updateIssueStatus(projectId: string, issueKey: string, status: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.patch<unknown>(`/projects/${projectId}/issues/${key}/status`, { status });
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function fetchIssueComments(projectId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.get<unknown>(`/projects/${projectId}/issues/${key}/comments`);
  return unwrapApiData<IssueComment[]>(res.data);
}

export async function postIssueComment(projectId: string, issueKey: string, content: string, parentId?: string) {
  const key = encodeURIComponent(issueKey);
  const body: { content: string; parentId?: string } = { content };
  if (parentId) body.parentId = parentId;
  const res = await api.post<unknown>(`/projects/${projectId}/issues/${key}/comments`, body);
  return unwrapApiData<IssueComment>(res.data);
}

export async function fetchIssuesForProject(
  projectId: string,
  params: Record<string, string | number>
) {
  const res = await api.get<unknown>(`/projects/${projectId}/issues`, { params });
  return unwrapApiData<PaginatedResult<Record<string, unknown>>>(res.data);
}

/** Đếm chưa đọc — khớp BE (số hoặc envelope). */
export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await api.get<unknown>("/notifications/unread-count");
  const raw = unwrapApiData<unknown>(res.data);
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  if (typeof raw === "string") {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) return Math.max(0, n);
  }
  return 0;
}

export type ProjectMemberRow = {
  userId: string;
  role: string;
  user: { id: string; email: string; fullName: string; avatarUrl?: string | null };
};

export async function fetchProjectMembersPage(projectId: string, page = 1, limit = 50) {
  const res = await api.get<unknown>(`/projects/${projectId}/members`, {
    params: { page, limit },
  });
  return unwrapApiData<PaginatedResult<ProjectMemberRow>>(res.data);
}

// --- Project ---
export async function updateProject(projectId: string, body: { name?: string; description?: string }) {
  const res = await api.patch<unknown>(`/projects/${projectId}`, body);
  return unwrapApiData<ProjectSummary>(res.data);
}

export async function deleteProject(projectId: string) {
  await api.delete<unknown>(`/projects/${projectId}`);
}

// --- Members ---
export async function addProjectMember(projectId: string, userId: string, role: string) {
  const res = await api.post<unknown>(`/projects/${projectId}/members`, { userId, role });
  return unwrapApiData<ProjectMemberRow>(res.data);
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: string) {
  const res = await api.patch<unknown>(`/projects/${projectId}/members/${userId}`, { role });
  return unwrapApiData<ProjectMemberRow>(res.data);
}

export async function removeProjectMember(projectId: string, userId: string) {
  await api.delete<unknown>(`/projects/${projectId}/members/${userId}`);
}

export async function leaveProject(projectId: string) {
  await api.delete<unknown>(`/projects/${projectId}/members/me`);
}

// --- Labels ---
export async function fetchProjectLabels(projectId: string, page = 1, limit = 100) {
  const res = await api.get<unknown>(`/projects/${projectId}/labels`, { params: { page, limit } });
  return unwrapApiData<PaginatedResult<Label>>(res.data);
}

export async function createProjectLabel(projectId: string, body: { name: string; color: string }) {
  const res = await api.post<unknown>(`/projects/${projectId}/labels`, body);
  return unwrapApiData<Label>(res.data);
}

export async function updateProjectLabel(projectId: string, labelId: string, body: { name?: string; color?: string }) {
  const res = await api.patch<unknown>(`/projects/${projectId}/labels/${labelId}`, body);
  return unwrapApiData<Label>(res.data);
}

export async function deleteProjectLabel(projectId: string, labelId: string) {
  await api.delete<unknown>(`/projects/${projectId}/labels/${labelId}`);
}

// --- Issues (extended) ---
export async function updateIssue(projectId: string, issueKey: string, body: Record<string, unknown>) {
  const key = encodeURIComponent(issueKey);
  const res = await api.patch<unknown>(`/projects/${projectId}/issues/${key}`, body);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function deleteIssue(projectId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  await api.delete<unknown>(`/projects/${projectId}/issues/${key}`);
}

export async function reorderIssue(projectId: string, issueKey: string, status: string, position: number) {
  const key = encodeURIComponent(issueKey);
  const res = await api.patch<unknown>(`/projects/${projectId}/issues/${key}/reorder`, { status, position });
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function addIssueLabel(projectId: string, issueKey: string, labelId: string) {
  const key = encodeURIComponent(issueKey);
  await api.post<unknown>(`/projects/${projectId}/issues/${key}/labels/${labelId}`);
}

export async function removeIssueLabel(projectId: string, issueKey: string, labelId: string) {
  const key = encodeURIComponent(issueKey);
  await api.delete<unknown>(`/projects/${projectId}/issues/${key}/labels/${labelId}`);
}

// --- Comments (extended) ---
export async function updateIssueComment(projectId: string, issueKey: string, commentId: string, content: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.patch<unknown>(`/projects/${projectId}/issues/${key}/comments/${commentId}`, { content });
  return unwrapApiData<IssueComment>(res.data);
}

export async function deleteIssueComment(projectId: string, issueKey: string, commentId: string) {
  const key = encodeURIComponent(issueKey);
  await api.delete<unknown>(`/projects/${projectId}/issues/${key}/comments/${commentId}`);
}

// --- Attachments ---
export async function fetchIssueAttachments(projectId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.get<unknown>(`/projects/${projectId}/issues/${key}/attachments`);
  return unwrapApiData<Attachment[]>(res.data);
}

export async function uploadIssueAttachment(projectId: string, issueKey: string, file: File) {
  const key = encodeURIComponent(issueKey);
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<unknown>(`/projects/${projectId}/issues/${key}/attachments`, form, {
    transformRequest: [
      (data, headers) =>
        stripJsonContentTypeForFormData(data, headers as Record<string, unknown> | undefined) as FormData,
    ],
  });
  return unwrapApiData<Attachment>(res.data);
}

export async function deleteIssueAttachment(projectId: string, issueKey: string, attachmentId: string) {
  const key = encodeURIComponent(issueKey);
  await api.delete<unknown>(`/projects/${projectId}/issues/${key}/attachments/${attachmentId}`);
}

// --- Sprints ---
export async function fetchProjectSprints(projectId: string) {
  const res = await api.get<unknown>(`/projects/${projectId}/sprints`);
  return unwrapApiData<Sprint[]>(res.data);
}

/** Chi tiết sprint kèm danh sách issue — GET .../sprints/:sprintId */
export async function fetchSprint(projectId: string, sprintId: string) {
  const res = await api.get<unknown>(`/projects/${projectId}/sprints/${sprintId}`);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function createSprint(projectId: string, body: { name: string; goal?: string; startDate?: string; endDate?: string }) {
  const res = await api.post<unknown>(`/projects/${projectId}/sprints`, body);
  return unwrapApiData<Sprint>(res.data);
}

export async function updateSprint(projectId: string, sprintId: string, body: { name?: string; goal?: string; startDate?: string; endDate?: string }) {
  const res = await api.patch<unknown>(`/projects/${projectId}/sprints/${sprintId}`, body);
  return unwrapApiData<Sprint>(res.data);
}

export async function deleteSprint(projectId: string, sprintId: string) {
  await api.delete<unknown>(`/projects/${projectId}/sprints/${sprintId}`);
}

export async function startSprint(projectId: string, sprintId: string) {
  const res = await api.post<unknown>(`/projects/${projectId}/sprints/${sprintId}/start`);
  return unwrapApiData<Sprint>(res.data);
}

export async function completeSprint(projectId: string, sprintId: string) {
  const res = await api.post<unknown>(`/projects/${projectId}/sprints/${sprintId}/complete`);
  return unwrapApiData<Sprint>(res.data);
}

export async function fetchBacklog(projectId: string) {
  const res = await api.get<unknown>(`/projects/${projectId}/backlog`);
  return unwrapApiData<Record<string, unknown>[]>(res.data);
}

export async function addIssueToSprint(projectId: string, sprintId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.post<unknown>(`/projects/${projectId}/sprints/${sprintId}/issues/${key}`);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

export async function removeIssueFromSprint(projectId: string, sprintId: string, issueKey: string) {
  const key = encodeURIComponent(issueKey);
  const res = await api.delete<unknown>(`/projects/${projectId}/sprints/${sprintId}/issues/${key}`);
  return unwrapApiData<Record<string, unknown>>(res.data);
}

// --- Notifications ---
export async function fetchNotifications(page = 1, limit = 20) {
  const res = await api.get<unknown>("/notifications", { params: { page, limit } });
  return unwrapApiData<PaginatedResult<AppNotification>>(res.data);
}

export async function markNotificationAsRead(id: string) {
  const res = await api.patch<unknown>(`/notifications/${id}/read`);
  return unwrapApiData<AppNotification>(res.data);
}

export async function markAllNotificationsAsRead() {
  await api.patch<unknown>("/notifications/read-all");
}
