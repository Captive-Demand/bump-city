import { test, expect, type Page, type Locator } from "@playwright/test";
import {
  settle,
  smoothScroll,
  PAUSE,
  BREATH,
  SCROLL_MS,
} from "./_helpers";

test.describe.configure({ mode: "serial" });

/**
 * Comprehensive admin tour. One video walking every meaningful screen with
 * lots of click-throughs. Onboarding flow, all host pages, ends on the
 * Preview-as admin panel so the reviewer can take it from there themselves.
 *
 * Pacing: keeps the smooth pace established earlier (PAUSE ~2.2s, smooth
 * scrolls ~4.5s) but maximizes interactions per screen — open dialogs,
 * cycle filters, tap into detail sheets, etc. — so each screen feels alive
 * rather than just scrolled past.
 *
 * Safe by design: never clicks a final-submit button that would create real
 * data (e.g. the onboarding auth step is shown but not submitted; dialogs
 * are opened and dismissed without saving).
 */

/**
 * Click if visible AND enabled. We never want a disabled button to burn the
 * 5s actionTimeout — `tryClick` fails fast and returns whether it actually
 * landed a click, so calling code can decide to bail.
 */
const tryClick = async (loc: Locator, label = "click"): Promise<boolean> => {
  void label;
  if (!(await loc.isVisible().catch(() => false))) return false;
  if (await loc.isDisabled().catch(() => false)) return false;
  return loc
    .click({ timeout: 2_500 })
    .then(() => true)
    .catch(() => false);
};

const dismissOpenSheetOrDialog = async (page: Page) => {
  // Esc closes both Radix Dialog and Sheet. Two presses is safe — extra
  // ones are no-ops.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(BREATH);
};

/**
 * Click "Next" inside the onboarding wizard and confirm the step actually
 * advanced (the heading text changes). Returns false if we're stuck —
 * letting the caller bail out gracefully without retrying through the rest
 * of a flow that depends on an earlier step.
 */
const onboardingNext = async (page: Page): Promise<boolean> => {
  const headingBefore = await page
    .locator("h1")
    .first()
    .textContent()
    .catch(() => "");
  const next = page.getByRole("button", { name: /^next/i });
  if (!(await tryClick(next, "next"))) return false;
  // Wait briefly for the heading to change. If it doesn't, we're stuck on
  // a step that wasn't completed (e.g. required date not picked).
  try {
    await page.waitForFunction(
      (before) => {
        const h = document.querySelector("h1");
        return h && h.textContent !== before;
      },
      headingBefore,
      { timeout: 2_500 }
    );
    return true;
  } catch {
    return false;
  }
};

/** Pick a non-disabled day in the open react-day-picker calendar popover. */
const pickAnyDay = async (page: Page): Promise<boolean> => {
  // react-day-picker renders days as `<button>` inside `<td role="gridcell">`.
  // The disabled days have `disabled` set; pick the first enabled one.
  const candidates = [
    page.getByRole("gridcell").filter({ hasNot: page.locator("[disabled]") }),
    page.locator('[role="gridcell"] button:not([disabled])'),
    page.locator('button.rdp-day:not([disabled])'),
  ];
  for (const c of candidates) {
    const first = c.first();
    if (await first.isVisible().catch(() => false)) {
      // Prefer mid-month so the click doesn't land on an out-of-range edge.
      const enabled = await c.all().catch(() => []);
      const target = enabled[Math.min(15, enabled.length - 1)] ?? first;
      const ok = await target
        .click({ timeout: 2_500 })
        .then(() => true)
        .catch(() => false);
      if (ok) return true;
    }
  }
  return false;
};

