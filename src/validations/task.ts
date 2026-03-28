import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Nhập tiêu đề"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
