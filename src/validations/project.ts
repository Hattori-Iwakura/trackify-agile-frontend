import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nhập tên dự án"),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
