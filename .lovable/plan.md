I found the likely recurring cause: the project has a custom service worker registered in `index.html`. Even after improving `public/sw.js`, existing browsers can still be controlled by an older cached service worker that previously cached the app shell and dev/prod JS. That can leave customers with stale or missing app files and a blank screen. The app also has no top-level error boundary, so any startup crash becomes a white screen instead of a recoverable branded message.

Plan to fix this permanently:

1. Disable the risky app-shell cache path
   - Remove the direct service worker registration from `index.html` for now.
   - Keep the web app manifest/icons so install branding remains intact.
   - This prioritizes reliability over fragile offline caching.

2. Ship a service-worker cleanup file
   - Update `/sw.js` into a safe cleanup worker that deletes all old `bumpcity-*` caches, claims clients, and unregisters itself.
   - This gives already-affected customer browsers a path to recover automatically once they load the updated file.

3. Add a client-side cache recovery guard
   - Add startup code that detects existing service workers/caches and clears the old Bump City caches on load.
   - If a stale worker is controlling the page, force one clean reload after cleanup, avoiding an infinite reload loop.

4. Add a branded app error boundary
   - Wrap the root app in an error boundary so future runtime errors show a Bump City recovery screen instead of a white screen.
   - Include a “Reload app” button that clears old caches/service workers before refreshing.

5. Make local startup storage safer
   - Harden localStorage writes in startup contexts so unavailable/private storage cannot crash the whole app.

6. Verify
   - Run a production build.
   - Re-check dev-server logs.
   - Confirm the app no longer depends on cached JS/CSS and has a visible recovery path if anything fails.

After this, customers should no longer get stuck on a permanent white screen from stale cached files; worst case, they’ll see a branded recovery screen with a reload action instead of a blank app.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
  <lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>