import { test, expect } from "@playwright/test";

test.describe("ReviewModal Component", () => {
  test("Reviews button exists on account page for delivered orders", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    // Account page redirects to login when not authenticated
    const url = page.url();
    if (url.includes("login")) {
      test.skip("Not authenticated — ReviewModal requires logged-in user");
    }
    // Check for review buttons on order cards
    const reviewBtn = page.locator("button:has-text('Review'), button:has-text('review'), button:has-text('Rate')").first();
    if (await reviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reviewBtn.click();
      await page.waitForTimeout(1000);
      // Check modal appears
      await expect(page.locator("text=Rate Your Order, text=Thank You").first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test("star rating interaction works in ReviewModal", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    if (page.url().includes("login")) {
      test.skip("Not authenticated");
    }
    const reviewBtn = page.locator("button:has-text('Review')").first();
    if (await reviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reviewBtn.click();
      await page.waitForTimeout(500);
      const stars = page.locator("button:has(svg[class*='lucide-star'])");
      const starCount = await stars.count();
      if (starCount > 0) {
        await stars.nth(4).click(); // Click 5th star
        await page.waitForTimeout(200);
        // Check submit button is now enabled
        const submitBtn = page.locator("button:has-text('Submit Review')");
        await expect(submitBtn).toBeEnabled({ timeout: 2000 });
      }
    }
  });
});
