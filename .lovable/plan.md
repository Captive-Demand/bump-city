

# Changes from Check-In Call (March 24, 2026)

## What Tiffany Requested

From the call transcript, Tiffany raised two key changes:

### 1. Registry as a Standalone Experience
Tiffany wants the registry to be accessible independently — not locked behind the baby shower planning flow. Users who just want a registry (without planning a shower) should be able to do so. The registry should work as its own product offering alongside the full shower planning experience.

### 2. "Building a Registry" Option on the Homepage
Tiffany specifically said: *"on this homepage where I say I'm planning a baby shower, maybe we just give an option to building a registry"* — a second entry point that bypasses the shower planning flow entirely.

---

## Technical Plan

### Step 1: Update HomePage with dual entry paths
Modify `src/pages/HomePage.tsx` to present two clear options at the top:
- **"I'm planning a baby shower"** — enters the full app experience (current flow)
- **"I'm building a registry"** — goes directly to the registry experience

This replaces or augments the current welcome header with a simple choice UI using two prominent cards/buttons.

### Step 2: Create a standalone Registry landing route
Add a `/registry-standalone` or similar route in `src/App.tsx` that renders the registry page without the full shower context — no countdown, no guest list nav emphasis, just registry-focused navigation.

### Step 3: Adjust BottomNav conditionally
When a user enters via the "registry only" path, the bottom nav could simplify to show only relevant tabs (Registry, Profile) rather than the full 5-tab set. This can be managed with a simple context/state flag.

---

## Files to Change
- `src/pages/HomePage.tsx` — add dual-path entry UI
- `src/App.tsx` — add registry-standalone route
- `src/components/layout/BottomNav.tsx` — support a simplified nav mode
- New: `src/contexts/AppModeContext.tsx` — store whether user chose "shower" or "registry only" mode

