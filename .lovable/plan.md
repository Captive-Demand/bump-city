

# Make the App Responsive for Desktop

## Problem
The entire app is locked to a 430px-wide mobile column centered on screen. On desktop, users see a narrow strip with wasted space on both sides.

## Approach
Convert the layout to be adaptive: on small screens it fills the viewport naturally; on larger screens (768px+) it switches to a two-column or wider layout that uses the available space. The bottom nav becomes a sidebar on desktop.

## Changes

### 1. Replace `MobileLayout` with a responsive `AppLayout`
**File: `src/components/layout/MobileLayout.tsx`**
- Remove the fixed `max-w-[430px]` constraint
- On mobile (<768px): full-width layout with bottom nav, same as today
- On desktop (>=768px): sidebar nav on the left (vertical icon+label list), main content fills remaining width with a comfortable max-width (~1024px), centered

### 2. Convert `BottomNav` to a responsive nav
**File: `src/components/layout/BottomNav.tsx`**
- On mobile: stays as a fixed bottom bar (unchanged)
- On desktop: renders as a vertical sidebar (left side, ~80px wide) with the same icons stacked vertically
- Use the `useIsMobile()` hook to switch between the two renderings

### 3. Update page content to use wider layouts on desktop
**File: `src/pages/HomePage.tsx`**
- Quick Actions grid: 2 cols on mobile, 4 cols on desktop
- Content sections get reasonable max-widths and padding

**Other pages** (`RegistryPage`, `GuestListPage`, `PredictionsPage`, `ProfilePage`):
- Allow content to expand beyond 430px on desktop
- Use responsive grid columns where applicable (e.g., registry items 2-col mobile, 3-4 col desktop)

### 4. Setup wizard pages
**Files: `ShowerSetupPage.tsx`, `RegistrySetupPage.tsx`**
- Center the wizard card with a max-width (~500px) on desktop — keeps the focused feel
- No sidebar nav shown during setup (already uses `hideNav`)

## Technical Details
- Use existing `useIsMobile()` hook from `src/hooks/use-mobile.tsx`
- Tailwind responsive prefixes (`md:`) for all breakpoint changes
- No new dependencies needed

## Files to Change
- `src/components/layout/MobileLayout.tsx` — remove 430px cap, add responsive container
- `src/components/layout/BottomNav.tsx` — add desktop sidebar variant
- `src/pages/HomePage.tsx` — responsive grids
- `src/pages/RegistryPage.tsx` — wider content layout
- `src/pages/GuestListPage.tsx` — wider content layout
- `src/pages/PredictionsPage.tsx` — wider content layout
- `src/pages/ProfilePage.tsx` — wider content layout

