'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, type LoginRequest } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { setTokens } from '@/shared/lib/api-client';

export function useLogin() {
  const router = useRouter();
  const storeLogin = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Login returns only tokens (no user)
      const tokens = await authApi.login(data);
      // Store tokens so apiClient can use them for the next request
      setTokens(tokens.accessToken, tokens.refreshToken);
      // Fetch user profile
      const user = await authApi.getMe();
      return { ...tokens, user };
    },
    onSuccess: (response) => {
      storeLogin(response.user, response.accessToken, response.refreshToken);
      router.push('/projects');
    },
  });
}
