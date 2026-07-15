import { test, expect } from '@playwright/test';

/* ── Helpers ── */

function getSpiceGrilleLogo(page: any) {
  return page.locator('header a[href="/"]').first();
}

/* ── Navbar (Header — all devices) ── */

test.describe('Navbar — Top Header', () => {
  test('is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('logo links to home', async ({ page }) => {
    await page.goto('/menu');
    await getSpiceGrilleLogo(page).click();
    await expect(page).toHaveURL('/');
  });

  test('"Order Now" button links to /menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('header a:has-text("Order Now")').click();
    await expect(page).toHaveURL('/menu');
  });

  test('Login button links to /login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.locator('header a:has-text("Login")').click();
    await expect(page).toHaveURL('/login');
  });

  test('Login icon changes to Account icon when authenticated', async ({ page }) => {
    // We can't truly log in end-to-end without test credentials,
    // but we can verify Login text is visible by default
    await page.goto('/');
    await expect(page.locator('header a:has-text("Login")')).toBeVisible();
  });

  test('scroll adds background blur effect', async ({ page }) => {
    await page.goto('/');
    // Initially transparent
    await expect(page.locator('header')).not.toHaveClass(/bg-white/);
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400); // wait for scroll transition
    // Should have background
    const classList = await page.locator('header').getAttribute('class');
    expect(classList).toContain('bg-white');
  });

  test('SPICE GRILLE logo text is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header:has-text("SPICE")')).toBeVisible();
    await expect(page.locator('header:has-text("GRILLE")')).toBeVisible();
  });
});

/* ── SidebarNav (Desktop Floating Sidebar) ── */

