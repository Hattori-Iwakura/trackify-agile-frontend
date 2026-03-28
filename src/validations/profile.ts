import { z } from 'zod';

/** Khớp Nest `UpdateProfileSchema`: fullName 1–100, email hợp lệ. */
export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Nhập họ tên').max(100, 'Tối đa 100 ký tự'),
  email: z.string().email('Email không hợp lệ'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
