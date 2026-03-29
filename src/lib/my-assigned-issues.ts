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

async function fetchAllIssuesForProject(
  projectId: string,
  projectName: string,
  assigneeId: string
): Promise<AssignedIssueRow[]> {
  const rows: AssignedIssueRow[] = [];
  let page = 1;
  const limit = 50;
  for (;;) {
    const paginated = await fetchIssuesForProject(projectId, { assigneeId, page, limit });
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
    if (page >= paginated.meta.totalPages) break;
    page += 1;
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
