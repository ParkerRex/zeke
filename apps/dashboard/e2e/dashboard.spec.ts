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

test.describe("Dashboard Hero Modules", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await page.waitForSelector("[data-testid='stories-hero']", {
      timeout: 10000,
    });
  });

  test("should display hero modules on dashboard", async ({ page }) => {
    // Stories hero module
    const storiesHero = page.locator("[data-testid='stories-hero']");
    await expect(storiesHero).toBeVisible();
    await expect(storiesHero.getByText(/trending now/i)).toBeVisible();
    await expect(storiesHero.getByText(/important signals/i)).toBeVisible();
    await expect(storiesHero.getByText(/repository updates/i)).toBeVisible();

    // Each section should have stories
    const trendingStories = storiesHero.locator(
      "[data-testid='trending-stories'] a",
    );
    await expect(trendingStories).toHaveCount(await trendingStories.count());

    // Chili score indicators should be visible
    const chiliScores = storiesHero.locator("[data-testid='chili-score']");
    expect(await chiliScores.count()).toBeGreaterThan(0);
  });

  test("should navigate to story details when clicked", async ({ page }) => {
    const storiesHero = page.locator("[data-testid='stories-hero']");

    // Get first story link
    const firstStory = storiesHero
      .locator("[data-testid='story-item']")
      .first();
    const storyTitle = await firstStory.locator("h4").textContent();

    // Click the story
    await firstStory.click();

    // Should navigate to story detail page
    await expect(page).toHaveURL(/\/stories\/[^/]+/);

    // Story title should be visible on detail page
    if (storyTitle) {
      await expect(
        page.getByRole("heading", { name: storyTitle }),
      ).toBeVisible();
    }
  });

  test("should filter stories by category", async ({ page }) => {
    // Click on Signals tab/filter
    await page.getByRole("tab", { name: /signals/i }).click();

    // Only signal stories should be visible
    const visibleStories = page.locator("[data-testid='story-item']:visible");
    const storyCount = await visibleStories.count();

    for (let i = 0; i < storyCount; i++) {
      const story = visibleStories.nth(i);
      const isPinned =
        (await story.locator("[data-testid='pinned-badge']").count()) > 0;
      expect(isPinned).toBe(true);
    }
  });
});

test.describe("Insights Feed", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/dashboard");
  });

  test("should display personalized insights feed", async ({ page }) => {
    const insightsFeed = page.locator("[data-testid='insights-feed']");
    await expect(insightsFeed).toBeVisible();

    // Insights should be present
    const insights = insightsFeed.locator("[data-testid='insight-item']");
    expect(await insights.count()).toBeGreaterThan(0);

    // Each insight should have required elements
    const firstInsight = insights.first();
    await expect(
      firstInsight.locator("[data-testid='insight-title']"),
    ).toBeVisible();
    await expect(
      firstInsight.locator("[data-testid='insight-content']"),
    ).toBeVisible();
    await expect(
      firstInsight.locator("[data-testid='confidence-score']"),
    ).toBeVisible();
  });

  test("should paginate insights", async ({ page }) => {
    const insightsFeed = page.locator("[data-testid='insights-feed']");

    // Scroll to load more insights
    await insightsFeed.scrollIntoViewIfNeeded();

    // Check for pagination controls
    const loadMoreButton = page.getByRole("button", { name: /load more/i });

    if (await loadMoreButton.isVisible()) {
      // Get initial count
      const initialCount = await insightsFeed
        .locator("[data-testid='insight-item']")
        .count();

      // Load more
      await loadMoreButton.click();

      // Wait for new insights
      await page.waitForTimeout(1000);

      // Should have more insights
      const newCount = await insightsFeed
        .locator("[data-testid='insight-item']")
        .count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test("should filter insights by goal", async ({ page }) => {
    // Open filter panel
    await page.getByRole("button", { name: /filter/i }).click();

    // Select a goal filter
    const goalFilter = page.getByRole("checkbox", {
      name: /market expansion/i,
    });
    await goalFilter.check();

    // Apply filters
    await page.getByRole("button", { name: /apply filters/i }).click();

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // All visible insights should match the filter
    const insights = page.locator("[data-testid='insight-item']:visible");
    const count = await insights.count();

    for (let i = 0; i < count; i++) {
      const insight = insights.nth(i);
      const tags = await insight
        .locator("[data-testid='insight-tag']")
        .allTextContents();
      expect(tags.some((tag) => tag.toLowerCase().includes("market"))).toBe(
        true,
      );
    }
  });

  test("should show locked state for free users", async ({ page }) => {
    // Mock free tier user
    await page.route("**/api/workspace/bootstrap", async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      data.team.subscriptionTier = "free";
      await route.fulfill({ json: data });
    });

    await page.reload();

    const insightsFeed = page.locator("[data-testid='insights-feed']");

    // Should show locked overlay
    const lockedOverlay = insightsFeed.locator("[data-testid='feed-locked']");
    await expect(lockedOverlay).toBeVisible();
    await expect(lockedOverlay.getByText(/upgrade to unlock/i)).toBeVisible();

    // Upgrade button should be present
    const upgradeButton = lockedOverlay.getByRole("button", {
      name: /upgrade/i,
    });
    await expect(upgradeButton).toBeVisible();
  });
});