test("admin tour", async ({ page }) => {
  // Roughly 5 minutes of recording time; give breathing room for slow CI.
  test.setTimeout(15 * 60 * 1000);

  // ─── 1. Home (logged-in admin view) ────────────────────────────────────
  await page.goto("/");
  await settle(page, PAUSE);
  // Hero (TodaysFocusCard / EventCard) + status strip
  await smoothScroll(page, 600, 3500);
  await settle(page, BREATH);
  // Quick actions + recent activity
  await smoothScroll(page, 600, SCROLL_MS);
  await settle(page, PAUSE);
  // Setup progress / How it works / shower picker
  await smoothScroll(page, 600, SCROLL_MS);
  await settle(page, PAUSE);

  // Open notifications popover
  const bell = page.locator('button[aria-label*="otification"]').first();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(BREATH);
  if (await tryClick(bell, "open bell")) {
    await settle(page, PAUSE);
    await dismissOpenSheetOrDialog(page);
  }

  // ─── 2. Onboarding wizard ──────────────────────────────────────────────
  // Walk every visual step of /get-started. We bail out of any later step
  // that can't advance (rather than hanging on disabled Next buttons).
  // The final auth step is shown but never submitted — no event is created.
  await runOnboardingTour(page);

  // ─── 3. Showers list ──────────────────────────────────────────────────
  await page.goto("/showers");
  await settle(page, PAUSE);
  await smoothScroll(page, 400, 3000);
  await settle(page, PAUSE);

  // Tap into a shower if one's visible
  const firstShower = page
    .getByRole("link")
    .filter({ hasText: /baby shower|alisha|spencer|maya/i })
    .first();
  if (await tryClick(firstShower, "open shower")) {
    await settle(page, PAUSE);
    await smoothScroll(page, 700, SCROLL_MS);
    await settle(page, PAUSE);
    await smoothScroll(page, 700, SCROLL_MS);
    await settle(page, PAUSE);
    await smoothScroll(page, 700, SCROLL_MS);
    await settle(page, PAUSE);
  }

  // ─── 4. Guest List ─────────────────────────────────────────────────────
  await page.goto("/guests");
  await settle(page, PAUSE);
  // Cycle every status segment
  for (const segment of [/^all/i, /attending/i, /pending/i, /declined/i, /^all/i]) {
    await tryClick(
      page.getByRole("button", { name: segment }).first(),
      `seg ${segment}`
    );
    await settle(page, PAUSE);
  }

  // Open guest detail sheet (tap the first row)
  const firstGuest = page.locator("[class*='cursor-pointer']").first();
  if (await tryClick(firstGuest, "open guest")) {
    await settle(page, PAUSE);
    await page.evaluate(() => {
      const sheet = document.querySelector('[role="dialog"]');
      sheet?.scrollTo({ top: 250, behavior: "smooth" });
    });
    await settle(page, PAUSE);
    await page.evaluate(() => {
      const sheet = document.querySelector('[role="dialog"]');
      sheet?.scrollTo({ top: 500, behavior: "smooth" });
    });
    await settle(page, PAUSE);
    await dismissOpenSheetOrDialog(page);
  }

  // Open the message composer
  await tryClick(page.getByRole("button", { name: /^message$/i }), "open composer");
  await settle(page, PAUSE);
  // Show channel toggle
  await tryClick(page.getByRole("button", { name: /^sms$/i }), "channel sms");
  await settle(page, PAUSE);
  await tryClick(page.getByRole("button", { name: /^email$/i }), "channel email");
  await settle(page, PAUSE);
  // Show audience filters
  await tryClick(page.getByRole("button", { name: /attending/i }).first(), "filter attending");
  await settle(page, PAUSE);
  await tryClick(page.getByRole("button", { name: /pending/i }).first(), "filter pending");
  await settle(page, PAUSE);
  await dismissOpenSheetOrDialog(page);

  // Open Add Guest dialog briefly
  await tryClick(page.getByRole("button", { name: /^add$/i }).first(), "open add");
  await settle(page, PAUSE);
  await dismissOpenSheetOrDialog(page);

  // Toggle bulk send mode
  await tryClick(page.getByRole("button", { name: /bulk send/i }), "bulk on");
  await settle(page, PAUSE);
  await tryClick(page.getByRole("button", { name: /^cancel$/i }), "bulk off");
  await settle(page, PAUSE);

  // ─── 5. Registry ───────────────────────────────────────────────────────
  await page.goto("/registry");
  await settle(page, PAUSE);
  await smoothScroll(page, 600, SCROLL_MS);
  await settle(page, PAUSE);
  await smoothScroll(page, 600, SCROLL_MS);
  await settle(page, PAUSE);

  // ─── 6. Predictions / Guess & Win ──────────────────────────────────────
  await page.goto("/predictions");
  await settle(page, PAUSE);
  await smoothScroll(page, 400, 3000);
  await settle(page, PAUSE);
  // Open the game sheet
  const playBtn = page.getByRole("button", { name: /play now|view.*edit prediction/i });
  if (await tryClick(playBtn, "open game")) {
    await settle(page, PAUSE);
    // Cycle the three tabs
    for (const tabName of [/leaderboard/i, /results/i, /^submit|^mine/i]) {
      await tryClick(page.getByRole("tab", { name: tabName }), `tab ${tabName}`);
      await settle(page, PAUSE);
    }
    await dismissOpenSheetOrDialog(page);
  }

  // Tap the "Share game with guests" button (it copies a link / opens a
  // share sheet — no destructive action).
  await tryClick(
    page.getByRole("button", { name: /share game with guests/i }),
    "share game"
  );
  await settle(page, PAUSE);

  // ─── 7. Gift Tracker ───────────────────────────────────────────────────
  await page.goto("/gift-tracker");
  await settle(page, PAUSE);
  await smoothScroll(page, 300, 2500);
  await settle(page, PAUSE);
  // Cycle every filter pill
  for (const filter of [/needs thank you/i, /^sent$/i, /^all$/i]) {
    await tryClick(page.getByRole("button", { name: filter }).first(), `filter ${filter}`);
    await settle(page, PAUSE);
  }
  // Open Log dialog briefly
  await tryClick(page.getByRole("button", { name: /^log$/i }).first(), "open log");
  await settle(page, PAUSE);
  await dismissOpenSheetOrDialog(page);

  // ─── 8. Planning / Checklist ───────────────────────────────────────────
  await page.goto("/planning");
  await settle(page, PAUSE);
  await smoothScroll(page, 700, SCROLL_MS);
  await settle(page, PAUSE);
  await smoothScroll(page, 500, SCROLL_MS);
  await settle(page, PAUSE);

  // ─── 9. Profile ────────────────────────────────────────────────────────
  await page.goto("/profile");
  await settle(page, PAUSE);
  await smoothScroll(page, 500, SCROLL_MS);
  await settle(page, PAUSE);

  // ─── 10. Admin panel — final destination, ending on Preview-as ────────
  await page.goto("/admin");
  await settle(page, PAUSE);

  // Walk the admin tabs so the reviewer sees everything available
  for (const tab of [/vendors/i, /events/i, /users/i, /settings/i, /stats/i]) {
    await tryClick(
      page.getByRole("tab", { name: tab }).first(),
      `admin tab ${tab}`
    );
    await settle(page, PAUSE);
    await smoothScroll(page, 300, 2500);
    await settle(page, BREATH);
  }

  // Land on the Stats tab and scroll to the Preview-as panel — this is
  // where the video ends so the reviewer can run the role previews
  // themselves.
  await tryClick(page.getByRole("tab", { name: /stats/i }).first(), "stats");
  await settle(page, BREATH);
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h3")).find((h) =>
      /Preview the app as/i.test(h.textContent || "")
    );
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await settle(page, PAUSE);

  // Linger on the Preview-as panel showing the four role buttons + the
  // anonymous-invite preview at the bottom.
  await page.waitForTimeout(PAUSE * 2);

  // Confirm the panel is on screen — defensive assert so a regression in
  // the admin layout would surface as a test failure.
  await expect(
    page.getByRole("heading", { name: /preview the app as/i })
  ).toBeVisible();
});

