import { z } from "zod";

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(64, "Full name must be 64 characters or fewer")
    .optional(),
  avatar_url: z.string().url("Avatar must be a valid URL").optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
