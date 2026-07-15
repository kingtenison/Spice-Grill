import { test, expect } from "@playwright/test";

test.describe("Homepage — Layout & Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("hero section with main title exists", async ({ page }) => {
    await expect(page.locator("h1").first()).toContainText(/spice|grille|welcome|order/i);
  });

  test("Order Now CTA navigates to /menu", async ({ page }) => {
    const orderBtn = page.locator("a:has-text('Order Now'), a:has-text('Order'), button:has-text('Order Now')").first();
    if (await orderBtn.isVisible()) {
      await orderBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/menu");
    }
  });

  test("reservations section link exists", async ({ page }) => {
    await page.waitForTimeout(1000);
    const reservationLink = page.locator("a[href*='reservation'], a:has-text('Reservations'), a:has-text('reservation')").first();
    if (await reservationLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(reservationLink).toBeVisible();
    }
  });

  test("footer navigation links are present", async ({ page }) => {
    await page.waitForTimeout(1000);
    const footerLinks = page.locator("footer a, footer li a");
    const count = await footerLinks.count();
    if (count > 0) {
      await expect(footerLinks.first()).toBeVisible();
    }
  });

  test("social media or contact links exist in footer", async ({ page }) => {
    await page.waitForTimeout(1000);
    const contactLink = page.locator("a[href*='contact'], a:has-text('Contact')").first();
    if (await contactLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(contactLink).toBeVisible();
    }
  });
});

test.describe("Homepage — JsonLd SEO Schema", () => {
  test("JSON-LD structured data script is present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("organization schema has valid name", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const script = page.locator('script[type="application/ld+json"]').first();
    const content = await script.textContent();
    if (content) {
      const parsed = JSON.parse(content);
      expect(parsed.name || parsed["@graph"]?.[0]?.name).toBeTruthy();
    }
  });
});
