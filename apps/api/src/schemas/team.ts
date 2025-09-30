import { z } from "@hono/zod-openapi";

export const teamResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the research team workspace",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description:
      "Name of the research team or organization conducting goal-aware analysis",
    example: "Acme Research Lab",
  }),
  logoUrl: z.string().url().nullable().openapi({
    description:
      "Visual identity for the team's published insights and research outputs",
    example: "https://cdn.zekehq.com/logos/acme-corp.png",
  }),
  plan: z.enum(["trial", "starter", "pro"]).openapi({
    description:
      "Research capability tier determining discovery depth and publishing features",
    example: "pro",
  }),
  // subscriptionStatus: z
  //   .enum([
  //     "active",
  //     "canceled",
  //     "past_due",
  //     "unpaid",
  //     "trialing",
  //     "incomplete",
  //     "incomplete_expired",
  //   ])
  //   .nullable()
  //   .openapi({
  //     description: "Current subscription status of the team",
  //     example: "active",
  //   }),
});

export const teamsResponseSchema = z.object({
  data: z.array(teamResponseSchema).openapi({
    description:
      "Research workspaces where teams discover, triage, apply and publish insights",
  }),
});

export const getTeamByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the research team workspace",
      example: "123e4567-e89b-12d3-a456-426614174000",
      param: {
        in: "path",
        name: "id",
        required: true,
      },
    })
    .openapi({
      description: "Unique identifier for the research team workspace",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
});

export const updateTeamByIdSchema = z.object({
  name: z.string().min(2).max(32).optional().openapi({
    description:
      "Research team identity used in published citations and applied outcomes (2-32 chars)",
    example: "Acme Research Lab",
  }),
  email: z.string().email().optional().openapi({
    description:
      "Primary contact for research collaboration and insight distribution",
    example: "research@acme.com",
  }),
  logoUrl: z
    .string()
    .url()
    .refine((url) => url.includes("zekehq.com"), {
      message: "logoUrl must be a zekehq.com domain URL",
    })
    .optional()
    .openapi({
      description:
        "Team branding for published research outputs. Must be hosted on zekehq.com domain",
      example: "https://cdn.zekehq.com/logos/acme-corp.png",
    }),
  baseCurrency: z.string().optional().openapi({
    description:
      "Default currency for financial research analysis and outcome tracking (ISO 4217)",
    example: "USD",
  }),
  countryCode: z.string().optional().openapi({
    description: "Geographic context for research localization and compliance",
    example: "US",
  }),
});

export const createTeamSchema = z.object({
  name: z.string().openapi({
    description:
      "Research team name for collaborative discovery and insight publishing",
    example: "Acme Research Lab",
  }),
  baseCurrency: z.string().openapi({
    description:
      "Primary currency for financial analysis in research outcomes (ISO 4217)",
    example: "USD",
  }),
  countryCode: z.string().optional().openapi({
    description: "Geographic context for research localization and compliance",
    example: "US",
  }),
  logoUrl: z.string().url().optional().openapi({
    description: "Visual identity for published research and applied playbooks",
    example: "https://cdn.zekehq.com/logos/acme-corp.png",
  }),
  switchTeam: z.boolean().optional().default(false).openapi({
    description:
      "Immediately activate this research workspace for discovery and triage",
    example: true,
  }),
});

export const leaveTeamSchema = z.object({
  teamId: z.string().openapi({
    description:
      "Research workspace to disconnect from and archive access to insights",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const acceptTeamInviteSchema = z.object({
  id: z.string().openapi({
    description:
      "Invitation to join collaborative research and insight publishing workspace",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const declineTeamInviteSchema = z.object({
  id: z.string().openapi({
    description: "Research collaboration invitation to decline",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().openapi({
    description:
      "Research workspace to permanently archive with all discovered insights",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const deleteTeamMemberSchema = z.object({
  teamId: z.string().openapi({
    description:
      "Research workspace containing shared insights and applied outcomes",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  userId: z.string().openapi({
    description:
      "Researcher to revoke access from discovery and publishing capabilities",
    example: "456e7890-f12a-34b5-c678-901234567890",
  }),
});

export const updateTeamMemberSchema = z.object({
  teamId: z.string().openapi({
    description:
      "Research workspace where collaboration permissions are managed",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  userId: z.string().openapi({
    description:
      "Researcher whose discovery and publishing permissions to modify",
    example: "456e7890-f12a-34b5-c678-901234567890",
  }),
  role: z.enum(["owner", "member"]).openapi({
    description:
      "Research access level: 'owner' can publish and configure playbooks, 'member' can discover and apply insights",
    example: "member",
  }),
});

export const inviteTeamMembersSchema = z
  .array(
    z.object({
      email: z.string().openapi({
        description:
          "Email of researcher to invite for collaborative discovery",
        example: "john.doe@acme.com",
      }),
      role: z.enum(["owner", "member"]).openapi({
        description:
          "Research permissions: 'owner' publishes insights and manages playbooks, 'member' discovers and applies outcomes",
        example: "member",
      }),
    }),
  )
  .openapi({
    description:
      "Researchers to invite for collaborative discovery and insight publishing",
    example: [
      { email: "john.doe@acme.com", role: "member" },
      { email: "jane.smith@acme.com", role: "owner" },
    ],
  });

export const deleteTeamInviteSchema = z.object({
  id: z.string().openapi({
    description: "Pending research collaboration invitation to revoke",
    example: "invite-123abc456def",
  }),
});

export const teamMemberResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the research collaborator",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  role: z.enum(["owner", "member"]).openapi({
    description:
      "Research capabilities: 'owner' publishes insights and configures playbooks, 'member' discovers and applies outcomes",
    example: "owner",
  }),
  fullName: z.string().openapi({
    description: "Researcher's name for attribution in published insights",
    example: "John Doe",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description:
      "Visual identity for research collaboration and citation tracking",
    example: "https://cdn.zekehq.com/avatars/john-doe.png",
  }),
});

export const teamMembersResponseSchema = z.object({
  data: z.array(teamMemberResponseSchema).openapi({
    description:
      "Research collaborators with their discovery and publishing permissions",
  }),
});

export const teamSetActiveInputSchema = z.object({
  teamId: z.string().uuid().openapi({
    description: "Research workspace to activate for discovery and analysis",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const teamIdInputSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the research team workspace",
      example: "123e4567-e89b-12d3-a456-426614174000",
      param: {
        in: "path",
        name: "id",
        required: true,
      },
    }),
});

export const teamDetailSchema = teamResponseSchema
  .extend({
    members: z.array(teamMemberResponseSchema).openapi({
      description: "Research collaborators in the workspace",
    }),
  })
  .openapi({
    description: "Detailed research workspace information with team members",
  });

export const teamInvitesSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["owner", "member"]),
        createdAt: z.string(),
      }),
    )
    .openapi({
      description: "Pending research collaboration invitations",
    }),
});

export const updateBaseCurrencySchema = z.object({
  baseCurrency: z.string().length(3).openapi({
    description: "ISO 4217 currency code for financial research analysis",
    example: "USD",
  }),
});
