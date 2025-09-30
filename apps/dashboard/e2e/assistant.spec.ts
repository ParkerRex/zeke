import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Helper to set up authenticated session
async function setupAuth(page: Page) {
  await page.context().addCookies([
    {
      name: "session",
      value: "valid-session-token",
      domain: "localhost",
      path: "/",
    },
  ]);
}

// Mock streaming response
async function mockChatResponse(page: Page, response: string) {
  await page.route("**/api/chat", async (route) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send response in chunks to simulate streaming
        const chunks = response.split(" ");
        chunks.forEach((chunk, index) => {
          setTimeout(() => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: `${chunk} ` })}\n\n`,
              ),
            );
            if (index === chunks.length - 1) {
              controller.close();
            }
          }, index * 50);
        });
      },
    });

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: stream,
    });
  });
}

test.describe("Assistant Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/");
  });

  test("should display empty chat state", async ({ page }) => {
    const chatInterface = page.locator("[data-testid='chat-interface']");
    await expect(chatInterface).toBeVisible();

    // Empty state should be visible
    const emptyState = chatInterface.locator("[data-testid='chat-empty']");
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText(/how can i help/i)).toBeVisible();

    // Example prompts should be displayed
    const examples = chatInterface.locator("[data-testid='chat-example']");
    expect(await examples.count()).toBeGreaterThan(0);
  });

  test("should send a message and receive response", async ({ page }) => {
    await mockChatResponse(
      page,
      "I can help you with AI research and analysis.",
    );

    const chatInput = page.locator("[data-testid='chat-input']");
    const sendButton = page.locator("[data-testid='send-button']");

    // Type message
    await chatInput.fill("Tell me about recent AI developments");

    // Send message
    await sendButton.click();

    // User message should appear
    const userMessage = page.locator("[data-testid='message-user']").last();
    await expect(userMessage).toBeVisible();
    await expect(userMessage).toContainText(
      "Tell me about recent AI developments",
    );

    // Assistant response should stream in
    const assistantMessage = page
      .locator("[data-testid='message-assistant']")
      .last();
    await expect(assistantMessage).toBeVisible();

    // Wait for streaming to complete
    await page.waitForTimeout(2000);

    // Response should contain expected text
    await expect(assistantMessage).toContainText(
      "I can help you with AI research",
    );

    // Input should be cleared and ready for next message
    await expect(chatInput).toHaveValue("");
    await expect(chatInput).toBeEnabled();
  });

  test("should handle example prompt clicks", async ({ page }) => {
    await mockChatResponse(page, "Here's the latest on AI trends...");

    // Click an example prompt
    const example = page.locator("[data-testid='chat-example']").first();
    const exampleText = await example.textContent();
    await example.click();

    // Example text should be sent as message
    const userMessage = page.locator("[data-testid='message-user']").last();
    await expect(userMessage).toBeVisible();
    if (exampleText) {
      await expect(userMessage).toContainText(exampleText);
    }

    // Should receive response
    await expect(
      page.locator("[data-testid='message-assistant']").last(),
    ).toBeVisible();
  });

  test("should show typing indicator while processing", async ({ page }) => {
    // Delay response to see typing indicator
    await page.route("**/api/chat", async (route) => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: 'data: {"content": "Response"}\n\n',
      });
    });

    const chatInput = page.locator("[data-testid='chat-input']");
    await chatInput.fill("Test message");
    await page.locator("[data-testid='send-button']").click();

    // Typing indicator should appear
    const typingIndicator = page.locator("[data-testid='typing-indicator']");
    await expect(typingIndicator).toBeVisible();

    // Wait for response
    await page.waitForTimeout(3000);

    // Typing indicator should disappear
    await expect(typingIndicator).not.toBeVisible();
  });

  test("should handle tool invocations", async ({ page }) => {
    // Mock response with tool call
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({
          content: "I'll search for that information.",
          toolInvocations: [
            {
              toolName: "webSearch",
              args: { query: "AI news" },
              result: { found: 5 },
            },
          ],
        })}\n\n`,
      });
    });

    await page.locator("[data-testid='chat-input']").fill("Search for AI news");
    await page.locator("[data-testid='send-button']").click();

    // Tool indicator should appear
    const toolIndicator = page.locator("[data-testid='tool-invocation']");
    await expect(toolIndicator).toBeVisible();
    await expect(toolIndicator).toContainText(/webSearch/i);
  });

  test("should persist chat history", async ({ page }) => {
    await mockChatResponse(page, "First response");

    // Send first message
    await page.locator("[data-testid='chat-input']").fill("First message");
    await page.locator("[data-testid='send-button']").click();

    await page.waitForTimeout(1000);

    // Navigate away
    await page.goto("/dashboard");

    // Navigate back to same chat
    await page.goto("/chat-123");

    // Previous messages should be visible
    const messages = page.locator("[data-testid^='message-']");
    expect(await messages.count()).toBeGreaterThanOrEqual(2);

    // Messages should be in order
    await expect(messages.first()).toContainText("First message");
  });
});

