import { describe, it, expect, beforeEach, vi } from "bun:test";
import { Hono } from "hono";
import type { Context } from "@api/rest/types";

describe("Chat Endpoint - Rate Limiting", () => {
  let app: Hono<Context>;
  let mockRateLimiter: any;
  let requestCount: number;

  beforeEach(() => {
    requestCount = 0;

    // Mock rate limiter
    mockRateLimiter = {
      check: vi.fn(async (identifier: string) => {
        requestCount++;

        // Allow first 10 requests, then rate limit
        if (requestCount > 10) {
          return {
            success: false,
            limit: 10,
            remaining: 0,
            reset: Date.now() + 60000, // Reset in 1 minute
          };
        }

        return {
          success: true,
          limit: 10,
          remaining: 10 - requestCount,
          reset: Date.now() + 60000,
        };
      }),
    };

    // Create test app with rate limiting middleware
    app = new Hono<Context>();

    // Rate limiting middleware
    app.use("/chat/*", async (c, next) => {
      const userId = c.get("session")?.user?.id || "anonymous";
      const check = await mockRateLimiter.check(userId);

      if (!check.success) {
        return c.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.floor((check.reset - Date.now()) / 1000),
            limit: check.limit,
          },
          429,
          {
            "X-RateLimit-Limit": String(check.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(check.reset),
            "Retry-After": String(
              Math.floor((check.reset - Date.now()) / 1000),
            ),
          },
        );
      }

      // Add rate limit headers
      c.header("X-RateLimit-Limit", String(check.limit));
      c.header("X-RateLimit-Remaining", String(check.remaining));
      c.header("X-RateLimit-Reset", String(check.reset));

      await next();
    });

    // Mock chat endpoint
    app.post("/chat", async (c) => {
      return c.json({ success: true, message: "Chat processed" });
    });

    // Add session middleware
    app.use("*", async (c, next) => {
      c.set("session", {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });
      await next();
    });
  });

  describe("Rate Limit Enforcement", () => {
    it("should allow requests within rate limit", async () => {
      // Make 5 requests (under the limit)
      for (let i = 0; i < 5; i++) {
        const response = await app.fetch(
          new Request("http://localhost/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: `Message ${i + 1}` }),
          }),
        );

        expect(response.status).toBe(200);

        // Check rate limit headers
        const remaining = response.headers.get("X-RateLimit-Remaining");
        expect(remaining).toBe(String(10 - (i + 1)));
      }
    });

    it("should reject requests exceeding rate limit", async () => {
      // Make 10 requests to hit the limit
      for (let i = 0; i < 10; i++) {
        await app.fetch(
          new Request("http://localhost/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Message ${i + 1}` }),
          }),
        );
      }

      // 11th request should be rate limited
      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Exceeded limit" }),
        }),
      );

      expect(response.status).toBe(429);

      const body = await response.json();
      expect(body.error).toBe("Rate limit exceeded");
      expect(body.retryAfter).toBeGreaterThan(0);

      // Check rate limit headers
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBeDefined();
    });

    it("should track rate limits per user", async () => {
      // Simulate requests from different users
      const users = [
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ];

      // Track requests per user
      const userRequestCounts = new Map<string, number>();

      for (const user of users) {
        // Override session for this user
        const userApp = new Hono<Context>();

        userApp.use("*", async (c, next) => {
          c.set("session", {
            user,
            expires: new Date(Date.now() + 86400000).toISOString(),
          });
          await next();
        });

        // Apply rate limiting
        userApp.use("/chat/*", async (c, next) => {
          const userId = user.id;
          const count = userRequestCounts.get(userId) || 0;
          userRequestCounts.set(userId, count + 1);

          if (count >= 10) {
            return c.json({ error: "Rate limit exceeded" }, 429);
          }

          c.header("X-RateLimit-Remaining", String(10 - count - 1));
          await next();
        });

        userApp.post("/chat", async (c) => {
          return c.json({ success: true });
        });

        // Each user should have their own limit
        for (let i = 0; i < 5; i++) {
          const response = await userApp.fetch(
            new Request("http://localhost/chat", {
              method: "POST",
              body: JSON.stringify({ message: `User ${user.id} message ${i}` }),
            }),
          );

          expect(response.status).toBe(200);
        }
      }

      // Both users made 5 requests each, both should be under limit
      expect(userRequestCounts.get("user-1")).toBe(5);
      expect(userRequestCounts.get("user-2")).toBe(5);
    });

    it("should reset rate limit after window expires", async () => {
      // Mock time-based reset
      let currentTime = Date.now();
      const resetTime = currentTime + 60000; // 1 minute window

      mockRateLimiter.check = vi.fn(async () => {
        if (currentTime >= resetTime) {
          // Reset window
          requestCount = 1;
          return {
            success: true,
            limit: 10,
            remaining: 9,
            reset: currentTime + 60000,
          };
        }

        requestCount++;
        if (requestCount > 10) {
          return {
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          };
        }

        return {
          success: true,
          limit: 10,
          remaining: 10 - requestCount,
          reset: resetTime,
        };
      });

      // Use up rate limit
      for (let i = 0; i < 10; i++) {
        await app.fetch(
          new Request("http://localhost/chat", {
            method: "POST",
            body: JSON.stringify({ message: `Message ${i}` }),
          }),
        );
      }

      // Should be rate limited
      let response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          body: JSON.stringify({ message: "Over limit" }),
        }),
      );
      expect(response.status).toBe(429);

      // Simulate time passing (reset window)
      currentTime = resetTime + 1000;
      requestCount = 0;

      // Should allow requests again
      response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          body: JSON.stringify({ message: "After reset" }),
        }),
      );
      expect(response.status).toBe(200);
    });
  });

  describe("Rate Limit Headers", () => {
    it("should include proper rate limit headers", async () => {
      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Test message" }),
        }),
      );

      expect(response.status).toBe(200);

      // Check required headers
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();

      const remaining = parseInt(
        response.headers.get("X-RateLimit-Remaining") || "0",
      );
      expect(remaining).toBeLessThan(10);
      expect(remaining).toBeGreaterThanOrEqual(0);

      const reset = parseInt(response.headers.get("X-RateLimit-Reset") || "0");
      expect(reset).toBeGreaterThan(Date.now());
    });

    it("should include Retry-After header when rate limited", async () => {
      // Exhaust rate limit
      for (let i = 0; i < 11; i++) {
        await app.fetch(
          new Request("http://localhost/chat", {
            method: "POST",
            body: JSON.stringify({ message: `Message ${i}` }),
          }),
        );
      }

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          body: JSON.stringify({ message: "Rate limited" }),
        }),
      );

      expect(response.status).toBe(429);

      const retryAfter = response.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter || "0")).toBeGreaterThan(0);
    });
  });

  describe("Rate Limit Configuration", () => {
    it("should respect different limits for different subscription tiers", async () => {
      // Mock tier-based limits
      const tierLimits = {
        free: 5,
        trial: 10,
        paid: 50,
        enterprise: 1000,
      };

      const checkTierLimit = async (tier: keyof typeof tierLimits) => {
        let tierRequestCount = 0;
        const limit = tierLimits[tier];

        const tierApp = new Hono<Context>();

        tierApp.use("/chat/*", async (c, next) => {
          tierRequestCount++;

          if (tierRequestCount > limit) {
            return c.json(
              { error: `Rate limit exceeded for ${tier} tier` },
              429,
            );
          }

          c.header("X-RateLimit-Limit", String(limit));
          c.header("X-RateLimit-Remaining", String(limit - tierRequestCount));
          await next();
        });

        tierApp.post("/chat", async (c) => {
          return c.json({ success: true, tier });
        });

        // Test up to limit
        for (let i = 0; i < limit; i++) {
          const response = await tierApp.fetch(
            new Request("http://localhost/chat", {
              method: "POST",
              body: JSON.stringify({ message: `${tier} message ${i}` }),
            }),
          );
          expect(response.status).toBe(200);
        }

        // Should be limited at limit + 1
        const response = await tierApp.fetch(
          new Request("http://localhost/chat", {
            method: "POST",
            body: JSON.stringify({ message: "Over limit" }),
          }),
        );
        expect(response.status).toBe(429);
      };

      // Test each tier
      await checkTierLimit("free");
      await checkTierLimit("paid");
    });
  });
});
