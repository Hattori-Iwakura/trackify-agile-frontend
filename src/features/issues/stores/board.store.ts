import { create } from 'zustand';
import type { Priority, IssueType } from '@/shared/types';

interface BoardState {
  searchText: string;
  filterPriority: Priority | null;
  filterType: IssueType | null;
  dragActiveId: string | null;
  setSearchText: (text: string) => void;
  setFilterPriority: (priority: Priority | null) => void;
  setFilterType: (type: IssueType | null) => void;
  setDragActiveId: (id: string | null) => void;
  clearFilters: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  searchText: '',
  filterPriority: null,
  filterType: null,
  dragActiveId: null,
  setSearchText: (text) => set({ searchText: text }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterType: (type) => set({ filterType: type }),
  setDragActiveId: (id) => set({ dragActiveId: id }),
  clearFilters: () => set({ searchText: '', filterPriority: null, filterType: null }),
}));
