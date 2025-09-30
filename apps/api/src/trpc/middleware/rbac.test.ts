import { describe, it, expect, beforeEach, vi } from "bun:test";
import { TRPCError } from "@trpc/server";
import { requirePermission, requireAnyPermission, roleUtils } from "./rbac";
import type { ApiContext } from "@api/context";

describe("RBAC Middleware", () => {
  let mockDb: any;
  let mockContext: ApiContext & { teamId?: string };
  let mockNext: any;

  beforeEach(() => {
    mockDb = {
      query: {
        teams: {
          findFirst: vi.fn(),
        },
        teamMembers: {
          findFirst: vi.fn(),
        },
      },
    };

    mockContext = {
      db: mockDb,
      session: {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      teamId: "team-456",
      headers: new Headers(),
    };

    mockNext = vi.fn(({ ctx }) => Promise.resolve({ ctx }));
  });

  describe("requirePermission", () => {
    it("should allow access for owner with all permissions", async () => {
      // Mock owner check
      mockDb.query.teams.findFirst.mockResolvedValue({
        id: "team-456",
        ownerId: "user-123",
      });

      const middleware = requirePermission("manage:billing");
      const result = await middleware({ ctx: mockContext, next: mockNext });

      expect(mockNext).toHaveBeenCalled();
      expect(result.ctx.userRole).toBe("owner");
      expect(result.ctx.permissions).toContain("manage:billing");
    });

    it("should allow access for admin with appropriate permission", async () => {
      // Mock not owner
      mockDb.query.teams.findFirst.mockResolvedValue(null);

      // Mock admin membership
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        userId: "user-123",
        teamId: "team-456",
        role: "admin",
      });

      const middleware = requirePermission("write:stories");
      const result = await middleware({ ctx: mockContext, next: mockNext });

      expect(mockNext).toHaveBeenCalled();
      expect(result.ctx.userRole).toBe("admin");
      expect(result.ctx.permissions).toContain("write:stories");
    });

    it("should deny access for member without permission", async () => {
      // Mock not owner
      mockDb.query.teams.findFirst.mockResolvedValue(null);

      // Mock member membership
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        userId: "user-123",
        teamId: "team-456",
        role: "member",
      });

      const middleware = requirePermission("manage:team");

      await expect(
        middleware({ ctx: mockContext, next: mockNext }),
      ).rejects.toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access for viewer trying to write", async () => {
      // Mock not owner
      mockDb.query.teams.findFirst.mockResolvedValue(null);

      // Mock viewer membership
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        userId: "user-123",
        teamId: "team-456",
        role: "viewer",
      });

      const middleware = requirePermission("write:stories");

      await expect(
        middleware({ ctx: mockContext, next: mockNext }),
      ).rejects.toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED if no session", async () => {
      const contextWithoutSession = { ...mockContext, session: null };
      const middleware = requirePermission("read:stories");

      await expect(
        middleware({ ctx: contextWithoutSession, next: mockNext }),
      ).rejects.toThrow(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        }),
      );
    });

    it("should throw FORBIDDEN if no team context", async () => {
      const contextWithoutTeam = { ...mockContext, teamId: null };
      const middleware = requirePermission("read:stories");

      await expect(
        middleware({ ctx: contextWithoutTeam, next: mockNext }),
      ).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "Team context required",
        }),
      );
    });

    it("should throw FORBIDDEN if user not member of team", async () => {
      // Mock not owner and not member
      mockDb.query.teams.findFirst.mockResolvedValue(null);
      mockDb.query.teamMembers.findFirst.mockResolvedValue(null);

      const middleware = requirePermission("read:stories");

      await expect(
        middleware({ ctx: mockContext, next: mockNext }),
      ).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this team",
        }),
      );
    });
  });

  describe("requireAnyPermission", () => {
    it("should allow access if user has at least one permission", async () => {
      // Mock member with some permissions
      mockDb.query.teams.findFirst.mockResolvedValue(null);
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        userId: "user-123",
        teamId: "team-456",
        role: "member",
      });

      const middleware = requireAnyPermission([
        "manage:team", // Member doesn't have
        "write:stories", // Member has this
        "delete:stories", // Member doesn't have
      ]);

      const result = await middleware({ ctx: mockContext, next: mockNext });

      expect(mockNext).toHaveBeenCalled();
      expect(result.ctx.userRole).toBe("member");
    });

    it("should deny access if user has none of the permissions", async () => {
      // Mock viewer with limited permissions
      mockDb.query.teams.findFirst.mockResolvedValue(null);
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        userId: "user-123",
        teamId: "team-456",
        role: "viewer",
      });

      const middleware = requireAnyPermission([
        "write:stories",
        "delete:stories",
        "manage:team",
      ]);

      await expect(
        middleware({ ctx: mockContext, next: mockNext }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("roleUtils", () => {
    describe("getUserRole", () => {
      it("should return 'owner' if user is team owner", async () => {
        mockDb.query.teams.findFirst.mockResolvedValue({
          id: "team-456",
          ownerId: "user-123",
        });

        const role = await roleUtils.getUserRole(
          mockDb,
          "user-123",
          "team-456",
        );
        expect(role).toBe("owner");
      });

      it("should return correct role from membership", async () => {
        mockDb.query.teams.findFirst.mockResolvedValue(null);
        mockDb.query.teamMembers.findFirst.mockResolvedValue({
          userId: "user-123",
          teamId: "team-456",
          role: "admin",
        });

        const role = await roleUtils.getUserRole(
          mockDb,
          "user-123",
          "team-456",
        );
        expect(role).toBe("admin");
      });

      it("should return null if user not in team", async () => {
        mockDb.query.teams.findFirst.mockResolvedValue(null);
        mockDb.query.teamMembers.findFirst.mockResolvedValue(null);

        const role = await roleUtils.getUserRole(
          mockDb,
          "user-123",
          "team-456",
        );
        expect(role).toBeNull();
      });
    });

    describe("hasPermission", () => {
      it("should return true if role has permission", () => {
        expect(roleUtils.hasPermission("owner", "manage:billing")).toBe(true);
        expect(roleUtils.hasPermission("admin", "write:stories")).toBe(true);
        expect(roleUtils.hasPermission("member", "read:stories")).toBe(true);
        expect(roleUtils.hasPermission("viewer", "read:insights")).toBe(true);
      });

      it("should return false if role lacks permission", () => {
        expect(roleUtils.hasPermission("admin", "manage:billing")).toBe(false);
        expect(roleUtils.hasPermission("member", "delete:stories")).toBe(false);
        expect(roleUtils.hasPermission("viewer", "write:stories")).toBe(false);
      });
    });
  });
});
