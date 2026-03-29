import { z } from "zod";

/** Giữ đồng bộ với backend (Issue status); mở rộng khi API thêm giá trị mới. */
export const TASK_STATUSES = ["todo", "in_progress", "done", "blocked", "review"] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Nhập tiêu đề"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
