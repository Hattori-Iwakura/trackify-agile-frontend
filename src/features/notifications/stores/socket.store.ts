import { create } from 'zustand';

interface SocketState {
  isConnected: boolean;
  activeProjectId: string | null;
  activeIssueKey: string | null;
  setConnected: (connected: boolean) => void;
  setActiveProject: (projectId: string | null) => void;
  setActiveIssue: (issueKey: string | null) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  activeProjectId: null,
  activeIssueKey: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  setActiveIssue: (issueKey) => set({ activeIssueKey: issueKey }),
}));
