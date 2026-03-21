'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from '@/shared/lib/socket';
import { useSocketStore } from '../stores/socket.store';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { Notification } from '@/shared/types';

export function useSocket() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setConnected, activeProjectId, activeIssueKey, isConnected } = useSocketStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = getSocket(accessToken);

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('board:update', (data: { projectId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['board', data.projectId] });
    });

    socket.on('comment:new', (data: { projectId: string; issueKey: string }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.projectId, data.issueKey] });
    });

    socket.on('comment:updated', (data: { projectId: string; issueKey: string }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.projectId, data.issueKey] });
    });

    socket.on('comment:deleted', (data: { projectId: string; issueKey: string }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.projectId, data.issueKey] });
    });

    socket.on('notification:new', (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast(notification.title, {
        description: notification.message,
      });
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('board:update');
      socket.off('comment:new');
      socket.off('comment:updated');
      socket.off('comment:deleted');
      socket.off('notification:new');
      disconnectSocket();
      setConnected(false);
    };
  }, [isAuthenticated, accessToken, queryClient, setConnected]);

  // Manage project room subscription
  useEffect(() => {
    if (!isConnected || !activeProjectId || !accessToken) return;

    const socket = getSocket(accessToken);
    socket.emit('joinProject', { projectId: activeProjectId });

    return () => {
      if (socket.connected) {
        socket.emit('leaveProject', { projectId: activeProjectId });
      }
    };
  }, [isConnected, activeProjectId, accessToken]);

  // Manage issue room subscription
  useEffect(() => {
    if (!isConnected || !activeIssueKey || !activeProjectId || !accessToken) return;

    const socket = getSocket(accessToken);
    socket.emit('joinIssue', { projectId: activeProjectId, issueKey: activeIssueKey });

    return () => {
      if (socket.connected) {
        socket.emit('leaveIssue', { projectId: activeProjectId, issueKey: activeIssueKey });
      }
    };
  }, [isConnected, activeProjectId, activeIssueKey, accessToken]);
}
