import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../stores/auth.store';
import { useEffect } from 'react';

export function useUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersApi.getMe(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
