import { create } from 'zustand';
import type { Priority, IssueType } from '@/shared/types';

interface BoardState {
  searchText: string;
  filterPriority: Priority | null;
  filterType: IssueType | null;
  filterAssigneeId: string | null;
  filterLabelId: string | null;
  dragActiveId: string | null;
  setSearchText: (text: string) => void;
  setFilterPriority: (priority: Priority | null) => void;
  setFilterType: (type: IssueType | null) => void;
  setFilterAssigneeId: (userId: string | null) => void;
  setFilterLabelId: (labelId: string | null) => void;
  setDragActiveId: (id: string | null) => void;
  clearFilters: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  searchText: '',
  filterPriority: null,
  filterType: null,
  filterAssigneeId: null,
  filterLabelId: null,
  dragActiveId: null,
  setSearchText: (text) => set({ searchText: text }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterAssigneeId: (userId) => set({ filterAssigneeId: userId }),
  setFilterLabelId: (labelId) => set({ filterLabelId: labelId }),
  setDragActiveId: (id) => set({ dragActiveId: id }),
  clearFilters: () =>
    set({
      searchText: '',
      filterPriority: null,
      filterType: null,
      filterAssigneeId: null,
      filterLabelId: null,
    }),
}));
