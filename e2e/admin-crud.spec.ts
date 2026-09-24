import { expect, test, type Page } from "@playwright/test";

// Seeded dev defaults (matches e2e/admin.spec.ts).
const ADMIN_EMAIL = "admin@brike.co.uk";
const ADMIN_PASSWORD = "brike-admin";

// 1×1 transparent PNG (base64) — exercises the server-side magic-byte sniff.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function fillProductBasics(page: Page, name: string, slug: string) {
  await page.getByLabel("Name").fill(name);
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
  await page.getByLabel("Colorways (one per line)").fill("Ink multi");
  await page.getByLabel("M", { exact: true }).check();
  // Tick the STABLE "New In" collection by name — never .first(): a parallel
  // test's temporary collection can sort first and then get deleted before
  // this form submits (FK violation).
  const collectionsSection = page
    .locator("section")
    .filter({ has: page.getByText("Collections & meta") });
  await collectionsSection
    .getByRole("checkbox", { name: "New In" })
    .check();
}

test("products: list, search empty state, create → edit → delete", async ({
  page,
}) => {
  await login(page);

  await page.goto("/admin/products");
  await expect(
    page.getByRole("heading", { level: 1, name: "Products" }),
  ).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeGreaterThanOrEqual(10);

  // Search with no matches → deterministic empty state.
  await page.getByLabel("Search products").fill("zzz-no-such-product-zzz");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("No matches")).toBeVisible();
  await page.goto("/admin/products");

  const stamp = Date.now().toString(36);
  const slug = `e2e-test-${stamp}`;

  // ---- create (no file) ----
  await page.goto("/admin/products/new");
  await fillProductBasics(page, "E2E Test Tee", slug);
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByRole("link", { name: "E2E Test Tee" })).toBeVisible();

  // Storefront PDP responds for the freshly created slug (on-demand render).
  const pdp = await page.request.get(`/products/${slug}`);
  expect(pdp.status()).toBe(200);

  // ---- edit: price change ----
  await page.getByRole("link", { name: "E2E Test Tee" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  await page.getByLabel("Price (£)").fill("15.00");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  const row = page.locator("tbody tr").filter({ hasText: slug });
  await expect(row).toContainText("£15.00");

  // ---- delete (two-step confirm) ----
  await row.getByRole("button", { name: "Delete" }).click();
  await row.getByRole("button", { name: "Yes, delete" }).click();
  // The action does DB delete + blob cleanup + layout revalidate — slow
  // under parallel Neon load, so allow well beyond the default 5s.
  await expect(row).toHaveCount(0, { timeout: 15_000 });

  // PDP is gone after the revalidation.
  const gone = await page.request.get(`/products/${slug}`);
  expect(gone.status()).toBe(404);
});

test("product image upload lands in Vercel Blob and renders", async ({
  page,
}) => {
  await login(page);

  const stamp = Date.now().toString(36);
  const slug = `e2e-img-${stamp}`;

  // Track blob responses so a CSP/optimizer misconfig can't pass silently.
  const blobStatuses: number[] = [];
  page.on("response", (res) => {
    if (res.url().includes("blob.vercel-storage.com")) {
      blobStatuses.push(res.status());
    }
  });

  await page.goto("/admin/products/new");
  await fillProductBasics(page, "E2E Blob Image Tee", slug);
  await page
    .getByLabel("Image A (main) — upload file")
    .setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  const row = page.locator("tbody tr").filter({ hasText: slug });
  await expect(
    row.locator('img[src*="blob.vercel-storage.com"]'),
  ).toHaveCount(1);

  // The browser actually fetched the blob (not blocked by CSP).
  await expect.poll(() => blobStatuses.length).toBeGreaterThan(0);
  expect(blobStatuses[0]).toBe(200);

  // ---- clean up ----
  await row.getByRole("button", { name: "Delete" }).click();
  await row.getByRole("button", { name: "Yes, delete" }).click();
  await expect(row).toHaveCount(0, { timeout: 15_000 });
});

test("collections: create and delete round-trip", async ({ page }) => {
  await login(page);

  const stamp = Date.now().toString(36);
  const slug = `e2e-col-${stamp}`;

  await page.goto("/admin/collections/new");
  await page.getByLabel("Title").fill("E2E Collection");
  await page.getByLabel("Slug (URL)").fill(slug);
  await page.getByLabel("Short label (nav)").fill("E2E");
  // Sort last so the temp row never jumps ahead of real collections anywhere.
  await page.getByLabel("Sort order").fill("9999");
  await page
    .getByLabel("Description")
    .fill("A throwaway collection used only by the automated tests.");
  await page.getByRole("button", { name: "Create collection" }).click();

  await expect(page).toHaveURL(/\/admin\/collections$/);
  await expect(page.getByRole("link", { name: "E2E Collection" })).toBeVisible();

  const row = page.locator("tbody tr").filter({ hasText: slug });
  await row.getByRole("button", { name: "Delete" }).click();
  await row.getByRole("button", { name: "Yes, delete" }).click();
  await expect(row).toHaveCount(0, { timeout: 15_000 });
});

test("announcements: add and delete", async ({ page }) => {
  await login(page);

  await page.goto("/admin/announcements");
  await expect(
    page.getByRole("heading", { level: 1, name: "Announcements" }),
  ).toBeVisible();

  // Every announcement row is a <form> containing input[name="text"];
  // the add-row form matches too.
  const rows = page.locator("form").filter({
    has: page.locator('input[name="text"]'),
  });
  const before = await rows.count();

  const stamp = Date.now().toString(36);
  const text = `E2E announcement ${stamp}`;
  await page.getByLabel("New announcement").fill(text);
  await page.getByRole("button", { name: "Add announcement" }).click();

  await expect(rows).toHaveCount(before + 1);
  // The new row sorts last (sortOrder = max + 1, ordered ascending).
  const newest = rows.last();
  await expect(newest.locator('input[name="text"]')).toHaveValue(text);

  // Delete controls are SIBLINGS of the row form (no nested forms), so scope
  // to the row container instead.
  const newestRow = page.getByTestId("announcement-row").last();
  await newestRow.getByRole("button", { name: "Delete" }).click();
  await newestRow.getByRole("button", { name: "Yes, delete" }).click();
  await expect(rows).toHaveCount(before, { timeout: 15_000 });
});

test("orders: list renders, status filters, unknown id is 404", async ({
  page,
}) => {
  await login(page);

  await page.goto("/admin/orders");
  await expect(
    page.getByRole("heading", { level: 1, name: "Orders" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Filter by status" }),
  ).toBeVisible();

  // A status filter resolves (empty state at worst — COD checkout is Phase 4).
  await page.goto("/admin/orders?status=pending");
  await expect(
    page.getByRole("heading", { level: 1, name: "Orders" }),
  ).toBeVisible();

  // Bogus order id → 404 (also proves non-UUID ids never reach the DB).
  const bad = await page.request.get("/admin/orders/not-a-real-id");
  expect(bad.status()).toBe(404);
});
