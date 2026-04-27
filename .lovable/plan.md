I found a concrete failure pattern: the page HTML loads, then the browser tries to load the app modules, but some Vite module requests are aborting/404ing after navigation. Because this happens while the JavaScript app is booting, React never gets far enough to show the existing error boundary, so customers only see a blank white page.

Plan to fix it for good:

1. Add a no-JavaScript/boot fallback in `index.html`
   - Put a branded Bump City loading/recovery screen inside `#root` before React starts.
   - This means if the app bundle is slow, aborted, stale, or fails before React mounts, users will see a calm branded message instead of a blank white screen.

2. Harden app startup in `src/main.tsx`
   - Check that the `#root` element exists before mounting.
   - Wrap the initial import/render path with safer startup handling so boot failures surface as the branded recovery UI rather than an empty page.
   - Keep the storage guard first, but make cache recovery non-blocking so it cannot interrupt initial rendering.

3. Fix the preview/navigation module race
   - The white screen reproduced with failed requests for `src/App.tsx` and Vite’s `env.mjs` after navigating directly to `/setup/shower`.
   - I’ll remove anything in our app that can trigger unnecessary reload/cache cleanup during startup in the dev preview path, and make cache cleanup only run when it is actually useful for published/stale-cache recovery.

4. Remove the PWA manifest failure from preview
   - The console repeatedly shows `/manifest.json` returning 401 in the authenticated preview environment.
   - I’ll gate or make the manifest registration safe so this does not spam errors or contribute to fragile startup behavior in preview, while preserving the published app’s PWA support.

5. Add a stronger user-facing recovery path
   - If a true render crash happens, show the existing branded error boundary with a “Reload app” button.
   - If the app never mounts, the HTML fallback will still be visible.

6. Verify after implementation
   - Build the project.
   - Test direct navigation to `/setup/shower` and `/` in the preview.
   - Confirm the page no longer goes blank even if module/cache failures happen; at worst users see the branded recovery message, not a white screen.

Technical details:
- Current `AppErrorBoundary` only catches React render errors after JavaScript has successfully loaded. It cannot catch failed module requests or startup crashes.
- The screenshot shows the exact pre-React failure mode: white background, no app UI, no error boundary.
- Browser network logs show failed module requests after navigating to `/setup/shower`, which explains why this keeps bypassing previous React-level fixes.