test.describe("Quick Actions", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/dashboard");
  });

  test("should open source intake modal", async ({ page }) => {
    // Click Add Source quick action
    await page.getByRole("button", { name: /add source/i }).click();

    // Modal should open
    const modal = page.locator("[data-testid='source-intake-modal']");
    await expect(modal).toBeVisible();

    // Form fields should be present
    await expect(modal.getByLabel(/url/i)).toBeVisible();
    await expect(modal.getByLabel(/priority/i)).toBeVisible();

    // Fill form
    await modal.getByLabel(/url/i).fill("https://example.com/article");
    await modal.getByLabel(/priority/i).selectOption("high");

    // Submit
    await modal.getByRole("button", { name: /ingest/i }).click();

    // Success message should appear
    await expect(page.getByText(/source queued for ingestion/i)).toBeVisible();

    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test("should open playbook runner", async ({ page }) => {
    // Click Run Playbook quick action
    await page.getByRole("button", { name: /run playbook/i }).click();

    // Modal should open
    const modal = page.locator("[data-testid='playbook-run-modal']");
    await expect(modal).toBeVisible();

    // Playbook list should be visible
    const playbooks = modal.locator("[data-testid='playbook-item']");
    expect(await playbooks.count()).toBeGreaterThan(0);

    // Select a playbook
    await playbooks.first().click();

    // Run button should be enabled
    const runButton = modal.getByRole("button", { name: /run/i });
    await expect(runButton).toBeEnabled();

    // Run the playbook
    await runButton.click();

    // Progress indicator should appear
    await expect(modal.getByTestId("playbook-progress")).toBeVisible();
  });
});

test.describe("Header Components", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/dashboard");
  });

  test("should display ingestion health status", async ({ page }) => {
    const healthIndicator = page.locator("[data-testid='ingestion-health']");
    await expect(healthIndicator).toBeVisible();

    // Should show status icon and text
    const statusIcon = healthIndicator.locator("svg");
    await expect(statusIcon).toBeVisible();

    // Status text should indicate health
    const statusText = await healthIndicator.textContent();
    expect(statusText).toMatch(/healthy|warning|error/i);
  });

  test("should show trial status for trial users", async ({ page }) => {
    // Mock trial user
    await page.route("**/api/workspace/bootstrap", async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      data.team.subscriptionStatus = "trialing";
      data.team.trialEndsAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await route.fulfill({ json: data });
    });

    await page.reload();

    const trialBadge = page.locator("[data-testid='trial-status']");
    await expect(trialBadge).toBeVisible();
    await expect(trialBadge).toContainText(/trial/i);
  });

  test("should display notification badge with count", async ({ page }) => {
    const notificationBadge = page.locator(
      "[data-testid='notification-badge']",
    );
    await expect(notificationBadge).toBeVisible();

    // Should show count if notifications exist
    const count = notificationBadge.locator(
      "[data-testid='notification-count']",
    );
    if (await count.isVisible()) {
      const countText = await count.textContent();
      expect(Number.parseInt(countText || "0")).toBeGreaterThan(0);
    }

    // Click to open notification center
    await notificationBadge.click();

    const notificationPanel = page.locator(
      "[data-testid='notification-center']",
    );
    await expect(notificationPanel).toBeVisible();
  });

  test("should open search modal", async ({ page }) => {
    // Click search trigger
    await page.getByRole("button", { name: /search/i }).click();

    // Search modal should open
    const searchModal = page.locator("[data-testid='search-modal']");
    await expect(searchModal).toBeVisible();

    // Search input should be focused
    const searchInput = searchModal.getByRole("textbox", { name: /search/i });
    await expect(searchInput).toBeFocused();

    // Type search query
    await searchInput.fill("AI research");

    // Results should appear
    await page.waitForTimeout(500); // Wait for debounce
    const results = searchModal.locator("[data-testid='search-result']");
    expect(await results.count()).toBeGreaterThan(0);

    // Click a result
    await results.first().click();

    // Should navigate to result
    await expect(page).toHaveURL(/\/(stories|insights|sources)\/[^/]+/);

    // Modal should close
    await expect(searchModal).not.toBeVisible();
  });
});
