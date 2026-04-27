I found two likely causes of the slow/flashy load:

1. The route-level lazy loading currently replaces the whole page while a new page module loads. Since each page owns its own `MobileLayout`, the desktop sidebar can disappear during route changes.
2. The sidebar and bottom nav call role-loading logic directly and return `null` while roles are being fetched, so navigation temporarily vanishes even after the app shell has mounted.

Performance data from the preview also shows a dev-preview overhead: about 93 resources, FCP around 3.6s, full load around 4.6s, and slow module requests for `RegistryPage.tsx`, `ActiveEventContext.tsx`, Vite refresh scripts, and shared libraries. Published builds should be faster than preview, but we can still fix the app-level flashing and extra calls.

## Plan

1. Keep the app shell visible during page transitions
   - Add a lightweight route fallback that renders the normal `MobileLayout` structure without a branded loading screen or spinner.
   - Use this fallback for lazy route loading so the sidebar/bottom nav do not disappear while page chunks load.
   - Keep the emergency boot recovery screen only for true app boot failure, not normal navigation.

2. Stop sidebar/nav from disappearing during role checks
   - Update `DesktopSidebar` and `BottomNav` so they do not return `null` while role data loads.
   - Show the stable baseline nav immediately, then reveal host/admin-only items once role data is ready.
   - This prevents the visible sidebar reload/flicker.

3. Centralize and cache role loading
   - Replace repeated `useEventRole()` fetches with a shared role context/cache so the app does not refetch roles separately for the sidebar, bottom nav, host-only guards, and pages.
   - Ensure role checks update when the active event changes.

4. Reduce registry route load weight
   - Lazy-load heavy registry subcomponents like the inline browser/dialog content only when needed.
   - Keep the main registry page interactive sooner.

5. Reduce duplicate startup queries
   - Tighten active-event loading to avoid unnecessary sequential waits where safe.
   - Avoid repeated count/role fetches triggered by multiple mounted components where possible.

6. Replace full-page spinners with stable content placeholders
   - For pages currently showing centered spinners, use quiet skeleton/empty placeholders inside the existing layout instead.
   - This makes loading feel faster and avoids the “everything disappeared and came back” effect.

7. Verify
   - Run a production build.
   - Test direct navigation to `/registry` and route switching between Home, Registry, Predictions, and Profile.
   - Confirm the sidebar stays visible during navigation and no “Bump City is loading” screen appears during normal use.

## Technical notes

- Main files likely involved: `src/App.tsx`, `src/components/layout/MobileLayout.tsx`, `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/BottomNav.tsx`, `src/hooks/useEventRole.ts`, and `src/pages/RegistryPage.tsx`.
- This is primarily a frontend shell/loading architecture fix; no database migration should be needed.
- The preview environment itself is slower because Vite serves many development modules individually, but these changes will reduce app-level flicker and make both preview and published app feel faster.

<lov-actions>
<lov-open-history>View History</lov-open-history>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>