import { test, expect } from "@playwright/test";

test.describe("Account Page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("login");
  });

  test("login page renders Google OAuth sign-in", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("a[href='/api/auth/google']")).toBeVisible();
    await expect(page.locator("button:has-text('Sign In'), a:has-text('Continue with Google')").first()).toBeVisible();
  });

  test("login page has no legacy email/password form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    expect(await page.locator('input[type="password"]').count()).toBe(0);
  });

  test("login page shows brand", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('Welcome Back')")).toBeVisible();
  });

  test("login page shows brand tagline", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("p:has-text('Afro-Caribbean Cuisine')")).toBeVisible();
  });
});

test.describe("Register Page", () => {
  test("register page is accessible from login", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const heading = page.locator("h1, h2, h3").first();
    await expect(heading).toBeVisible();
  });
});

test.describe("Dispatcher Portal Access", () => {
  test("dispatcher page redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dispatcher");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("login");
  });

  test("dispatcher register page is accessible", async ({ page }) => {
    await page.goto("/dispatcher/register");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });
});
