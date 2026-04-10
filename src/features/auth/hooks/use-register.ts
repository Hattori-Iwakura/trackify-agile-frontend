'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, type RegisterRequest } from '../api/auth.api';

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      // Backend register returns user only (no tokens)
      // Redirect to login page after successful registration
      router.push('/login');
    },
  });
}
