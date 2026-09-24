import { expect, test } from "@playwright/test";

test("home renders the hero and section flow", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sleep in beautiful prints" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shop the collections" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Best sellers" }),
  ).toBeVisible();
});

test("mega menu keeps every column in one row", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Womens", exact: true })
    .hover();
  const panel = page.locator('header div[style*="grid-template-columns"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Shop the collection")).toBeVisible();
  const columns = await panel.evaluate(
    (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
  );
  expect(columns).toBe(4);
  const rowTops = await panel
    .locator(":scope > div")
    .evaluateAll((els) =>
      [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().top)))],
    );
  expect(rowTops).toHaveLength(1);
});

test("PLP fabric filter narrows the grid", async ({ page }) => {
  await page.goto("/collections/womens");
  await expect(
    page.getByRole("heading", { level: 1, name: "Women's Pyjamas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByRole("button", { name: "Satin", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Hummingbird Satin/ }).first()).toBeVisible();
});

test("PLP URL-seeded filter from the mega menu", async ({ page }) => {
  await page.goto("/collections/womens?fabric=Satin");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("button", { name: "Satin", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("PDP requires a size before adding to the basket", async ({ page }) => {
  await page.goto("/products/celestial-harlequin-pyjama-set");
  await page.getByRole("button", { name: /Add to basket/ }).click();
  await expect(page.getByText("Please choose a size.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("PDP add-to-basket opens the drawer with the line item", async ({
  page,
}) => {
  await page.goto("/products/celestial-harlequin-pyjama-set");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: /Add to basket/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByText("Celestial Harlequin Pyjama Set"),
  ).toBeVisible();
  await expect(drawer.getByText("Midnight navy multi · Size M")).toBeVisible();
  // the header is inert while the modal drawer is open — close it first
  await drawer.getByRole("button", { name: "Close" }).click();
  await expect(
    page.getByRole("button", { name: "Basket, 1 items" }),
  ).toBeVisible();
});

test("drawer quantity stepper recalculates the total", async ({ page }) => {
  await page.goto("/products/scarlet-dots-nightdress");
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: /Add to basket/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("Subtotal")).toBeVisible();
  const checkout = drawer.getByRole("link", { name: /Checkout/ });
  await expect(checkout).toHaveText(/£65\.00/);
  await drawer.getByRole("button", { name: "Increase quantity" }).click();
  await expect(checkout).toHaveText(/£130\.00/);
  await drawer.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(checkout).toHaveText(/£65\.00/);
});

test("search panel finds products and shows an empty state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  const input = page.locator("#site-search");
  await input.fill("gingham");
  await expect(
    page.getByRole("link", { name: /Midnight Gingham/ }).first(),
  ).toBeVisible();
  await input.fill("zzzqqq");
  await expect(page.getByText(/No matches/)).toBeVisible();
});

test("contact form blocks an empty submit with inline errors", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please tell us your name.")).toBeVisible();
  await expect(
    page.getByText("Please enter a valid email address."),
  ).toBeVisible();
});

test("unknown routes render the custom 404", async ({ page }) => {
  const response = await page.goto("/totally-missing-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Lost in the laundry" }),
  ).toBeVisible();
});

test("home logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  expect(errors).toEqual([]);
});
