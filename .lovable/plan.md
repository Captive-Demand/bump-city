The flashing is still happening because each page still renders its own `MobileLayout`, and the app still has one global `Suspense` fallback that swaps the whole route area to a blank loading screen while a page chunk loads. So on clicks, React briefly removes the current page/layout and shows `<main aria-label="Loading">`, which matches the session replay.

Plan to fix it properly:

1. Make the app shell persistent for logged-in pages
   - Move `MobileLayout` up into `App.tsx` around the protected route group instead of having every protected page own its own layout.
   - Keep the sidebar/bottom nav mounted while only the inner page content changes.
   - Keep auth/onboarding pages (`/auth`, `/get-started`, `/setup/shower`, reset password, unsubscribe, public/guest routes if needed) using `hideNav` or standalone layout behavior.

2. Remove duplicate page-level layout wrappers
   - Update protected pages like Home, Showers, Registry, Predictions, Guests, Invites, Gift Tracker, Planning, Vendors, Community, Profile, Admin, and Shower detail so they return page content only.
   - This prevents the entire shell from unmounting/remounting during navigation.

3. Replace full-screen route loading with an in-content fallback
   - Change the lazy-route `Suspense` fallback from a full-screen blank `<main>` to a small skeleton/content placeholder that appears inside the existing layout.
   - This means clicking a nav item no longer blanks the whole screen or makes the sidebar disappear.

4. Clean up page loading states that re-wrap layout
   - Replace page loading spinners like Gift Tracker, Planning, Vendors, Admin, etc. with compact skeletons inside the stable page area.
   - Avoid nested `MobileLayout` in loading branches.

5. Preload common route chunks on navigation interaction
   - Add lightweight preloading for primary nav/more menu routes on hover/focus/touch so the next page bundle is already requested before click finishes.
   - This improves perceived speed and reduces the chance of seeing any fallback at all.

6. Verify behavior
   - Run a production build.
   - Check the routes that were flashing, especially `/gift-tracker`, `/planning`, `/invites`, `/registry`, `/showers`, and desktop sidebar navigation.

Technical details:
- This will mainly touch `src/App.tsx`, `src/components/layout/MobileLayout.tsx`, `BottomNav.tsx`, `DesktopSidebar.tsx`, and the page files that currently wrap themselves in `MobileLayout`.
- The expected result is: sidebar/nav stays visible, content transitions without a white/blank flash, and loading states are confined to the page content area.