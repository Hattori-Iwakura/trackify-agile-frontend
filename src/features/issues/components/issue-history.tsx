'use client';

import { History } from 'lucide-react';
import { useIssueHistory } from '../hooks/use-issue-history';
import { Skeleton } from '@/components/ui/skeleton';

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  priority: 'Priority',
  type: 'Type',
  title: 'Title',
  description: 'Description',
  assigneeId: 'Assignee',
};

function formatValue(field: string, value: string | null): string {
  if (value === null || value === '') return 'None';
  return value;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface IssueHistoryProps {
  projectId: string;
  issueKey: string;
}

export function IssueHistory({ projectId, issueKey }: IssueHistoryProps) {
  const { data: history, isLoading } = useIssueHistory(projectId, issueKey);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Activity</h3>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      )}

      {!isLoading && (!history || history.length === 0) && (
        <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
      )}

      {!isLoading && history && history.length > 0 && (
        <ol className="relative border-l border-border ml-2 space-y-3">
          {history.map((entry) => (
            <li key={entry.id} className="ml-4">
              <span className="absolute -left-1.5 mt-1.5 h-2.5 w-2.5 rounded-full border border-background bg-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {entry.changedBy?.fullName ?? 'Someone'}
                </span>
                {' changed '}
                <span className="font-medium">{FIELD_LABELS[entry.field] ?? entry.field}</span>
                {' from '}
                <span className="font-mono text-[11px] bg-muted px-1 rounded">
                  {formatValue(entry.field, entry.oldValue)}
                </span>
                {' to '}
                <span className="font-mono text-[11px] bg-muted px-1 rounded">
                  {formatValue(entry.field, entry.newValue)}
                </span>
                <span className="ml-2 text-[11px]">{timeAgo(entry.createdAt)}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
