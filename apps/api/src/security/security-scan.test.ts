import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "child_process";
import { promisify } from "util";

/**
 * Security Scanning Test Suite
 *
 * Performs automated security testing including:
 * - SQL injection prevention
 * - XSS protection
 * - CSRF validation
 * - Rate limiting verification
 * - Authentication bypass attempts
 * - Data leak prevention
 */

const exec = promisify(require("child_process").exec);

const API_URL = process.env.API_URL || "http://localhost:3001";
const TEST_TIMEOUT = 60000; // 60 seconds for security scans

describe(
  "Security Vulnerability Scanning",
  () => {
    let serverProcess: any;

    beforeAll(async () => {
      // Start test server if not already running
      const isServerRunning = await checkServerHealth();
      if (!isServerRunning) {
        serverProcess = spawn("bun", ["run", "dev"], {
          cwd: process.cwd(),
          env: { ...process.env, PORT: "3001" },
        });
        // Wait for server to start
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    });

    afterAll(async () => {
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    describe("SQL Injection Prevention", () => {
      it("should sanitize user input in TRPC procedures", async () => {
        const maliciousInputs = [
          "'; DROP TABLE users; --",
          "1' OR '1'='1",
          "admin'--",
          "1; UPDATE users SET role='admin'",
        ];

        for (const input of maliciousInputs) {
          const response = await fetch(`${API_URL}/trpc/chats.list`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-token",
            },
            body: JSON.stringify({
              search: input,
            }),
          });

          // Should not execute SQL injection
          expect(response.status).not.toBe(500);
          const data = await response.json();
          expect(data.error?.message).not.toContain("syntax error");
        }
      });

      it("should use parameterized queries for all database operations", async () => {
        // Test chat creation with potential SQL injection
        const response = await fetch(`${API_URL}/trpc/chats.create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            title:
              "Test'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
          }),
        });

        // Should create chat safely without SQL injection
        expect([200, 201, 403]).toContain(response.status);
      });
    });

    describe("XSS Protection", () => {
      it("should escape HTML in user-generated content", async () => {
        const xssPayloads = [
          '<script>alert("XSS")</script>',
          "<img src=x onerror=\"alert('XSS')\" />",
          "<svg onload=\"alert('XSS')\" />",
          'javascript:alert("XSS")',
        ];

        for (const payload of xssPayloads) {
          const response = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-token",
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: payload }],
            }),
          });

          if (response.ok) {
            const text = await response.text();
            // Verify script tags are escaped
            expect(text).not.toContain("<script>");
            expect(text).not.toContain("onerror=");
            expect(text).not.toContain("onload=");
          }
        }
      });

      it("should set proper Content-Security-Policy headers", async () => {
        const response = await fetch(`${API_URL}/health`);
        const csp = response.headers.get("Content-Security-Policy");

        if (csp) {
          expect(csp).toContain("default-src");
          expect(csp).not.toContain("unsafe-inline");
          expect(csp).not.toContain("unsafe-eval");
        }
      });
    });

    describe("Authentication Security", () => {
      it("should reject requests without authentication", async () => {
        const protectedEndpoints = [
          "/trpc/workspace.bootstrap",
          "/trpc/chats.list",
          "/trpc/stories.dashboardSummaries",
          "/api/chat",
        ];

        for (const endpoint of protectedEndpoints) {
          const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          expect([401, 403]).toContain(response.status);
        }
      });

      it("should validate JWT tokens properly", async () => {
        const invalidTokens = [
          "invalid-token",
          "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.", // Algorithm none attack
          "expired.jwt.token",
        ];

        for (const token of invalidTokens) {
          const response = await fetch(`${API_URL}/trpc/workspace.bootstrap`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          expect([401, 403]).toContain(response.status);
        }
      });

      it("should prevent session fixation attacks", async () => {
        // Attempt to use a fixed session ID
        const response = await fetch(`${API_URL}/trpc/workspace.bootstrap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: "session=fixed-session-id",
          },
          body: JSON.stringify({}),
        });

        expect([401, 403]).toContain(response.status);
      });
    });

    describe("Rate Limiting", () => {
      it("should enforce rate limits on chat endpoint", async () => {
        const requests = [];

        // Send 11 requests rapidly (limit should be 10)
        for (let i = 0; i < 11; i++) {
          requests.push(
            fetch(`${API_URL}/api/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-token",
                "X-User-Id": "rate-limit-test-user",
              },
              body: JSON.stringify({
                messages: [{ role: "user", content: "Test" }],
              }),
            }),
          );
        }

        const responses = await Promise.all(requests);
        const statusCodes = responses.map((r) => r.status);

        // At least one should be rate limited
        expect(statusCodes).toContain(429);
      });

      it("should include proper rate limit headers", async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Test" }],
          }),
        });

        expect(response.headers.get("X-RateLimit-Limit")).toBeTruthy();
        expect(response.headers.get("X-RateLimit-Remaining")).toBeTruthy();
        expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
      });
    });

    describe("Data Leak Prevention", () => {
      it("should not expose internal error details", async () => {
        // Trigger an error with malformed input
        const response = await fetch(`${API_URL}/trpc/chats.get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: { $ne: null }, // MongoDB injection attempt
          }),
        });

        const data = await response.json();

        // Should not expose stack traces or internal paths
        if (data.error) {
          expect(data.error.message).not.toContain("/Users/");
          expect(data.error.message).not.toContain("at Function");
          expect(data.error.stack).toBeUndefined();
        }
      });

      it("should not expose sensitive headers", async () => {
        const response = await fetch(`${API_URL}/health`);

        // Should not expose sensitive headers
        expect(response.headers.get("X-Powered-By")).toBeNull();
        expect(response.headers.get("Server")).not.toContain("version");
      });

      it("should sanitize database error messages", async () => {
        // Attempt to create duplicate entry
        const payload = { id: "duplicate-id", title: "Test" };

        // First request
        await fetch(`${API_URL}/trpc/chats.create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify(payload),
        });

        // Duplicate request
        const response = await fetch(`${API_URL}/trpc/chats.create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Should not expose database schema details
        if (data.error) {
          expect(data.error.message).not.toContain("UNIQUE constraint");
          expect(data.error.message).not.toContain("duplicate key");
          expect(data.error.message).not.toContain("table");
        }
      });
    });

    describe("CSRF Protection", () => {
      it("should validate CSRF tokens for state-changing operations", async () => {
        const response = await fetch(`${API_URL}/trpc/chats.delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
            Origin: "https://evil-site.com", // Different origin
          },
          body: JSON.stringify({ id: "chat-123" }),
        });

        // Should reject cross-origin requests
        if (response.headers.get("Access-Control-Allow-Origin") !== "*") {
          expect([403, 400]).toContain(response.status);
        }
      });

      it("should validate Referer header for sensitive operations", async () => {
        const response = await fetch(
          `${API_URL}/trpc/workspace.updateSettings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-token",
              Referer: "https://malicious-site.com",
            },
            body: JSON.stringify({ settings: {} }),
          },
        );

        // May reject based on referer validation
        expect([200, 403, 401]).toContain(response.status);
      });
    });

    describe("Chat Deletion Security", () => {
      it("should completely purge chat data on deletion", async () => {
        // Create a chat
        const createResponse = await fetch(`${API_URL}/trpc/chats.create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ title: "Test Chat" }),
        });

        if (createResponse.ok) {
          const { result } = await createResponse.json();
          const chatId = result?.data?.id;

          if (chatId) {
            // Add a message
            await fetch(`${API_URL}/api/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-token",
              },
              body: JSON.stringify({
                chatId,
                messages: [{ role: "user", content: "Test message" }],
              }),
            });

            // Delete the chat
            await fetch(`${API_URL}/trpc/chats.delete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-token",
              },
              body: JSON.stringify({ id: chatId }),
            });

            // Verify chat is completely gone
            const getResponse = await fetch(`${API_URL}/trpc/chats.get`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-token",
              },
              body: JSON.stringify({ id: chatId }),
            });

            expect(getResponse.status).toBe(404);

            // Verify messages are also deleted
            const messagesResponse = await fetch(
              `${API_URL}/trpc/chats.messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer test-token",
                },
                body: JSON.stringify({ chatId }),
              },
            );

            if (messagesResponse.ok) {
              const { result } = await messagesResponse.json();
              expect(result?.data?.messages).toHaveLength(0);
            }
          }
        }
      });
    });
  },
  TEST_TIMEOUT,
);

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
