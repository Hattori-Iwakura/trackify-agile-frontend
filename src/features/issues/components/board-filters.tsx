'use client';

import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useBoardStore } from '../stores/board.store';
import { Priority, IssueType } from '@/shared/types';
import { useMembers } from '@/features/projects/hooks/use-members';
import { useLabels } from '@/features/projects/hooks/use-labels';
import { UNASSIGNED_FILTER } from '../utils/issue-board-filters';

export function BoardFilters() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: membersPage } = useMembers(projectId ?? '', 1, 100);
  const { data: labelsPage } = useLabels(projectId ?? '');
  const members = membersPage?.data ?? [];
  const labels = labelsPage?.data ?? [];

  const {
    searchText,
    filterPriority,
    filterType,
    filterAssigneeId,
    filterLabelId,
    setSearchText,
    setFilterPriority,
    setFilterType,
    setFilterAssigneeId,
    setFilterLabelId,
    clearFilters,
  } = useBoardStore();

  const hasFilters =
    !!searchText ||
    !!filterPriority ||
    !!filterType ||
    !!filterAssigneeId ||
    !!filterLabelId;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <Input
        placeholder="Search issues..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-48 h-8"
      />

      <Select
        value={filterPriority ?? ''}
        onValueChange={(val) => setFilterPriority((val as Priority) || null)}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All priorities</SelectItem>
          {Object.values(Priority).map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterType ?? ''}
        onValueChange={(val) => setFilterType((val as IssueType) || null)}
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All types</SelectItem>
          {Object.values(IssueType).map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterAssigneeId ?? ''}
        onValueChange={(val) => {
          if (!val) setFilterAssigneeId(null);
          else if (val === UNASSIGNED_FILTER) setFilterAssigneeId(UNASSIGNED_FILTER);
          else setFilterAssigneeId(val);
        }}
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All assignees</SelectItem>
          <SelectItem value={UNASSIGNED_FILTER}>Unassigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId} value={m.userId}>
              {m.user?.fullName ?? m.userId}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterLabelId ?? ''}
        onValueChange={(val) => setFilterLabelId(val || null)}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All labels</SelectItem>
          {labels.map((label) => (
            <SelectItem key={label.id} value={label.id}>
              {label.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
