import type { Context } from "@api/rest/types";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import {
  teamDetailSchema,
  teamIdInputSchema,
  teamInvitesSchema,
  teamsResponseSchema as teamListResponseSchema,
  teamSetActiveInputSchema,
} from "@api/schemas/team";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  getTeamInvitesByEmail,
  getTeamSummaryById,
  getTeamsForUser,
  setActiveTeam,
} from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List teams",
    description: "Return teams the current user can access.",
    operationId: "listTeams",
    tags: ["Teams"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Teams accessible to the user.",
        content: {
          "application/json": {
            schema: teamListResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const teams = await getTeamsForUser(db, { userId: session.user.id });

    const payload = teams.map((team) => ({
      id: team.id,
      name: team.name ?? "Untitled Team",
      slug: team.slug ?? null,
      logoUrl: team.logoUrl ?? null,
      planCode: team.planCode ?? null,
    }));

    return c.json(validateResponse(payload, teamListResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/current",
    summary: "Current team",
    description: "Return the active team resolved from the session.",
    operationId: "getCurrentTeam",
    tags: ["Teams"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Active team or null if none selected.",
        content: {
          "application/json": {
            schema: teamDetailSchema.nullable(),
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      return c.json(null);
    }

    const team = await getTeamSummaryById(db, teamId);

    if (!team) {
      return c.json(null);
    }

    const payload = {
      id: team.id,
      name: team.name,
      slug: team.slug,
      logoUrl: team.logoUrl,
      planCode: team.planCode,
      metadata: (team.metadata ?? null) as Record<string, unknown> | null,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    return c.json(validateResponse(payload, teamDetailSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/active",
    summary: "Set active team",
    description: "Switch the user's active team.",
    operationId: "setActiveTeam",
    tags: ["Teams"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: teamSetActiveInputSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Active team updated.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.manage")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const body = c.req.valid("json");

    await setActiveTeam(db, {
      userId: session.user.id,
      teamId: body.teamId,
    });

    return c.json({ success: true } as const);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/invites",
    summary: "Pending invites",
    description: "Return team invites for the current user's email.",
    operationId: "listTeamInvites",
    tags: ["Teams"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Pending or historical team invites.",
        content: {
          "application/json": {
            schema: z.array(teamInvitesSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.email) {
      return c.json([]);
    }

    const invites = await getTeamInvitesByEmail(db, {
      email: session.user.email,
    });

    const payload = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role ?? "member",
      status: invite.status ?? "pending",
      expiresAt: invite.expiresAt,
      team: invite.team
        ? {
            id: invite.team.id,
            name: invite.team.name,
            slug: invite.team.slug,
            logoUrl: invite.team.logoUrl,
            planCode: invite.team.planCode,
          }
        : null,
    }));

    return c.json(validateResponse(payload, z.array(teamInvitesSchema)));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{teamId}",
    summary: "Team detail",
    description: "Fetch details for a specific team the user has access to.",
    operationId: "getTeam",
    tags: ["Teams"],
    security: [{ bearerAuth: [] }],
    request: {
      params: teamIdInputSchema,
    },
    responses: {
      200: {
        description: "Team detail.",
        content: {
          "application/json": {
            schema: teamDetailSchema,
          },
        },
      },
      404: {
        description: "Team not found.",
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const { teamId } = c.req.valid("param");

    const memberships = await getTeamsForUser(db, {
      userId: session.user.id,
    });

    const hasAccess = memberships.some((team) => team.id === teamId);

    if (!hasAccess) {
      throw new HTTPException(403, {
        message: "No permission to access this team",
      });
    }

    const team = await getTeamSummaryById(db, teamId);

    if (!team) {
      throw new HTTPException(404, {
        message: "Team not found",
      });
    }

    const payload = {
      id: team.id,
      name: team.name,
      slug: team.slug,
      logoUrl: team.logoUrl,
      planCode: team.planCode,
      metadata: (team.metadata ?? null) as Record<string, unknown> | null,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    return c.json(validateResponse(payload, teamDetailSchema));
  },
);

export const teamsRouter = app;
