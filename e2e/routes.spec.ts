import { test, expect } from "@playwright/test";

test.describe("Route Health — All Public Pages", () => {
  const publicRoutes = [
    { path: "/", expected: 200 },
    { path: "/menu", expected: 200 },
    { path: "/login", expected: 200 },
    { path: "/register", expected: 200 },
    { path: "/loyalty", expected: 200 },
    { path: "/blog", expected: 200 },
    { path: "/cart", expected: 200 },
    { path: "/orders", expected: 200 },
    { path: "/contact", expected: 200 },
    { path: "/reservations", expected: 200 },
    { path: "/dispatcher/register", expected: 200 },
  ];

  for (const route of publicRoutes) {
    test(`${route.path} returns ${route.expected} and renders content`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(route.expected);
      await page.waitForTimeout(500);
      // Page should have some visible content (not blank/error)
      const bodyText = page.locator("body");
      await expect(bodyText).not.toBeEmpty();
    });
  }
});

test.describe("Route Health — Protected Pages (redirect to login)", () => {
  const protectedRoutes = [
    { path: "/account", redirectContains: "login" },
    { path: "/dispatcher", redirectContains: "login" },
    { path: "/admin", redirectContains: "login" },
    { path: "/admin/menu", redirectContains: "login" },
    { path: "/admin/orders", redirectContains: "login" },
    { path: "/employee", redirectContains: "login" },
  ];

  for (const route of protectedRoutes) {
    test(`${route.path} redirects to login when unauthenticated`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      expect(page.url()).toContain(route.redirectContains);
    });
  }
});
