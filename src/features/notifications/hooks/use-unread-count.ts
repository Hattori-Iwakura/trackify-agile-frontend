import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
  });
}
