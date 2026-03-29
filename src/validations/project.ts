import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nhập tên dự án"),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
