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

export const respondTeamInviteSchema = z.object({
  inviteId: z.string().uuid("Invalid invite ID"),
});

export const setActiveTeamSchema = z.object({
  teamId: z.string().uuid("Invalid team ID"),
});
