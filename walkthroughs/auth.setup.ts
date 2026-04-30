import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STATE_PATH = "walkthroughs/.auth/state.json";

/**
 * One-time login. Saves the resulting Supabase session to `.auth/state.json`
 * so the per-role walkthrough specs can reuse it without typing credentials
 * again. Re-run by deleting the state file (or running with `--project=setup`).
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_EMAIL and E2E_PASSWORD env vars before running walkthroughs.\n" +
        "Example: E2E_EMAIL=you@example.com E2E_PASSWORD=... npm run walkthroughs"
    );
  }

  await page.goto("/auth");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Auth lands you back on home (or a smart redirect). Either way, the
  // /auth route is gone from history once we're signed in.
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 });

  mkdirSync(dirname(STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STATE_PATH });
});
