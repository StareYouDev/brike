import { expect, test, type Page } from "@playwright/test";

// Seeded dev defaults (matches e2e/admin.spec.ts).
const ADMIN_EMAIL = "admin@brike.co.uk";
const ADMIN_PASSWORD = "brike-admin";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("checkout: empty basket shows the empty state", async ({ page }) => {
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { level: 1, name: "Checkout" }),
  ).toBeVisible();
  // zustand rehydrates client-side — the empty state appears after mount.
  await expect(page.getByText("Your basket is empty")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Place order/ }),
  ).toHaveCount(0);
});

test("checkout: COD order round-trips to the admin dashboard", async ({
  page,
}) => {
  const stamp = Date.now().toString(36);
  const email = `e2e-checkout-${stamp}@example.test`;

  // Build a basket: £85 celestial set → over the £60 threshold → free delivery.
  await page.goto("/products/celestial-harlequin-pyjama-set");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: /Add to basket/ }).click();

  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: /^Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", { name: "Your basket" }),
  ).toBeVisible();

  // Deterministic #co-* ids: the footer newsletter carries a *identical*
  // sr-only label "Email address" on every storefront page, so getByLabel
  // (even exact) resolves to two elements.
  await page.locator("#co-email").fill(email);
  await page.locator("#co-name").fill("E2E Customer");
  await page.locator("#co-phone").fill("07700 900123");
  await page.locator("#co-address1").fill("1 Test Street");
  await page.locator("#co-city").fill("London");
  await page.locator("#co-postcode").fill("SW1A 1AA");

  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/success\/BRK-[A-Z0-9]{6}$/);

  const code = page.url().match(/BRK-[A-Z0-9]{6}/)?.[0];
  expect(code).toBeTruthy();
  await expect(page.getByTestId("order-code")).toHaveText(code!);

  // The basket was emptied on the confirmation page.
  await expect(
    page.getByRole("button", { name: "Basket, 0 items" }),
  ).toBeVisible();

  // The order shows up in the admin dashboard as pending, total = subtotal
  // (delivery waived above £60, recomputed server-side from the DB).
  await login(page);
  await page.goto("/admin/orders");
  const row = page.locator("tbody tr").filter({ hasText: code! });
  await expect(row).toContainText("Pending");
  await expect(row).toContainText("£85.00");
});
