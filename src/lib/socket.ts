import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth-tokens";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

let socket: Socket | null = null;

/**
 * Socket.io tới Nest NotificationsGateway.
 * Cần JWT trong handshake: `auth.token` (không có prefix Bearer).
 * Set NEXT_PUBLIC_SOCKET_URL (vd: http://localhost:4000 — cùng origin với API, không thêm /api).
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined" || !socketUrl) return null;
  const token = getAccessToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

/** Room project — nhận `board:update` */
export function joinProject(projectId: string): void {
  getSocket()?.emit("joinProject", { projectId });
}

export function leaveProject(projectId: string): void {
  getSocket()?.emit("leaveProject", { projectId });
}

/** Room issue — nhận `comment:new` */
export function joinIssue(issueKey: string): void {
  getSocket()?.emit("joinIssue", { issueKey });
}

/**
 * Kanban: BE emit `board:update` (payload: issueKey, oldStatus, newStatus).
 */
export function subscribeKanban(callback: (data: unknown) => void): (() => void) | void {
  const s = getSocket();
  if (!s) return;
  s.on("board:update", callback);
  return () => {
    s.off("board:update", callback);
  };
}

/**
 * Comment realtime: BE emit `comment:new` trên room issue (sau joinIssue).
 */
export function subscribeComments(issueKey: string, callback: (data: unknown) => void): (() => void) | void {
  const s = getSocket();
  if (!s) return;
  joinIssue(issueKey);
  s.on("comment:new", callback);
  return () => {
    s.off("comment:new", callback);
  };
}

/** Thông báo cá nhân: `notification:new` (server auto-join user:<id>) */
export function subscribeNotifications(callback: (data: unknown) => void): (() => void) | void {
  const s = getSocket();
  if (!s) return;
  s.on("notification:new", callback);
  return () => {
    s.off("notification:new", callback);
  };
}
