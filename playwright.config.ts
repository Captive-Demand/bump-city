import { defineConfig } from "@playwright/test";

/**
 * Playwright config for the Bump City admin walkthrough video.
 *
 * Run: `npm run walkthroughs` (auto-spins up `npm run dev` on port 8080).
 * Outputs: walkthroughs/output/admin-admin-tour-admin/video.webm
 *          walkthroughs/report/index.html
 *
 * Single comprehensive recording — all screens + onboarding + ends on the
 * admin Preview-as panel so reviewers can self-serve role checks from there.
 */
export default defineConfig({
  testDir: "./walkthroughs",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "walkthroughs/report" }]],
  outputDir: "walkthroughs/output",
  // The tour is long. Give it room.
  timeout: 15 * 60 * 1000,

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8080",
    // 9:16 mobile viewport for native-app feel.
    viewport: { width: 390, height: 844 },
    video: {
      mode: "on",
      size: { width: 390, height: 844 },
    },
    trace: "retain-on-failure",
    // 5s ceiling on individual locator actions. Default 30s lets a single
    // disabled button stall the recording. We'd rather see a quick
    // soft-fail (caught by tryClick) and keep moving.
    actionTimeout: 5_000,
    // Most pacing happens inside the spec via smooth scrolls + settle()
    // calls. A small slowMo just makes individual clicks easier to follow.
    launchOptions: {
      slowMo: Number(process.env.E2E_SLOW_MO ?? 120),
    },
  },

  projects: [
    {
      name: "setup",
      testMatch: /(^|[\\/])auth\.setup\.ts$/,
    },
    {
      name: "admin",
      testMatch: /(^|[\\/])admin-tour\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        storageState: "walkthroughs/.auth/state.json",
      },
    },
  ],

  // Auto-start the dev server unless one is already running on the same port.
  webServer: {
    command: "npm run dev",
    port: 8080,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
