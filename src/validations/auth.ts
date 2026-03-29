import { z } from "zod";

/** Khớp backend / fe-context: min 8, 1 hoa, 1 thường, 1 số, 1 ký tự @#$%^&*! */
const registerPasswordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&*!]).{8,}$/;

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Nhập họ tên")
    .max(100, "Tối đa 100 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .regex(
      registerPasswordRegex,
      "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và một ký tự @#$%^&*!"
    ),
  confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
