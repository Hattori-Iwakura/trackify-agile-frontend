import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.findAll(page),
  });
}
