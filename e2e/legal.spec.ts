import { expect, test } from "@playwright/test";

/**
 * Phase 4 gate: the three UK-compliance policy pages exist, render their
 * designed h1 (a miss would fall through to the catch-all 404), and are
 * reachable from the footer legal nav on the homepage.
 */
test("legal pages render and are linked from the footer", async ({ page }) => {
  const pages = [
    ["/returns", "Returns & refunds"],
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of sale"],
  ] as const;

  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText(/Last updated/)).toBeVisible();
    // No placeholder promises: the trader block renders the studio address
    // (`.first()` — some pages mention the email again in prose).
    await expect(page.getByText(/hello@brike\.co\.uk/).first()).toBeVisible();
  }

  await page.goto("/");
  const legal = page.getByRole("navigation", { name: "Legal" });
  await expect(legal.getByRole("link", { name: "Returns & refunds" })).toBeVisible();
  await expect(legal.getByRole("link", { name: "Privacy policy" })).toBeVisible();
  await expect(legal.getByRole("link", { name: "Terms of sale" })).toBeVisible();
});
