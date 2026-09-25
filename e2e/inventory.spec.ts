import { expect, test, type Page } from "@playwright/test";

// Seeded dev defaults (matches e2e/admin-crud.spec.ts).
const ADMIN_EMAIL = "admin@brike.co.uk";
const ADMIN_PASSWORD = "brike-admin";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Minimal valid product (mirrors e2e/admin-crud.spec.ts fillProductBasics). */
async function fillProductBasics(page: Page, name: string, slug: string) {
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Slug (URL)").fill(slug);
  await page.getByLabel("Price (£)").fill("12.50");
  await page
    .getByLabel("Description")
    .fill("A throwaway product created by the automated tests only.");
  await page.getByLabel("Style").fill("Relaxed fit");
  await page.getByLabel("Fabric").fill("100% cotton");
  await page
    .getByLabel("Details (one per line)")
    .fill("Automated test detail line\nSecond detail line");
  await page.getByLabel("Colour 1 name").fill("Ink multi");
  await page.getByLabel("M", { exact: true }).check();
  // Existing static art — a fresh slug's generated /prints/<slug>-a.svg
  // doesn't exist, and a broken image trips the homepage console-error test
  // when this product renders there in parallel. (Uploads override this.)
  await page
    .getByLabel("Image A (main)", { exact: true })
    .fill("/prints/hero.svg");
  // STABLE collection name — never .first() (parallel tests can delete a
  // temporary collection before this form submits → FK violation).
  const collectionsSection = page
    .locator("section")
    .filter({ has: page.getByText("Collections & meta") });
  await collectionsSection
    .getByRole("checkbox", { name: "New In" })
    .check();
}

/**
 * Phase 1 inventory gate: per-size stock set in the admin form flows to the
 * PDP (sold-out sizes disabled, low-stock note), checkout takes the last
 * unit atomically, and cancelling the order restocks it. Untracked sizes
 * never block — covered implicitly by e2e/checkout.spec.ts against the
 * seeded (stockless) catalog.
 */
test("inventory: sold-out blocks the PDP, checkout decrements, cancel restocks", async ({
  page,
}) => {
  // Full round trip: create → PDP → buy → admin → cancel → PDP.
  test.setTimeout(120_000);
  await login(page);

  const stamp = Date.now().toString(36);
  const slug = `e2e-stock-${stamp}`;
  const name = `E2E Stock ${stamp}`;

  // ---- create: M = 0 (sold out), L = 1 (last one) ----
  await page.goto("/admin/products/new");
  await fillProductBasics(page, name, slug);
  await page.getByLabel("M stock", { exact: true }).fill("0");
  await page.getByLabel("L", { exact: true }).check();
  await page.getByLabel("L stock", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  // Admin table summarises the tracked sizes: total 1, at least one size ≤ 5.
  await page.getByLabel("Search products").fill(slug);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(
    page.locator("tbody tr").filter({ hasText: slug }),
  ).toContainText("1 (low)");

  // ---- PDP: sold-out size disabled, low-stock note on the last one ----
  await page.goto(`/products/${slug}`);
  await expect(
    page.getByRole("button", { name: "M", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "L", exact: true }).click();
  await expect(page.getByText("Only 1 left in L")).toBeVisible();

  // ---- buy the last L ----
  await page.getByRole("button", { name: /Add to basket/ }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: /^Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.locator("#co-email").fill(`e2e-stock-${stamp}@example.test`);
  await page.locator("#co-name").fill("E2E Stock Customer");
  await page.locator("#co-phone").fill("07700 900456");
  await page.locator("#co-address1").fill("1 Test Street");
  await page.locator("#co-city").fill("London");
  await page.locator("#co-postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/success\/BRK-[A-Z0-9]{6}$/);
  const code = page.url().match(/BRK-[A-Z0-9]{6}/)?.[0];
  expect(code).toBeTruthy();

  // ---- stock was decremented: L is now sold out too ----
  await page.goto(`/products/${slug}`);
  await expect(
    page.getByRole("button", { name: "L", exact: true }),
  ).toBeDisabled();
  await page.goto("/admin/products");
  await page.getByLabel("Search products").fill(slug);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(
    page.locator("tbody tr").filter({ hasText: slug }),
  ).toContainText("Sold out");

  // ---- cancel the order in admin → the unit goes back ----
  await page.goto("/admin/orders");
  const orderRow = page
    .locator("tbody tr")
    .filter({ hasText: code! });
  await orderRow.getByRole("link", { name: "Open" }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Cancel order" }).click();
  // Server-confirmed transition (a stale/forged transition would show an
  // alert instead).
  await expect(
    page.getByText("This order was cancelled"),
  ).toBeVisible();

  await page.goto(`/products/${slug}`);
  const sizeL = page.getByRole("button", { name: "L", exact: true });
  await expect(sizeL).toBeEnabled();
  await sizeL.click();
  await expect(page.getByText("Only 1 left in L")).toBeVisible();

  // ---- clean up: delete the throwaway product ----
  await page.goto("/admin/products");
  await page.getByLabel("Search products").fill(slug);
  await page.getByRole("button", { name: "Search" }).click();
  const saved = page.locator("tbody tr").filter({ hasText: slug });
  await saved.getByRole("button", { name: "Delete" }).click();
  await saved.getByRole("button", { name: "Yes, delete" }).click();
  await expect(saved).toHaveCount(0, { timeout: 15_000 });
});
