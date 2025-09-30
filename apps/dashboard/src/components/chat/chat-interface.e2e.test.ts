import { expect, test } from "@playwright/test";

/**
 * End-to-end tests for the chat interface
 * Tests the full user flow from typing messages to receiving AI responses
 */

test.describe("Chat Interface E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-user",
            email: "test@example.com",
            name: "Test User",
            teamId: "test-team",
          },
        }),
      });
    });

    // Navigate to chat page
    await page.goto("http://localhost:3000/chat");
  });

  test("should display empty state initially", async ({ page }) => {
    // Check for empty state elements
    await expect(page.locator('[data-testid="chat-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-examples"]')).toBeVisible();

    // Check for example prompts
    const examples = page.locator('[data-testid="example-prompt"]');
    await expect(examples).toHaveCount(5);
  });

  test("should send a message and receive response", async ({ page }) => {
    // Mock chat API response
    await page.route("**/api/chat", async (route) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send streaming response chunks
          controller.enqueue(encoder.encode('data: {"text":"Hello"}\n\n'));
          controller.enqueue(encoder.encode('data: {"text":" from"}\n\n'));
          controller.enqueue(
            encoder.encode('data: {"text":" assistant!"}\n\n'),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: stream,
        headers: {
          "X-Chat-Id": "new-chat-123",
        },
      });
    });

    // Type and send message
    const textarea = page.locator(
      'textarea[placeholder*="Ask about insights"]',
    );
    await textarea.fill("Hello, assistant!");

    // Submit with Enter key
    await textarea.press("Enter");

    // Wait for response
    await expect(page.locator('[data-testid="message-user"]')).toContainText(
      "Hello, assistant!",
    );
    await expect(
      page.locator('[data-testid="message-assistant"]'),
    ).toContainText("Hello from assistant!");
  });

  test("should handle example prompt clicks", async ({ page }) => {
    // Click an example prompt
    const examplePrompt = page
      .locator('[data-testid="example-prompt"]')
      .first();
    const promptText = await examplePrompt.textContent();

    await examplePrompt.click();

    // Check that textarea is filled
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveValue(promptText || "");

    // Auto-submit should trigger
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible();
  });

  test("should handle streaming responses", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      const encoder = new TextEncoder();
      const chunkIndex = 0;
      const chunks = [
        'data: {"text":"This"}\n\n',
        'data: {"text":" is"}\n\n',
        'data: {"text":" a"}\n\n',
        'data: {"text":" streaming"}\n\n',
        'data: {"text":" response."}\n\n',
        "data: [DONE]\n\n",
      ];

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: stream,
      });
    });

    // Send message
    const textarea = page.locator("textarea");
    await textarea.fill("Test streaming");
    await textarea.press("Enter");

    // Check for loading state
    await expect(
      page.locator('[data-testid="loading-indicator"]'),
    ).toBeVisible();

    // Wait for complete response
    await expect(
      page.locator('[data-testid="message-assistant"]'),
    ).toContainText("This is a streaming response.", { timeout: 10000 });
  });

  test("should provide feedback on messages", async ({ page }) => {
    // Setup chat with messages
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        body: 'data: {"text":"Test response"}\n\ndata: [DONE]\n\n',
      });
    });

    // Mock feedback API
    await page.route("**/api/trpc/chats.feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Send a message first
    const textarea = page.locator("textarea");
    await textarea.fill("Test message");
    await textarea.press("Enter");

    // Wait for response
    await page.waitForSelector('[data-testid="message-assistant"]');

    // Click thumbs up on assistant message
    const thumbsUp = page.locator('[data-testid="feedback-positive"]').first();
    await thumbsUp.click();

    // Check for feedback confirmation
    await expect(page.locator(".toast")).toContainText("Feedback received");
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    // Send message
    const textarea = page.locator("textarea");
    await textarea.fill("This will error");
    await textarea.press("Enter");

    // Check for error toast
    await expect(page.locator(".toast.destructive")).toContainText(
      "Chat error",
    );
  });

  test("should persist chat across page refreshes", async ({ page }) => {
    // Mock chat list API
    await page.route("**/api/trpc/chats.list", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              items: [
                {
                  id: "chat-123",
                  title: "Previous Chat",
                  messageCount: 5,
                  updatedAt: new Date().toISOString(),
                },
              ],
              pagination: {
                total: 1,
                hasMore: false,
              },
            },
          },
        }),
      });
    });

    // Navigate to specific chat
    await page.goto("http://localhost:3000/chat/chat-123");

    // Mock get chat API
    await page.route("**/api/trpc/chats.get", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              chat: { id: "chat-123", title: "Previous Chat" },
              messages: [
                { role: "user", content: "Previous question" },
                { role: "assistant", content: "Previous answer" },
              ],
            },
          },
        }),
      });
    });

    // Check that previous messages are displayed
    await expect(page.locator('[data-testid="message-user"]')).toContainText(
      "Previous question",
    );
    await expect(
      page.locator('[data-testid="message-assistant"]'),
    ).toContainText("Previous answer");
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    const textarea = page.locator("textarea");

    // Type message
    await textarea.fill("Line 1");

    // Shift+Enter should add new line
    await textarea.press("Shift+Enter");
    await textarea.type("Line 2");

    const value = await textarea.inputValue();
    expect(value).toContain("Line 1\nLine 2");

    // Enter should send (already tested above)
  });

  test("should handle stop generation", async ({ page }) => {
    // Mock slow streaming response
    await page.route("**/api/chat", async (route) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Slow stream that can be interrupted
          for (let i = 0; i < 10; i++) {
            controller.enqueue(
              encoder.encode(`data: {"text":" word${i}"}\n\n`),
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: stream,
      });
    });

    // Send message
    const textarea = page.locator("textarea");
    await textarea.fill("Generate long response");
    await textarea.press("Enter");

    // Wait for streaming to start
    await expect(page.locator('[data-testid="stop-button"]')).toBeVisible();

    // Click stop
    await page.locator('[data-testid="stop-button"]').click();

    // Stop button should disappear
    await expect(page.locator('[data-testid="stop-button"]')).not.toBeVisible();
  });

  test("should display location context if available", async ({
    page,
    context,
  }) => {
    // Grant location permission
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });

    // Mock location API response
    await page.route("**/api/location", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          city: "San Francisco",
          region: "CA",
          country: "US",
        }),
      });
    });

    await page.goto("http://localhost:3000/chat");

    // Check for location indicator
    await expect(
      page.locator('[data-testid="location-indicator"]'),
    ).toContainText("San Francisco, CA, US");
  });
});

test.describe("Chat Interface Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("http://localhost:3000/chat");

    // Tab to textarea
    await page.keyboard.press("Tab");
    const textarea = page.locator("textarea");
    await expect(textarea).toBeFocused();

    // Type and send with keyboard
    await textarea.type("Keyboard test");
    await textarea.press("Enter");

    // Tab through messages and actions
    await page.keyboard.press("Tab"); // Send button
    await page.keyboard.press("Tab"); // Feedback button

    // All interactive elements should be reachable
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("http://localhost:3000/chat");

    // Check ARIA labels
    await expect(page.locator("textarea")).toHaveAttribute(
      "aria-label",
      /message|chat/i,
    );
    await expect(page.locator('button[type="submit"]')).toHaveAttribute(
      "aria-label",
      /send/i,
    );
  });

  test("should announce status changes to screen readers", async ({ page }) => {
    await page.goto("http://localhost:3000/chat");

    // Check for live regions
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();

    // Send a message
    const textarea = page.locator("textarea");
    await textarea.fill("Screen reader test");
    await textarea.press("Enter");

    // Status should be announced
    await expect(liveRegion).toContainText(/sending|processing/i);
  });
});
