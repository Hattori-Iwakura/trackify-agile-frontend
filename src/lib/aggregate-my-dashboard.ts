import { api, unwrapApiData } from "@/lib/api";
import type { PaginatedResult } from "@/lib/types/api";

const OPEN_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW"] as const;

export type ActivityDay = { date: string; issueUpdates: number };

export type MyDashboardStats = {
  tasksDone: number;
  bugsFixed: number;
  openAssigned: number;
  activityByDay: ActivityDay[];
};

/** Dùng khi chưa có dữ liệu hoặc chưa gọi API. */
export function emptyDashboardStats(): MyDashboardStats {
  const activityByDay: ActivityDay[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 13);
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    activityByDay.push({ date: d.toISOString().slice(0, 10), issueUpdates: 0 });
  }
  return { tasksDone: 0, bugsFixed: 0, openAssigned: 0, activityByDay };
}

async function fetchIssuePage(
  projectId: string,
  params: Record<string, string | number>
): Promise<PaginatedResult<{ updatedAt: string }>> {
  const res = await api.get<unknown>(`/projects/${projectId}/issues`, { params });
  return unwrapApiData<PaginatedResult<{ updatedAt: string }>>(res.data);
}

async function issueTotal(
  projectId: string,
  query: { assigneeId: string } & Partial<{ type: string; status: string }>
): Promise<number> {
  const paginated = await fetchIssuePage(projectId, { ...query, page: 1, limit: 1 });
  return paginated.meta.total;
}

async function fetchAllProjectIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await api.get<unknown>("/projects", { params: { page, limit } });
    const paginated = unwrapApiData<PaginatedResult<{ id: string }>>(res.data);
    ids.push(...paginated.data.map((p) => p.id));
    if (page >= paginated.meta.totalPages) break;
    page += 1;
  }
  return ids;
}

/** Lấy issue được gán cho user (phân trang, giới hạn để biểu đồ không tải quá nặng). */
async function fetchAssignedIssuesForChart(
  projectId: string,
  assigneeId: string,
  maxPages: number
): Promise<{ updatedAt: string }[]> {
  const out: { updatedAt: string }[] = [];
  let page = 1;
  const limit = 100;
  while (page <= maxPages) {
    const paginated = await fetchIssuePage(projectId, { assigneeId, page, limit });
    for (const row of paginated.data) {
      out.push({ updatedAt: row.updatedAt });
    }
    if (page >= paginated.meta.totalPages) break;
    page += 1;
  }
  return out;
}

function bucketLast14Days(issues: { updatedAt: string }[]): ActivityDay[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 13);
  const keys: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    keys.push(d.toISOString().slice(0, 10));
  }
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);
  const sinceMs = start.getTime();
  for (const row of issues) {
    const t = new Date(row.updatedAt).getTime();
    if (t < sinceMs) continue;
    const key = new Date(row.updatedAt).toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((date) => ({ date, issueUpdates: counts.get(date) ?? 0 }));
}

/**
 * Gom số liệu profile từ API có sẵn (không cần endpoint stats riêng).
 * Gọi sau khi đã có JWT và `NEXT_PUBLIC_API_URL` trỏ Nest.
 */
export async function aggregateMyDashboard(assigneeId: string): Promise<MyDashboardStats> {
  const projectIds = await fetchAllProjectIds();
  if (projectIds.length === 0) {
    return emptyDashboardStats();
  }

  const perProject = await Promise.all(
    projectIds.map(async (projectId) => {
      const [td, bf, ...opens] = await Promise.all([
        issueTotal(projectId, { assigneeId, type: "TASK", status: "DONE" }),
        issueTotal(projectId, { assigneeId, type: "BUG", status: "DONE" }),
        ...OPEN_STATUSES.map((status) => issueTotal(projectId, { assigneeId, status })),
      ]);
      const slice = await fetchAssignedIssuesForChart(projectId, assigneeId, 8);
      return {
        td,
        bf,
        openSum: opens.reduce((a, n) => a + n, 0),
        slice,
      };
    })
  );

  let tasksDone = 0;
  let bugsFixed = 0;
  let openAssigned = 0;
  const chartIssues: { updatedAt: string }[] = [];
  for (const p of perProject) {
    tasksDone += p.td;
    bugsFixed += p.bf;
    openAssigned += p.openSum;
    chartIssues.push(...p.slice);
  }

  return {
    tasksDone,
    bugsFixed,
    openAssigned,
    activityByDay: bucketLast14Days(chartIssues),
  };
}

export function isNestBackendConfigured(): boolean {
  const u = process.env.NEXT_PUBLIC_API_URL ?? "";
  return u.length > 0 && !u.startsWith("/");
}
