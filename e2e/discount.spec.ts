import { expect, test, type Page } from "@playwright/test";

// Seeded dev defaults (matches e2e/checkout.spec.ts).
const ADMIN_EMAIL = "admin@brike.co.uk";
const ADMIN_PASSWORD = "brike-admin";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/**
 * Phase 3 gate: the footer newsletter is a real server action that shows
 * the WELCOME10 code on-screen (fixed email — the unique constraint makes
 * re-runs idempotent, so the shared DB never piles up subscribers).
 */
test("newsletter: sign-up stores the email and shows the WELCOME10 code", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#newsletter-email").fill("e2e-newsletter@example.test");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText(/10% off your first order/)).toBeVisible();
  await expect(page.getByText("WELCOME10")).toBeVisible();
});

/**
 * Phase 3 gate: WELCOME10 previews live in the sidebar (email typed first),
 * the placed order carries the discount through success + admin, and the
 * shared database is left clean (order cancelled at the end).
 *
 * Math: £85 − 10% = £8.50 off → £76.50 to pay; still over the £60
 * free-delivery threshold, so delivery stays free.
 */
test("discount: WELCOME10 previews, applies to the order, shows in success + admin", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const email = `e2e-discount-${stamp}@example.test`;

  // Basket: £85 celestial set.
  await page.goto("/products/celestial-harlequin-pyjama-set");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: /Add to basket/ }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: /^Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.locator("#co-email").fill(email);
  await page.locator("#co-name").fill("E2E Discount Customer");
  await page.locator("#co-phone").fill("07700 900789");
  await page.locator("#co-address1").fill("1 Test Street");
  await page.locator("#co-city").fill("London");
  await page.locator("#co-postcode").fill("SW1A 1AA");

  // Preview the code (lower-case input must normalise) — email is typed.
  await page.locator("#co-discount").fill("welcome10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("WELCOME10 applied")).toBeVisible();
  await expect(page.getByText("Discount · WELCOME10")).toBeVisible();
  await expect(page.getByText("£8.50")).toBeVisible();

  // Place it — the server re-validates and claims the redemption.
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/success\/BRK-[A-Z0-9]{6}$/);
  const code = page.url().match(/BRK-[A-Z0-9]{6}/)?.[0];
  expect(code).toBeTruthy();

  // Success page: discount row + the discounted total (the total also
  // appears in the hero, so scope to the totals list).
  await expect(page.getByText("Discount · WELCOME10")).toBeVisible();
  await expect(page.locator("dl").getByText("£76.50")).toBeVisible();

  // Admin: the list row totals the discounted amount; the detail shows why.
  await login(page);
  await page.goto("/admin/orders");
  const row = page.locator("tbody tr").filter({ hasText: code! });
  await expect(row).toContainText("£76.50");
  await row.getByRole("link", { name: "Open" }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Discount · WELCOME10")).toBeVisible();
  await expect(page.getByText("£8.50")).toBeVisible();

  // Hygiene: cancel so the shared DB isn't left with another pending order.
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("This order was cancelled")).toBeVisible();
});