test.describe("Chat Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/");
  });

  test("should list previous chats in sidebar", async ({ page }) => {
    // Mock chat history
    await page.route("**/api/chats/list", async (route) => {
      await route.fulfill({
        json: {
          chats: [
            {
              id: "chat-1",
              title: "AI Research Discussion",
              createdAt: "2024-01-01",
            },
            { id: "chat-2", title: "Market Analysis", createdAt: "2024-01-02" },
            {
              id: "chat-3",
              title: "Technical Questions",
              createdAt: "2024-01-03",
            },
          ],
        },
      });
    });

    // Open chat history
    await page.getByRole("button", { name: /chat history/i }).click();

    const chatList = page.locator("[data-testid='chat-list']");
    await expect(chatList).toBeVisible();

    // Previous chats should be listed
    const chatItems = chatList.locator("[data-testid='chat-item']");
    expect(await chatItems.count()).toBe(3);

    // Click a chat to load it
    await chatItems.first().click();

    // Should navigate to that chat
    await expect(page).toHaveURL(/\/chat-1/);
  });

  test("should delete a chat", async ({ page }) => {
    await page.route("**/api/chats/list", async (route) => {
      await route.fulfill({
        json: {
          chats: [{ id: "chat-to-delete", title: "Test Chat" }],
        },
      });
    });

    // Open chat history
    await page.getByRole("button", { name: /chat history/i }).click();

    const chatItem = page.locator("[data-testid='chat-item']").first();

    // Hover to show delete button
    await chatItem.hover();

    // Click delete button
    const deleteButton = chatItem.locator("[data-testid='delete-chat']");
    await deleteButton.click();

    // Confirmation dialog should appear
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    await dialog.getByRole("button", { name: /delete/i }).click();

    // Chat should be removed from list
    await expect(chatItem).not.toBeVisible();

    // Success message should appear
    await expect(page.getByText(/chat deleted/i)).toBeVisible();
  });

  test("should rename a chat", async ({ page }) => {
    await page.route("**/api/chats/list", async (route) => {
      await route.fulfill({
        json: {
          chats: [{ id: "chat-to-rename", title: "Old Title" }],
        },
      });
    });

    // Open chat history
    await page.getByRole("button", { name: /chat history/i }).click();

    const chatItem = page.locator("[data-testid='chat-item']").first();

    // Hover to show edit button
    await chatItem.hover();

    // Click edit button
    const editButton = chatItem.locator("[data-testid='edit-chat']");
    await editButton.click();

    // Title should become editable
    const titleInput = chatItem.locator("input");
    await expect(titleInput).toBeVisible();

    // Change title
    await titleInput.fill("New Chat Title");
    await titleInput.press("Enter");

    // Title should be updated
    await expect(chatItem).toContainText("New Chat Title");
  });
});

test.describe("Artifact Viewing", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/");
  });

  test("should display artifacts from tool responses", async ({ page }) => {
    // Mock response with artifact
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({
          content: "I've created a trend analysis for you.",
          artifacts: [
            {
              type: "trend-analysis",
              id: "artifact-1",
              title: "AI Market Trends",
              content: { trends: ["Growing adoption", "New models"] },
            },
          ],
        })}\n\n`,
      });
    });

    // Send message that triggers artifact
    await page
      .locator("[data-testid='chat-input']")
      .fill("Analyze AI market trends");
    await page.locator("[data-testid='send-button']").click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Artifact should be displayed
    const artifact = page.locator("[data-testid='artifact-viewer']");
    await expect(artifact).toBeVisible();
    await expect(artifact).toContainText("AI Market Trends");

    // Canvas should render the artifact
    const canvas = artifact.locator("[data-testid='trend-canvas']");
    await expect(canvas).toBeVisible();
  });

  test("should expand/collapse artifacts", async ({ page }) => {
    // Navigate to chat with artifact
    await page.goto("/chat-with-artifact");

    const artifact = page.locator("[data-testid='artifact-viewer']");

    // Should be collapsible
    const toggleButton = artifact.locator("[data-testid='toggle-artifact']");
    await expect(toggleButton).toBeVisible();

    // Collapse
    await toggleButton.click();
    await expect(
      artifact.locator("[data-testid='artifact-content']"),
    ).not.toBeVisible();

    // Expand
    await toggleButton.click();
    await expect(
      artifact.locator("[data-testid='artifact-content']"),
    ).toBeVisible();
  });

  test("should copy artifact content", async ({ page }) => {
    // Navigate to chat with artifact
    await page.goto("/chat-with-artifact");

    const artifact = page.locator("[data-testid='artifact-viewer']");

    // Click copy button
    const copyButton = artifact.locator("[data-testid='copy-artifact']");
    await copyButton.click();

    // Success message should appear
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

    // Verify clipboard content (requires clipboard permissions)
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain("AI Market Trends");
  });
});

test.describe("Chat Feedback", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/chat-with-history");
  });

  test("should submit positive feedback", async ({ page }) => {
    const message = page.locator("[data-testid='message-assistant']").first();

    // Hover to show feedback buttons
    await message.hover();

    // Click thumbs up
    const thumbsUp = message.locator("[data-testid='feedback-positive']");
    await thumbsUp.click();

    // Button should show active state
    await expect(thumbsUp).toHaveAttribute("data-active", "true");

    // Success message
    await expect(page.getByText(/thanks for your feedback/i)).toBeVisible();
  });

  test("should submit negative feedback with comment", async ({ page }) => {
    const message = page.locator("[data-testid='message-assistant']").first();

    // Hover to show feedback buttons
    await message.hover();

    // Click thumbs down
    const thumbsDown = message.locator("[data-testid='feedback-negative']");
    await thumbsDown.click();

    // Feedback form should appear
    const feedbackForm = page.locator("[data-testid='feedback-form']");
    await expect(feedbackForm).toBeVisible();

    // Add comment
    const comment = feedbackForm.locator("textarea");
    await comment.fill("The response was not accurate");

    // Submit feedback
    await feedbackForm.getByRole("button", { name: /submit/i }).click();

    // Success message
    await expect(page.getByText(/feedback received/i)).toBeVisible();

    // Form should close
    await expect(feedbackForm).not.toBeVisible();
  });
});
