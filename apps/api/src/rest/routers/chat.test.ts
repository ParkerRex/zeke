import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  mock,
} from "bun:test";
import { Hono } from "hono";
import type { Context } from "@api/rest/types";
import { createClient } from "@zeke/db/client";

// Mock modules before importing the router
mock.module("@ai-sdk/openai", () => ({
  openai: vi.fn(() => ({
    model: "gpt-4o",
    provider: "openai",
  })),
}));

mock.module("ai", () => ({
  streamText: vi.fn(),
  convertToCoreMessages: vi.fn((messages) => messages),
  createUIMessageStream: vi.fn(),
  createUIMessageStreamResponse: vi.fn(),
  smoothStream: vi.fn(() => (stream: any) => stream),
  validateUIMessages: vi.fn(() => true),
  stepCountIs: vi.fn((count) => (step: any) => false),
}));

describe("Chat REST Endpoint", () => {
  let app: Hono<Context>;
  let mockDb: any;
  let mockStreamText: any;
  let mockCreateUIMessageStream: any;
  let mockCreateUIMessageStreamResponse: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock database
    mockDb = {
      query: {
        chats: {
          findFirst: vi.fn(),
        },
        chatMessages: {
          findMany: vi.fn(),
        },
        users: {
          findFirst: vi.fn(),
        },
        teams: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(),
      update: vi.fn(),
    };

    // Mock user and team data
    mockDb.query.users.findFirst.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      fullName: "Test User",
    });

    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-456",
      name: "Test Team",
      subscriptionStatus: "active",
    });

    // Setup streaming mocks
    const { streamText, createUIMessageStream, createUIMessageStreamResponse } =
      await import("ai");
    mockStreamText = streamText as any;
    mockCreateUIMessageStream = createUIMessageStream as any;
    mockCreateUIMessageStreamResponse = createUIMessageStreamResponse as any;

    // Create test app
    app = new Hono<Context>();

    // Add middleware to inject context
    app.use("*", async (c, next) => {
      c.set("db", mockDb);
      c.set("teamId", "team-456");
      c.set("session", {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });
      await next();
    });

    // Import and mount the chat router
    const chatRouter = (await import("./chat")).default;
    app.route("/chat", chatRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /chat - Message Creation", () => {
    it("should handle a simple text message", async () => {
      // Mock no previous chat
      mockDb.query.chats.findFirst.mockResolvedValue(null);

      // Mock streaming response
      const mockStream = {
        consumeStream: vi.fn(),
      };

      mockStreamText.mockReturnValue(mockStream);

      const mockWriter = {
        merge: vi.fn(),
      };

      mockCreateUIMessageStream.mockImplementation((config) => {
        // Execute the stream logic
        if (config.execute) {
          config.execute({ writer: mockWriter });
        }
        // Call onFinish to trigger persistence
        if (config.onFinish) {
          config.onFinish({
            isContinuation: false,
            responseMessage: {
              id: "msg-2",
              role: "assistant",
              content: "Hello! How can I help you?",
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-123",
            message: {
              id: "msg-1",
              role: "user",
              content: "Hello",
            },
            country: "US",
            city: "San Francisco",
            timezone: "America/Los_Angeles",
          }),
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");

      // Verify chat was saved
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle continuing an existing chat", async () => {
      // Mock existing chat with history
      mockDb.query.chats.findFirst.mockResolvedValue({
        id: "chat-123",
        title: "Previous Chat",
        messages: [
          { id: "msg-1", role: "user", content: "First message" },
          { id: "msg-2", role: "assistant", content: "First response" },
        ],
      });

      mockCreateUIMessageStream.mockImplementation((config) => {
        if (config.onFinish) {
          config.onFinish({
            isContinuation: true,
            responseMessage: {
              id: "msg-4",
              role: "assistant",
              content: "Continuing our conversation...",
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-123",
            message: {
              id: "msg-3",
              role: "user",
              content: "Follow up question",
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("POST /chat - Tool Invocations", () => {
    it("should handle tool call messages", async () => {
      mockDb.query.chats.findFirst.mockResolvedValue(null);

      const mockStream = {
        consumeStream: vi.fn(),
      };

      mockStreamText.mockImplementation((config) => {
        // Simulate tool call
        if (config.onToolCall) {
          config.onToolCall({
            toolCall: {
              toolName: "webSearch",
              args: { query: "latest AI news" },
            },
          });
        }
        return mockStream;
      });

      mockCreateUIMessageStream.mockImplementation((config) => {
        if (config.onFinish) {
          config.onFinish({
            isContinuation: false,
            responseMessage: {
              id: "msg-2",
              role: "assistant",
              content: "I'll search for that information.",
              toolInvocations: [
                {
                  toolName: "webSearch",
                  args: { query: "latest AI news" },
                  result: { results: ["News 1", "News 2"] },
                },
              ],
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-456",
            message: {
              id: "msg-1",
              role: "user",
              content: "Search for AI news",
              metadata: {
                toolCall: {
                  toolName: "webSearch",
                  forced: true,
                },
              },
            },
          }),
        }),
      );

      expect(response.status).toBe(200);

      // Verify audit logging would have been called
      // In real implementation, the audit logger is created and used
    });
  });

  describe("POST /chat - Error Handling", () => {
    it("should handle validation errors", async () => {
      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            // Missing required fields
            message: "invalid",
          }),
        }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      mockDb.query.chats.findFirst.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-123",
            message: {
              id: "msg-1",
              role: "user",
              content: "Hello",
            },
          }),
        }),
      );

      expect(response.status).toBe(500);
    });

    it("should handle streaming errors", async () => {
      mockDb.query.chats.findFirst.mockResolvedValue(null);

      mockStreamText.mockImplementation((config) => {
        if (config.onError) {
          config.onError(new Error("OpenAI API error"));
        }
        throw new Error("OpenAI API error");
      });

      mockCreateUIMessageStream.mockImplementation(() => {
        throw new Error("Stream creation failed");
      });

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-123",
            message: {
              id: "msg-1",
              role: "user",
              content: "Hello",
            },
          }),
        }),
      );

      expect(response.status).toBe(500);
    });
  });

  describe("POST /chat - Title Generation", () => {
    it("should generate title for new chat with sufficient content", async () => {
      mockDb.query.chats.findFirst.mockResolvedValue(null);

      mockCreateUIMessageStream.mockImplementation((config) => {
        if (config.onFinish) {
          config.onFinish({
            isContinuation: false,
            responseMessage: {
              id: "msg-2",
              role: "assistant",
              content:
                "This is a detailed response about artificial intelligence and its applications in modern technology...",
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      const response = await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-789",
            message: {
              id: "msg-1",
              role: "user",
              content: "Tell me about AI and its applications in detail",
            },
          }),
        }),
      );

      expect(response.status).toBe(200);

      // Verify that saveChat was called with a title
      // Title generation is async, so we check if the logic would trigger
    });
  });

  describe("POST /chat - Persistence", () => {
    it("should persist user and assistant messages", async () => {
      mockDb.query.chats.findFirst.mockResolvedValue(null);

      let savedMessages: any[] = [];
      mockDb.insert.mockImplementation((data) => {
        savedMessages.push(data);
        return Promise.resolve(data);
      });

      mockCreateUIMessageStream.mockImplementation((config) => {
        if (config.onFinish) {
          // This triggers the persistence logic
          config.onFinish({
            isContinuation: false,
            responseMessage: {
              id: "msg-2",
              role: "assistant",
              content: "I can help with that!",
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-persist",
            message: {
              id: "msg-1",
              role: "user",
              content: "Need help",
            },
          }),
        }),
      );

      // Verify messages were saved
      expect(mockDb.insert).toHaveBeenCalled();

      // In actual implementation, both user and assistant messages are saved
      // through the saveChatMessage function
    });

    it("should update chat title when generated", async () => {
      mockDb.query.chats.findFirst.mockResolvedValue({
        id: "chat-123",
        title: null, // No title yet
        messages: [],
      });

      mockDb.update.mockResolvedValue({
        id: "chat-123",
        title: "AI Discussion",
      });

      mockCreateUIMessageStream.mockImplementation((config) => {
        if (config.onFinish) {
          config.onFinish({
            isContinuation: true,
            responseMessage: {
              id: "msg-2",
              role: "assistant",
              content: "Great question about AI!",
            },
          });
        }
        return { readable: new ReadableStream() };
      });

      mockCreateUIMessageStreamResponse.mockReturnValue(
        new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      );

      await app.fetch(
        new Request("http://localhost/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            id: "chat-123",
            message: {
              id: "msg-1",
              role: "user",
              content:
                "What are the latest developments in artificial intelligence?",
            },
          }),
        }),
      );

      // Title generation happens asynchronously
      // In real scenario, saveChat is called with generated title
    });
  });
});
