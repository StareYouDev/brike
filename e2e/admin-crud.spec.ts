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

// Next.js caps Server Action bodies at 1MB by default while the admin
// advertises 2 MB per image slot: bigger files were rejected by the framework
// *before* the action ran, so the save silently did nothing (the reported
// "image section doesn't work on the product page" bug). next.config.ts now
// raises `serverActions.bodySizeLimit` — this test is the regression gate.
test("edit product accepts an image above the 1MB default limit", async ({
  page,
}) => {
  // The 1.5MB upload round-trip can blow well past the default 60s under
  // parallel Neon/blob load.
  test.setTimeout(120_000);
  await login(page);

  const stamp = Date.now().toString(36);
  const slug = `e2e-big-img-${stamp}`;
  const name = `E2E Big Image ${stamp}`;

  // Make a throwaway product, then exercise the *edit* page upload path.
  await page.goto("/admin/products/new");
  await fillProductBasics(page, name, slug);
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const created = page.locator("tbody tr").filter({ hasText: slug });
  await created.getByText(name).click();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Edit product" }),
  ).toBeVisible();

  // ~1.5MB PNG: above the old 1MB action cap, within the advertised 2 MB.
  const big = Buffer.concat([PNG_1PX, Buffer.alloc(1_500_000)]);
  await page
    .getByLabel("Image A (main) — upload file")
    .setInputFiles({ name: "big.png", mimeType: "image/png", buffer: big });
  await page.getByRole("button", { name: "Save changes" }).click();

  // The action ran to completion (redirect) and the blob image renders.
  // The 1.5MB upload round-trip can take well over the default 5s expect
  // timeout on a loaded uplink — allow 30s for the redirect.
  await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 30_000 });
  const saved = page.locator("tbody tr").filter({ hasText: slug });
  await expect(
    saved.locator('img[src*="blob.vercel-storage.com"]'),
  ).toHaveCount(1);

  // ---- clean up ----
  await saved.getByRole("button", { name: "Delete" }).click();
  await saved.getByRole("button", { name: "Yes, delete" }).click();
  await expect(saved).toHaveCount(0, { timeout: 15_000 });
});

// React resets the form after EVERY action — including failed ones — wiping
// typed values and silently dropping the chosen file (preview still shows it,
// but the input is empty, so the next save uploads nothing). The form now
// snapshots on submit and restores after a failure.
test("a failed save keeps the typed edits and the chosen image", async ({
  page,
}) => {
  await login(page);

  const stamp = Date.now().toString(36);
  const slug = `e2e-keep-${stamp}`;
  const name = `E2E Keep Edits ${stamp}`;

  await page.goto("/admin/products/new");
  await fillProductBasics(page, name, slug);
  // Break exactly one server-side rule: collections are required by zod but
  // have no native `required`, so the submit still reaches the action.
  await page.getByRole("checkbox", { name: "New In" }).uncheck();
  await page
    .getByLabel("Image A (main) — upload file")
    .setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page.getByText("Pick at least one collection.")).toBeVisible();
  expect(await page.getByLabel("Name").inputValue()).toBe(name);
  expect(await page.getByLabel("Slug (URL)").inputValue()).toBe(slug);
  expect(await page.getByLabel("Description").inputValue()).toBe(
    "A throwaway product created by the automated tests only.",
  );
  const fileCount = await page
    .getByLabel("Image A (main) — upload file")
    .evaluate((el) => (el as HTMLInputElement).files?.length ?? 0);
  expect(fileCount).toBe(1);
});

/**
 * Trigger a reorder (key press or drag) and wait for the server action POST
 * to settle. Parallel tests can create/delete a product between our snapshot
 * and the server's full-list check; the action then reports the list changed,
 * the client rolls back and shows the banner — retry a few times so the final
 * order assertions are deterministic. A success settles quietly (no banner
 * within 1.5s) and the transient "Saving order…" indicator disappears.
 */
async function expectReorderPersisted(
  page: Page,
  trigger: () => Promise<void>,
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const post = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().includes("/admin/products"),
    );
    await trigger();
    const response = await post;
    expect(response.status()).toBe(200);
    const stale = await page
      .getByText("product list changed")
      .waitFor({ state: "visible", timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (stale) continue; // rolled back — re-run with the refreshed list
    await expect(page.getByText("Saving order…")).toBeHidden();
    return;
  }
  throw new Error("reorder never persisted");
}

test("products: drag & keyboard reorder persists the new order", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/products");

  const positionOf = async (name: string) => {
    const texts = await page.locator("tbody tr").allInnerTexts();
    return texts.findIndex((text) => text.includes(name));
  };

  const rows = page.locator("tbody tr");
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(3);
  // Bottom two rows: stable seed products (throwaway test rows sort on top).
  const upper = (await rows.nth(count - 2).locator("a").first().innerText()).trim();
  const lower = (await rows.nth(count - 1).locator("a").first().innerText()).trim();
  expect(await positionOf(upper)).toBeLessThan(await positionOf(lower));

  // Keyboard path: move the second-to-last product down one slot.
  await expectReorderPersisted(page, () =>
    rows
      .filter({ hasText: upper })
      .getByRole("button", { name: `Reorder ${upper}` })
      .press("ArrowDown"),
  );
  expect(await positionOf(upper)).toBeGreaterThan(await positionOf(lower));
  await page.reload();
  expect(await positionOf(upper)).toBeGreaterThan(await positionOf(lower));

  // Drag path: put it back by dragging its grip onto the top edge of the
  // row above (drop zone "before" → lands one slot higher).
  await expectReorderPersisted(page, () =>
    page
      .locator("tbody tr")
      .filter({ hasText: upper })
      .getByRole("button", { name: `Reorder ${upper}` })
      .dragTo(page.locator("tbody tr").filter({ hasText: lower }), {
        targetPosition: { x: 60, y: 4 },
      }),
  );
  expect(await positionOf(upper)).toBeLessThan(await positionOf(lower));
  await page.reload();
  expect(await positionOf(upper)).toBeLessThan(await positionOf(lower));
});
