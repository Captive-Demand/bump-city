

# Make Recent Activity Dynamic (Tied to Real App Events)

## Current State
The "Recent Activity" section on the HomePage is fully hardcoded — three static items with fake names and times. There's no database connected yet, so we can't pull from server-side event logs.

## Approach
Since there's no backend yet, we'll create a **client-side activity feed system** using React context. Real user actions within the app (claiming a registry item, submitting an RSVP, adding a prediction) will push events into this feed, and the HomePage will render them live.

When Lovable Cloud / Supabase is connected later, this context can be swapped to read from an `activity_log` database table instead.

## What Changes

### 1. New file: `src/contexts/ActivityFeedContext.tsx`
- Context that holds an array of activity events: `{ id, type, text, icon, timestamp }`
- `addActivity(type, text)` function exposed to any component
- Events stored in state (and optionally `localStorage` so they persist across refreshes)
- Types: `gift-claimed`, `rsvp`, `prediction`, `registry-added`, `guest-invited`

### 2. Modify: `src/pages/HomePage.tsx`
- Replace the hardcoded activity array with `useActivityFeed()` hook
- Show "No activity yet" empty state when the feed is empty
- Render relative timestamps from real `Date` objects

### 3. Modify: `src/App.tsx`
- Wrap app in `ActivityFeedProvider`

### 4. Modify pages that generate events
- `src/pages/RegistryPage.tsx` — log activity when an item is added/claimed
- `src/pages/GuestListPage.tsx` — log activity when a guest RSVPs
- `src/pages/PredictionsPage.tsx` — log activity when a prediction is submitted

### 5. Future (when backend is added)
- Create an `activity_log` table in Supabase
- Replace context reads with a query to the table
- Write events server-side via insert

## Empty State
When there are no activities yet, show a friendly message like "No activity yet — start by adding items to your registry!" instead of a blank section.

