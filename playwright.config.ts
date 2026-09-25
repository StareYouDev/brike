import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Server actions that revalidate the whole layout (place order, reorder)
  // legitimately take >5s on a cold cache, and the login/redirect assertions
  // ride the same default — 10s keeps them green under 4-worker load.
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Keep concurrent browser load modest: every worker's page views trigger
  // server renders + server actions against the same Neon database, and
  // DB-heavy CRUD round-trips time out when all workers hit it at once.
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
