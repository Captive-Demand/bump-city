# Admin walkthrough video

End-to-end Playwright recording showing every meaningful screen in the app from a logged-in admin's perspective. Used for stakeholder demos, training, and onboarding.

## What's recorded

A single comprehensive video (`admin-tour.spec.ts`) walking:

1. **Home dashboard** — TodaysFocusCard, status strip, quick actions, recent activity, setup progress, notifications popover
2. **Onboarding flow** — every step of `/get-started` clicked through (path picker → role → journey → due date → first-time → milestone → event date → city → auth form). Submit is intentionally skipped so no test data lands in the DB.
3. **Showers list + detail** — hero, status strip, manage tiles
4. **Guest List** — segment tabs (All / Attending / Pending / Declined), guest detail sheet with scroll, group-message composer (channel toggle + audience filters), Add Guest dialog, bulk-send mode
5. **Registry** — items, filters, full scroll
6. **Predictions / Guess & Win** — hero card with avatar strip, sheet with all three tabs (Submit / Mine, Leaderboard, Results), share-game button
7. **Gift Tracker** — stats row, filter pills cycling, Log dialog
8. **Planning** — task list scroll
9. **Profile**
10. **Admin panel** — tabs (Vendors, Events, Users, Settings, Stats) — ends on the **"Preview the app as…"** panel so the reviewer can run role previews themselves

## Setup

You only need to do this once per machine.

1. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install chromium
   ```

2. **Set credentials** for a super-admin account (the only role that can access the Preview-as panel):
   ```bash
   export E2E_EMAIL=spencer@captivedemand.com
   export E2E_PASSWORD=...
   ```

   Optional:
   - `E2E_BASE_URL` — defaults to `http://localhost:8080`
   - `E2E_SLOW_MO` — ms slowdown between Playwright actions (default 120; bump to 300 for slower videos)

## Run

```bash
npm run walkthroughs
```

This will:
1. Spin up `npm run dev` on port 8080 (or reuse a running one)
2. Run the auth setup once → saves session to `walkthroughs/.auth/state.json`
3. Run the admin tour → drops `video.webm` under `walkthroughs/output/admin-admin-tour-admin/`

To re-record (clear cached auth state):
```bash
rm -rf walkthroughs/.auth walkthroughs/output && npm run walkthroughs
```

## Find the video

After a successful run:
```
walkthroughs/output/admin-admin-tour-admin/video.webm
```

The HTML report is at `walkthroughs/report/index.html` — open it for the inline player.

## Sharing

`webm` plays natively in modern browsers and most chat apps. For email distribution to people on legacy clients, the easiest path is:

1. Drag the `.webm` file into Google Drive (or Loom, Dropbox, etc.)
2. Set sharing to "anyone with the link can view"
3. Paste the share URL into the email template at `walkthroughs/email-template.md`

If you need `.mp4`, run:
```bash
ffmpeg -i walkthroughs/videos/admin-tour.webm -c:v libx264 -crf 23 -preset fast -movflags +faststart walkthroughs/videos/admin-tour.mp4
```
(requires ffmpeg: `brew install ffmpeg`)

## Tweaking

- **Slow it down further**: bump `PAUSE` in `walkthroughs/_helpers.ts` from 2200 to 3500 and `SCROLL_MS` from 4500 to 7000
- **Add a screen**: drop a new `await page.goto("/route")` block into `admin-tour.spec.ts` at the right point in the sequence
- **Skip onboarding section**: comment out the "2. Onboarding wizard" block — saves about 90 seconds

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:8080`** — dev server didn't start in time. Run `npm run dev` in a separate terminal first, then run the walkthroughs.
- **`Set E2E_EMAIL and E2E_PASSWORD`** — you forgot to export the credentials.
- **Auth fails** — delete `walkthroughs/.auth/state.json` and re-run.
- **Spec fails on a clicked element** — the selector might have drifted with a recent change; the spec uses defensive `tryClick()` for most actions, but high-impact buttons (the onboarding "Next") expect specific copy.
