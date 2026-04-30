import { type Page, expect } from "@playwright/test";

/**
 * Shared building blocks for the role walkthroughs. Goal: a comprehensive,
 * smooth, watchable tour. Each spec reads like a story (open this, scroll
 * through, tap that) rather than a thicket of selectors.
 *
 * Pacing knobs:
 *   PAUSE — long beat after a meaningful interaction so viewers can read
 *   BREATH — short beat between sub-actions
 *   SCROLL_MS — duration of a smooth eased scroll over a section
 *
 * Important: we never spring back to the top within a page. Snapping causes
 * the "choppy" feel. New pages start at the top naturally because of the
 * navigation, so each section flows linearly: arrive → linger → scroll →
 * linger → next section.
 */

export const PAUSE = 2200;
export const BREATH = 800;
export const SCROLL_MS = 4500;

export async function settle(page: Page, ms: number = PAUSE) {
  await page.waitForTimeout(ms);
}

/**
 * Smooth, eased downward scroll over `durationMs` milliseconds. Runs inside
 * the browser via requestAnimationFrame so the motion is buttery rather than
 * the staircase pattern you get from sequential `mouse.wheel()` calls.
 */
export async function smoothScroll(
  page: Page,
  distancePx: number,
  durationMs: number = SCROLL_MS
) {
  await page.evaluate(
    ({ distance, duration }) => {
      return new Promise<void>((resolve) => {
        const start = window.scrollY;
        const startTime = performance.now();
        const tick = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          // ease-in-out cubic for natural acceleration / deceleration.
          const eased =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo(0, start + distance * eased);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    },
    { distance: distancePx, duration: durationMs }
  );
  // Brief settle after scroll so viewers can absorb the bottom view before
  // the next action.
  await page.waitForTimeout(BREATH);
}

/** Scroll an element into view without snapping the viewport. */
export async function smoothScrollTo(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  }, selector);
  await page.waitForTimeout(1000);
}

/** Tap the orange "Stop preview" button if the impersonation banner is up. */
export async function stopPreview(page: Page) {
  const stop = page.getByRole("button", { name: /stop preview/i });
  if (await stop.isVisible().catch(() => false)) {
    await stop.click();
    await settle(page, BREATH);
  }
}

/**
 * From anywhere, navigate to /admin and pick a Preview-as role. Lingers on
 * the admin panel briefly so viewers see the "Preview as…" controls before
 * the role switch happens.
 */
export async function previewAs(
  page: Page,
  role: "Host" | "Co-Host" | "Honoree" | "Guest"
) {
  await page.goto("/admin");
  await settle(page, BREATH);
  // Smooth-scroll the preview panel into view.
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h3")).find((h) =>
      /Preview the app as/i.test(h.textContent || "")
    );
    heading?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: new RegExp(`^${role}$`) }).click();
  await page.waitForURL("/");
  await settle(page);
}

/**
 * Briefly highlight the impersonation banner so viewers see "Previewing as X"
 * stamped onto the role. We just confirm visibility — the banner is sticky
 * across the recording.
 */
export async function confirmBanner(page: Page, role: RegExp) {
  await expect(
    page.getByText(new RegExp(`previewing as ${role.source}`, "i")).first()
  ).toBeVisible({ timeout: 5000 });
}
