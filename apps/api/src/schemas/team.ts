import { z } from "@hono/zod-openapi";

export const teamPlanSchema = z
  .enum(["trial", "starter", "pro", "enterprise"])
  .openapi({
    description: "Subscription tier for a team",
    example: "pro",
  });

export const teamSummarySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Team identifier",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    name: z.string().openapi({
      description: "Team display name",
      example: "Zeke Intelligence",
    }),
    slug: z.string().nullable().openapi({
      description: "URL-friendly slug",
      example: "zeke-intel",
    }),
    logoUrl: z.string().url().nullable().openapi({
      description: "Team logo URL",
      example: "https://cdn.zeke.ai/logos/zeke.png",
    }),
    planCode: teamPlanSchema.nullable(),
  })
  .openapi({
    description: "Summary information for a team",
  });

export const teamDetailSchema = teamSummarySchema
  .extend({
    metadata: z.record(z.unknown()).nullable().openapi({
      description: "Custom metadata stored for the team",
    }),
    createdAt: z.string().openapi({
      description: "Creation timestamp",
      example: "2024-01-04T10:00:00Z",
    }),
    updatedAt: z.string().openapi({
      description: "Last update timestamp",
      example: "2024-05-16T12:23:00Z",
    }),
  })
  .openapi({
    description: "Detailed team record returned to the dashboard",
  });

export const teamMemberSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Membership record identifier",
      example: "0f1e2d3c-4b5a-6789-0123-abcdef456789",
    }),
    userId: z.string().uuid().openapi({
      description: "User identifier",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    email: z.string().email().openapi({
      description: "User email",
      example: "alex@zeke.ai",
    }),
    fullName: z.string().nullable().openapi({
      description: "Full name",
      example: "Alex Parker",
    }),
    role: z.enum(["owner", "admin", "member", "viewer"]).openapi({
      description: "Role within the team",
      example: "admin",
    }),
    joinedAt: z.string().nullable().openapi({
      description: "When the user joined",
      example: "2024-01-03T10:00:00Z",
    }),
  })
  .openapi({
    description: "Membership information for a teammate",
  });

export const teamListResponseSchema = z
  .array(teamSummarySchema)
  .openapi({
    description: "Teams available to the current user",
  });

export const teamInvitesSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Invite identifier",
      example: "ef12cd34-ab56-7890-1234-56789abcdef0",
    }),
    email: z.string().email().openapi({
      description: "Invite recipient email",
      example: "guest@zeke.ai",
    }),
    role: z.enum(["owner", "admin", "member", "viewer"]).openapi({
      description: "Proposed team role",
      example: "member",
    }),
    status: z.enum(["pending", "accepted", "expired", "revoked"]).openapi({
      description: "Invite status",
      example: "pending",
    }),
    expiresAt: z.string().nullable().openapi({
      description: "Expiry timestamp",
      example: "2024-06-01T00:00:00Z",
    }),
    team: teamSummarySchema.nullable(),
  })
  .openapi({
    description: "Team invite awaiting the current user",
  });

export const teamSetActiveInputSchema = z
  .object({
    teamId: z.string().uuid().openapi({
      description: "Team to set as active",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
  })
  .openapi({
    description: "Payload for switching the active team",
  });

export const teamIdInputSchema = z
  .object({
    teamId: z.string().uuid().openapi({
      description: "Identifier for fetching team details",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
  })
  .openapi({
    description: "Input that expects a team id",
  });

export type TeamSummary = z.infer<typeof teamSummarySchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
