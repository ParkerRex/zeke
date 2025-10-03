import { z } from "zod";
export const inviteTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
  ip: z.string(),
  locale: z.string(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      invitedByName: z.string(),
      invitedByEmail: z.string().email(),
      teamName: z.string(),
    }),
  ),
});

export type InviteTeamMembersPayload = z.infer<typeof inviteTeamMembersSchema>;
