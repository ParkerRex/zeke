import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto("/");
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Attempt to access protected route
    await page.goto("/dashboard");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Login page elements should be visible
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should allow users to sign in", async ({ page }) => {
    await page.goto("/login");

    // Fill in credentials
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard after successful login
    await page.waitForURL("/dashboard");

    // Dashboard should be visible
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByText(/overview/i)).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Error message should appear
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow users to sign out", async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: "session",
        value: "valid-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/dashboard");

    // Open user menu
    await page.getByRole("button", { name: /user menu/i }).click();

    // Click sign out
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Session should be cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "session");
    expect(sessionCookie).toBeUndefined();
  });

  test("should persist session across page reloads", async ({
    page,
    context,
  }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: "session",
        value: "valid-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/dashboard");

    // Dashboard should be accessible
    await expect(page.getByRole("navigation")).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});
