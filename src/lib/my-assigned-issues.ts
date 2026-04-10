import type { PaginatedResult } from "@/lib/types/api";
import { PROJECT_AGGREGATION_CONCURRENCY } from "@/lib/aggregate-my-dashboard";
import { fetchAllProjectSummaries, fetchIssuesForProject } from "@/lib/projects-issues-api";

export type AssignedIssueRow = {
  issueKey: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  projectId: string;
  projectName: string;
};

function pushPageRows(
  paginated: PaginatedResult<Record<string, unknown>>,
  projectId: string,
  projectName: string,
  rows: AssignedIssueRow[]
) {
  for (const issue of paginated.data) {
    rows.push({
      issueKey: String(issue.issueKey ?? ""),
      title: String(issue.title ?? ""),
      status: String(issue.status ?? ""),
      priority: String(issue.priority ?? ""),
      type: String(issue.type ?? ""),
      projectId,
      projectName,
    });
  }
}

async function fetchAllIssuesForProject(
  projectId: string,
  projectName: string,
  assigneeId: string
): Promise<AssignedIssueRow[]> {
  const rows: AssignedIssueRow[] = [];
  const limit = 50;
  const first = await fetchIssuesForProject(projectId, { assigneeId, page: 1, limit });
  pushPageRows(first, projectId, projectName, rows);
  const totalPages = first.meta.totalPages;
  if (totalPages <= 1) return rows;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetchIssuesForProject(projectId, { assigneeId, page: i + 2, limit })
    )
  );
  for (const paginated of rest) {
    pushPageRows(paginated, projectId, projectName, rows);
  }
  return rows;
}

export async function fetchMyAssignedIssues(assigneeId: string): Promise<AssignedIssueRow[]> {
  const projects = await fetchAllProjectSummaries();
  const rows: AssignedIssueRow[] = [];
  for (let i = 0; i < projects.length; i += PROJECT_AGGREGATION_CONCURRENCY) {
    const chunk = projects.slice(i, i + PROJECT_AGGREGATION_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((p) => fetchAllIssuesForProject(p.id, p.name, assigneeId))
    );
    rows.push(...results.flat());
  }
  return rows.sort((a, b) => b.issueKey.localeCompare(a.issueKey));
}