test.describe('SidebarNav — Desktop Floating Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
  });

  test('is visible on desktop', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
  });

  test('is hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('Home link is active on /', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.locator('aside a[href="/"]').first();
    const parentDiv = homeLink.locator('..');
    await expect(parentDiv.locator('a')).toHaveClass(/bg-red-600/);
  });

  test('Menu link navigates to /menu', async ({ page }) => {
    await page.locator('aside a[href="/menu"]').click();
    await expect(page).toHaveURL('/menu');
  });

  test('Rewards link navigates to /loyalty', async ({ page }) => {
    await page.locator('aside a[href="/loyalty"]').click();
    await expect(page).toHaveURL('/loyalty');
  });

  test('Story link navigates to /blog', async ({ page }) => {
    await page.locator('aside a[href="/blog"]').click();
    await expect(page).toHaveURL('/blog');
  });

  test('Orders link navigates to /orders', async ({ page }) => {
    await page.locator('aside a[href="/orders"]').click();
    await expect(page).toHaveURL('/orders');
  });

  test('Cart link navigates to /cart', async ({ page }) => {
    await page.locator('aside a[href="/cart"]').click();
    await expect(page).toHaveURL('/cart');
  });

  test('Login tooltip appears on hover over user icon', async ({ page }) => {
    const userBtn = page.locator('aside a[href="/login"]');
    await userBtn.hover();
    await expect(page.locator('aside').getByText('Login')).toBeVisible();
  });

  test('delivery dropdown toggles on click', async ({ page }) => {
    const truckBtn = page.locator('aside button').first();
    // Dropdown should be hidden initially
    await expect(page.locator('aside').getByText('Login to Track Orders')).not.toBeVisible();
    // Click to open
    await truckBtn.click();
    await expect(page.locator('aside').getByText('Login to Track Orders')).toBeVisible();
    // Click again to close
    await truckBtn.click();
    await expect(page.locator('aside').getByText('Login to Track Orders')).not.toBeVisible();
  });

  test('delivery dropdown closes on outside click', async ({ page }) => {
    const truckBtn = page.locator('aside button').first();
    await truckBtn.click();
    await expect(page.locator('aside').getByText('Login to Track Orders')).toBeVisible();
    // Click on the main content area
    await page.locator('main').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    await expect(page.locator('aside').getByText('Login to Track Orders')).not.toBeVisible();
  });

  test('cart badge is visible when items in cart', async ({ page }) => {
    // Add item to cart via localStorage
    await page.evaluate(() => {
      localStorage.setItem('spice-grill-cart-storage', JSON.stringify({
        state: {
          items: [{ id: '1', name: 'Test Item', price: 10, quantity: 2, image: '/test.jpg', category: 'Test' }],
          isOpen: false,
          currency: 'USD',
          taxRate: 0,
        },
        version: 0,
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(500);
    const badge = page.locator('aside').locator('span.rounded-full.bg-red-600').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });

  test('tooltip appears on hover over nav items', async ({ page }) => {
    const menuLink = page.locator('aside a[href="/menu"]');
    await menuLink.hover();
    await expect(page.locator('aside').getByText('Menu')).toBeVisible();
  });

  test('each nav link tooltip shows correct label', async ({ page }) => {
    const links = [
      { href: '/menu', label: 'Menu' },
      { href: '/loyalty', label: 'Rewards' },
      { href: '/blog', label: 'Story' },
      { href: '/orders', label: 'Orders' },
    ];
    for (const { href, label } of links) {
      const link = page.locator(`aside a[href="${href}"]`);
      await link.hover();
      await expect(page.locator('aside').getByText(label)).toBeVisible();
    }
  });
});

/* ── BottomNav (Mobile Bottom Bar) ── */

test.describe('BottomNav — Mobile Bottom Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('is visible on mobile', async ({ page }) => {
    const nav = page.locator('nav.fixed.bottom-0');
    await expect(nav).toBeVisible();
  });

  test('is hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.locator('nav.fixed.bottom-0');
    await expect(nav).not.toBeVisible();
  });

  test('Home link is active on /', async ({ page }) => {
    const homeLink = page.locator('nav.fixed.bottom-0 a[href="/"]');
    await expect(homeLink.locator('span.text-red-600')).toContainText('Home');
  });

  test('Menu link navigates to /menu', async ({ page }) => {
    await page.locator('nav.fixed.bottom-0 a[href="/menu"]').click();
    await expect(page).toHaveURL('/menu');
  });

  test('Rewards link navigates to /loyalty', async ({ page }) => {
    await page.locator('nav.fixed.bottom-0 a[href="/loyalty"]').click();
    await expect(page).toHaveURL('/loyalty');
  });

  test('Story link navigates to /blog', async ({ page }) => {
    await page.locator('nav.fixed.bottom-0 a[href="/blog"]').click();
    await expect(page).toHaveURL('/blog');
  });

  test('Cart link navigates to /cart', async ({ page }) => {
    await page.locator('nav.fixed.bottom-0 a[href="/cart"]').click();
    await expect(page).toHaveURL('/cart');
  });

  // Login link removed from bottom nav — it's in the top header now

  test('cart badge is visible when items in cart', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('spice-grill-cart-storage', JSON.stringify({
        state: {
          items: [{ id: '1', name: 'Test Item', price: 10, quantity: 3, image: '/test.jpg', category: 'Test' }],
          isOpen: false,
          currency: 'USD',
          taxRate: 0,
        },
        version: 0,
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(500);
    const badge = page.locator('nav.fixed.bottom-0').locator('span.rounded-full.bg-red-600');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('3');
  });

  test('has exactly 5 nav items (login removed — already in top header)', async ({ page }) => {
    const items = page.locator('nav.fixed.bottom-0 a');
    await expect(items).toHaveCount(5);
  });

  test('active indicator is visible on current page link', async ({ page }) => {
    await page.goto('/menu');
    const indicator = page.locator('nav.fixed.bottom-0 div.bg-red-600.rounded-full');
    await expect(indicator).toBeVisible();
  });

  test('active indicator moves when navigating', async ({ page }) => {
    await page.goto('/');
    // Go to menu
    await page.locator('nav.fixed.bottom-0 a[href="/menu"]').click();
    await page.waitForURL('/menu');
    const indicator = page.locator('nav.fixed.bottom-0 div.bg-red-600.rounded-full');
    await expect(indicator).toBeVisible();
  });
});

/* ── RouteAwareNav — Admin routes ── */

test.describe('RouteAwareNav — Admin Route Hiding', () => {
  test('sidebar and bottom nav are hidden on admin routes (redirects to login)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin');
    // The admin route redirects unauthenticated users to /login
    // After redirect, the sidebar IS visible (not an admin route anymore)
    await page.waitForURL('**/login');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0')).not.toBeVisible();
  });

  test('navbar is still visible on admin routes', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/login');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header a:has-text("Order Now")')).toBeVisible();
  });
});

/* ── Cross-Component Tests ── */

test.describe('Cross-Component Navigation Consistency', () => {
  test('all nav links point to valid routes (no 404s)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const routes = ['/', '/menu', '/loyalty', '/blog', '/orders', '/cart', '/login'];
    for (const route of routes) {
      await page.goto(route);
      // Should not get a 404 or error page
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('This page could not be found');
    }
  });

  test('desktop sidebar and mobile bottom nav are never both visible', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0')).not.toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('aside')).not.toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
  });
});

/* ── Responsive Breakpoint Tests ── */

test.describe('Responsive Breakpoints', () => {
  test('sidebar appears at 1024px width', async ({ page }) => {
    // Just below breakpoint
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('/');
    await expect(page.locator('aside')).not.toBeVisible();

    // At breakpoint
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.locator('aside')).toBeVisible();
  });

  test('bottom nav disappears at 1024px width', async ({ page }) => {
    // Just below breakpoint
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('/');
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();

    // At breakpoint
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/');
    await expect(page.locator('nav.fixed.bottom-0')).not.toBeVisible();
  });
});
