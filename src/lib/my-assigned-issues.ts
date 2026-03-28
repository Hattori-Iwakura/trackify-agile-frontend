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

export async function fetchMyAssignedIssues(assigneeId: string): Promise<AssignedIssueRow[]> {
  const projects = await fetchAllProjectSummaries();
  const rows: AssignedIssueRow[] = [];
  for (const p of projects) {
    let page = 1;
    const limit = 50;
    for (;;) {
      const paginated = await fetchIssuesForProject(p.id, { assigneeId, page, limit });
      for (const issue of paginated.data) {
        rows.push({
          issueKey: String(issue.issueKey ?? ""),
          title: String(issue.title ?? ""),
          status: String(issue.status ?? ""),
          priority: String(issue.priority ?? ""),
          type: String(issue.type ?? ""),
          projectId: p.id,
          projectName: p.name,
        });
      }
      if (page >= paginated.meta.totalPages) break;
      page += 1;
    }
  }
  return rows.sort((a, b) => b.issueKey.localeCompare(a.issueKey));
}
