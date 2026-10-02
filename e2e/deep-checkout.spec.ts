import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const CART_KEY = "spice-grill-cart-storage";
const FARGO = { latitude: 46.8772, longitude: -96.7898 };
const ACCRA = { latitude: 5.6037, longitude: -0.187 };
const TAX_RATE = 0.08;
const round2 = (n: number) => Math.round(n * 100) / 100;

const createdOrderIds: string[] = [];

function serviceKey(): string {
  const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
  const m = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m);
  if (!m) throw new Error("SUPABASE_SERVICE_ROLE_KEY not in .env.local");
  return m[1].trim();
}

async function db(pathAndQuery: string, init?: RequestInit) {
  const key = serviceKey();
  return fetch(`https://frcqhcihylyogmnbqmon.supabase.co/rest/v1/${pathAndQuery}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...init,
  });
}

async function getMenuItems(): Promise<{ id: string; name: string; price: number }[]> {
  const res = await fetch(`${BASE}/api/menu`);
  expect(res.status).toBe(200);
  const payload = await res.json();
  const items = Array.isArray(payload) ? payload : payload.items || payload.data || [];
  expect(items.length).toBeGreaterThan(0);
  return items.map((i: any) => ({ id: i.id, name: i.name, price: Number(i.price) }));
}

function cartState(items: any[]) {
  return {
    state: { items, currency: "USD", taxRate: TAX_RATE, deliveryMethod: null, coupon: null },
    version: 0,
  };
}

async function seedCart(page: import("@playwright/test").Page, items: any[]) {
  await page.addInitScript(
    ([k, v]) => localStorage.setItem(k, JSON.stringify(v)),
    [CART_KEY, cartState(items)] as [string, unknown]
  );
}

async function fillDeliveryForm(page: import("@playwright/test").Page) {
  await page.getByPlaceholder("John Doe").fill("Deep Test");
  await page.getByPlaceholder("john@example.com").fill("deep@test.com");
  await page.getByPlaceholder("(555) 123-4567").fill("5551234567");
  await page.getByPlaceholder("123 Main Street").fill("456 Test Ave");
  await page.getByPlaceholder("New York").fill("Fargo");
  await page.getByPlaceholder("NY").fill("ND");
  await page.getByPlaceholder("10001").fill("58102");
}

async function gotoReview(
  page: import("@playwright/test").Page,
  opts: { method: "pickup" | "standard"; payment: "cash" | "card"; useLocation?: boolean; expectDisabledDelivery?: boolean }
) {
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Delivery Method").waitFor({ timeout: 30000 });
  if (opts.expectDisabledDelivery) {
    const deliv = page.locator("button", { hasText: "Standard Delivery" }).first();
    await expect(deliv).toBeDisabled();
    const pickup = page.locator("button", { hasText: "Pickup" }).first();
    await expect(pickup).toBeEnabled();
  }
  if (opts.method !== "pickup") {
    await page.locator("button", { hasText: "Standard Delivery" }).first().click();
  }
  const pay = opts.payment === "cash" ? "Cash on Delivery" : "Credit/Debit Card";
  await page.getByText(pay).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Review Your Order").waitFor({ timeout: 45000 });
}

async function placeAndCaptureOrder(page: import("@playwright/test").Page, expectedTotal: number) {
  const placeBtn = page.locator("button", { hasText: "Place Order" }).first();
  const label = (await placeBtn.textContent()) || "";
  if (!label.includes(`$${expectedTotal.toFixed(2)}`)) {
    const review = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(-1200);
    console.log("REVIEW DUMP:", review);
    console.log("EXPECTED:", expectedTotal.toFixed(2), "LABEL:", label);
  }
  expect(label).toContain(`$${expectedTotal.toFixed(2)}`);
  await placeBtn.click();
  await page.getByText("Order Confirmed!").waitFor({ timeout: 60000 });
  const orderText = (await page.getByText(/Order #/).textContent())?.trim() || "";
  console.log("ORDER:", orderText, "| expected total:", expectedTotal.toFixed(2));

  const after = await db("orders?select=id,total_amount,payment_status,payment_method&order=created_at.desc&limit=5");
  const rows = await after.json();
  const mine = rows.find((r: any) => !createdOrderIds.includes(r.id) && r.total_amount === expectedTotal);
  expect(mine).toBeTruthy();
  createdOrderIds.push(mine.id);
  return mine.id;
}

async function pickItemsForTarget(items: { id: string; name: string; price: number }[], minSubtotal: number) {
  const sorted = [...items].sort((a, b) => b.price - a.price);
  const chosen = [];
  let sub = 0;
  for (const i of sorted) {
    chosen.push({ id: i.id, name: i.name, price: i.price, quantity: 1 });
    sub += i.price;
    if (sub >= minSubtotal) break;
  }
  return { chosen, subtotal: sub };
}

// ---------------------------------------------------------------------------
test.describe("API sanity", () => {
  test("distance endpoint: near < 20mi, Ghana > 6000mi, missing params -> 400", async ({ request }) => {
    const near = await request.get(`${BASE}/api/distance?lat=46.8772&lng=-96.7898`);
    expect(near.status()).toBe(200);
    const nearBody = await near.json();
    expect(nearBody.distance_miles).toBeLessThan(20);
    expect(nearBody.restaurant_lat).toBeCloseTo(46.8784, 2);

    const far = await request.get(`${BASE}/api/distance?lat=5.6037&lng=-0.187`);
    const farBody = await far.json();
    expect(farBody.distance_miles).toBeGreaterThan(6000);

    const bad = await request.get(`${BASE}/api/distance?lat=0&lng=0`);
    expect(bad.status()).toBe(400);
  });

  test("menu API returns priced items", async ({ request }) => {
    const res = await request.get(`${BASE}/api/menu`);
    expect(res.status()).toBe(200);
    const items = await getMenuItems();
    expect(items.length).toBeGreaterThan(0);
    for (const i of items.slice(0, 5)) {
      expect(i.id).toBeTruthy();
      expect(i.price).toBeGreaterThan(0);
    }
  });

  test("track API: unknown order -> 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/track?order_id=00000000-0000-0000-0000-000000000000`);
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
test.describe("Cart", () => {
  test("guest cart page shows login prompt; Continue as Guest -> checkout", async ({ page }) => {
    const items = await getMenuItems();
    const { chosen } = await pickItemsForTarget(items, 10);
    await seedCart(page, chosen);
    await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
    await page.getByText("Sign in to unlock benefits").waitFor({ timeout: 30000 });
    await expect(page.getByText("Continue as Guest")).toBeVisible();
    await page.getByText("Continue as Guest").click();
    await page.getByText("Checkout as Guest").waitFor({ timeout: 30000 });
    expect(page.url()).toContain("/checkout");
    const body = await page.locator("body").innerText();
    for (const c of chosen) expect(body).toContain(c.name);
  });
});

// ---------------------------------------------------------------------------
test.describe("Checkout — Pickup + Cash (full flow)", () => {
  test("place pickup cash order, verify review total, DB row, track API and track page", async ({ page }) => {
    const items = await getMenuItems();
    const { chosen, subtotal } = await pickItemsForTarget(items, 12);
    await seedCart(page, chosen);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillDeliveryForm(page);
    await gotoReview(page, { method: "pickup", payment: "cash" });
    const total = round2(subtotal * (1 + TAX_RATE));
    const orderId = await placeAndCaptureOrder(page, total);

    const track = await requestTrack(orderId);
    expect(track.order.payment_status).toBe("paid"); // cash defaults paid server-side
    expect(track.order.payment_method).toBe("cash");
    expect(track.order.total_amount).toBe(total);
    expect(track.order.subtotal).toBe(subtotal);
    expect(track.order.tax_amount).toBe(round2(subtotal * TAX_RATE));
    expect(track.order.discount_amount).toBe(0);
    expect(track.order.shipping_method ?? "").toMatch(/pickup/i);
    expect(track.order.order_items.length).toBe(chosen.length);

    const page2 = await page.context().newPage();
    await page2.goto(`${BASE}/track/${orderId}`, { waitUntil: "networkidle" });
    await page2.waitForTimeout(1000);
    expect((await page2.locator("body").innerText()).toLowerCase()).toContain(orderId.slice(0, 8).toLowerCase());
  });
});

async function requestTrack(orderId: string) {
  const res = await fetch(`${BASE}/api/track?order_id=${orderId}`);
  expect(res.status).toBe(200);
  return res.json();
}

// ---------------------------------------------------------------------------
test.describe("Checkout — Delivery + Cash (fee math)", () => {
  test("Fargo delivery: free <=5mi, $4 service fee, totals match server", async ({ page, context }) => {
    const items = await getMenuItems();
    const { chosen, subtotal } = await pickItemsForTarget(items, 16);
    await context.grantPermissions(["geolocation"], { origin: BASE });
    await context.setGeolocation(FARGO);
    await seedCart(page, chosen);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillDeliveryForm(page);
    await page.getByRole("button", { name: "Use Current Location" }).click();
    await page.getByText("Location captured").waitFor({ timeout: 30000 });
    await gotoReview(page, { method: "standard", payment: "cash", useLocation: true });
    const total = round2(subtotal + 4 + subtotal * TAX_RATE);
    const orderId = await placeAndCaptureOrder(page, total);

    const track = await requestTrack(orderId);
    expect(track.order.payment_status).toBe("paid");
    expect(track.order.total_amount).toBe(total);
    expect(track.order.shipping_cost).toBe(0); // free delivery <= 5mi
  });
});

// ---------------------------------------------------------------------------
test.describe("Checkout — Radius guard (Ghana GPS)", () => {
  test("delivery blocked UI: warning, disabled delivery cards, pickup works", async ({ page, context }) => {
    const items = await getMenuItems();
    const { chosen } = await pickItemsForTarget(items, 10);
    await context.grantPermissions(["geolocation"], { origin: BASE });
    await context.setGeolocation(ACCRA);
    await seedCart(page, chosen);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillDeliveryForm(page);
    await page.getByRole("button", { name: "Use Current Location" }).click();
    await page.getByText("Delivery not available at this distance").waitFor({ timeout: 30000 });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Delivery Method").waitFor({ timeout: 30000 });
    await expect(page.locator("button", { hasText: "Standard Delivery" }).first()).toBeDisabled();
    await expect(page.locator("button", { hasText: "Pickup" }).first()).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
test.describe("Checkout — Coupon (WELCOME10)", () => {
  test("applies 10% off >=$25, discount flows to DB", async ({ page }) => {
    const items = await getMenuItems();
    const { chosen, subtotal } = await pickItemsForTarget(items, 28);
    await seedCart(page, chosen);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await fillDeliveryForm(page);
    await page.getByPlaceholder("Enter code").fill("WELCOME10");
    await page.locator("button", { hasText: "Apply" }).first().click();
    await page.getByText("WELCOME10").waitFor({ timeout: 15000 });
    await gotoReview(page, { method: "pickup", payment: "cash" });
    const discount = round2(subtotal * 0.1);
    const total = round2(subtotal - discount + subtotal * TAX_RATE);
    const orderId = await placeAndCaptureOrder(page, total);

    const track = await requestTrack(orderId);
    expect(track.order.discount_amount).toBe(discount);
    expect(track.order.total_amount).toBe(total);
    expect(track.order.coupon_code).toBe("WELCOME10");
  });
});

// ---------------------------------------------------------------------------
test.afterAll(async () => {
  if (!createdOrderIds.length) return;
  const idList = `(${createdOrderIds.join(",")})`;
  console.log("Cleaning up test orders:", createdOrderIds.length);
  for (const t of ["order_items", "delivery_assignments", "platform_fees"]) {
    await db(`${t}?order_id=in.${idList}`, { method: "DELETE" });
  }
  await db(`orders?id=in.${idList}`, { method: "DELETE" });
});
