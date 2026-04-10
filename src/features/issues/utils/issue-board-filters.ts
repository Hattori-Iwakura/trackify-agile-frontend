import type { Issue, IssueType, Label, Priority } from '@/shared/types';

export const UNASSIGNED_FILTER = '__unassigned__';

/** Board API may return `labels` as `Label[]` or Prisma-style `{ label: Label }[]`. */
export function getIssueLabelIds(issue: Issue): string[] {
  const raw = issue.labels as unknown;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const item of raw) {
    if (item && typeof item === 'object') {
      if ('label' in item && (item as { label?: { id?: string } }).label?.id) {
        ids.push(String((item as { label: { id: string } }).label.id));
      } else if ('id' in item && (item as Label).id) {
        ids.push(String((item as Label).id));
      }
    }
  }
  return ids;
}

export function matchesBoardFilters(
  issue: Issue,
  opts: {
    searchText: string;
    filterPriority: Priority | null;
    filterType: IssueType | null;
    filterAssigneeId: string | null;
    filterLabelId: string | null;
  },
): boolean {
  const { searchText, filterPriority, filterType, filterAssigneeId, filterLabelId } = opts;

  if (searchText && !issue.title.toLowerCase().includes(searchText.toLowerCase())) return false;
  if (filterPriority && issue.priority !== filterPriority) return false;
  if (filterType && issue.type !== filterType) return false;

  if (filterAssigneeId === UNASSIGNED_FILTER) {
    if (issue.assigneeId != null) return false;
  } else if (filterAssigneeId) {
    if (issue.assigneeId !== filterAssigneeId) return false;
  }

  if (filterLabelId) {
    const labelIds = getIssueLabelIds(issue);
    if (!labelIds.includes(filterLabelId)) return false;
  }

  return true;
}
