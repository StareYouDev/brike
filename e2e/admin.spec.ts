import { expect, test } from "@playwright/test";

// Seeded dev defaults (ADMIN_EMAIL/ADMIN_PASSWORD are unset locally, so
// lib/db/seed.ts seeds these into the PGlite file during `next build`).
const ADMIN_EMAIL = "admin@brike.co.uk";
const ADMIN_PASSWORD = "brike-admin";

test("anonymous /admin is redirected to the login page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("a wrong password shows an accessible error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page
    .getByLabel("Password")
    .fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Scope to the form: Next's route announcer also has role="alert".
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "not correct",
  );
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("seeded credentials reach the overview; sign out re-protects /admin", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Overview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent orders" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("an unknown URL under a signed-in /admin renders the 404 with storefront chrome", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const response = await page.goto("/admin/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Lost in the laundry" }),
  ).toBeVisible();
  // Storefront chrome (header/search/nav) is present on the 404 page.
  // The footer renders a second "Main" nav, so scope to the header.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("navigation", { name: "Main" }),
  ).toBeVisible();
});