/**
 * Self-contained onboarding-flow tour. Each step calls `onboardingNext()`
 * and bails out if the wizard didn't actually advance — the rest of the
 * tour continues unaffected.
 */
async function runOnboardingTour(page: Page): Promise<void> {
  await page.goto("/get-started");
  await settle(page, PAUSE);

  // Step 1: Path picker — click both to show selection state
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /a registry/i }).first(),
    "registry"
  );
  await settle(page, BREATH);
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /a baby shower/i }).first(),
    "shower"
  );
  await settle(page, PAUSE);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 2: Role
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /co-hosting|hosting/i }).first(),
    "host role"
  );
  await settle(page, BREATH);
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /it.s mine/i }).first(),
    "honoree role"
  );
  await settle(page, PAUSE);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 3: Journey — show all four
  for (const journey of [/pregnancy/i, /adoption/i, /surrogacy/i, /trying/i, /pregnancy/i]) {
    await tryClick(
      page.locator(".cursor-pointer").filter({ hasText: journey }).first(),
      `journey ${journey}`
    );
    await settle(page, BREATH);
  }
  await settle(page, BREATH);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 4: Due date — open the calendar, pick any enabled future day
  await tryClick(page.getByRole("button", { name: /pick a date/i }), "open date");
  await settle(page, PAUSE);
  await pickAnyDay(page);
  await settle(page, PAUSE);
  // Toggle multiples on/off so the checkbox state is visible
  const multiplesLabel = page.getByText(/more than one is on the way/i).first();
  await tryClick(multiplesLabel, "multiples on");
  await settle(page, BREATH);
  await tryClick(multiplesLabel, "multiples off");
  await settle(page, BREATH);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 5: First-time parent
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /^no$/i }).first(),
    "no"
  );
  await settle(page, BREATH);
  await tryClick(
    page.locator(".cursor-pointer").filter({ hasText: /^yes$/i }).first(),
    "yes"
  );
  await settle(page, PAUSE);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 6: Milestone interstitial — linger so the kindergarten-year copy
  // is readable.
  await settle(page, PAUSE + 1000);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 7: Event date (shower-only path). Click the picker open + close
  // so viewers see the affordance, then advance with no date set.
  await tryClick(
    page.getByRole("button", { name: /pick a date.*optional/i }),
    "open event date"
  );
  await settle(page, PAUSE);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(BREATH);
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 8: City — type a city so the Nashville unlock hint shows up
  const cityInput = page.locator("#city");
  if (await cityInput.isVisible().catch(() => false)) {
    await cityInput.click();
    await page.waitForTimeout(BREATH);
    await cityInput.fill("Nashville, TN");
    await settle(page, PAUSE);
  }
  if (!(await onboardingNext(page))) return;
  await settle(page, PAUSE);

  // Step 9: Auth — visible but never submitted. Toggle Sign-in / Create-one
  // so reviewers see both modes exist.
  await settle(page, PAUSE);
  const signInToggle = page.getByRole("button", { name: /sign in instead/i }).first();
  if (await tryClick(signInToggle, "sign in mode")) {
    await settle(page, PAUSE);
    await tryClick(
      page.getByRole("button", { name: /create one/i }).first(),
      "create one"
    );
    await settle(page, PAUSE);
  }
}
