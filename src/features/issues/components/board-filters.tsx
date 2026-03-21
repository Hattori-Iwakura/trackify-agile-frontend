'use client';

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

export function BoardFilters() {
  const { searchText, filterPriority, filterType, setSearchText, setFilterPriority, setFilterType, clearFilters } =
    useBoardStore();

  const hasFilters = !!searchText || !!filterPriority || !!filterType;

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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
