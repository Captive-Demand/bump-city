

# Multi-Event Support: Current Event Context

## Problem
Right now the app assumes one event per user. `useEvent()` just grabs the most recent event. The Profile page mixes user settings with event settings. If a user creates a second shower (or plans one for someone else), they can only see/manage the latest one.

## Solution: Active Event Context
Instead of always fetching "the latest event," introduce an **active event** concept — the user picks which event they're working on, and the whole app operates in that context.

### Key Changes

**1. Create an `ActiveEventContext` (new file)**
- Stores the currently selected `eventId` in React context + `localStorage`
- On load: fetch all events the user owns or is a member of (`events` + `event_members`)
- Expose: `activeEvent`, `allEvents`, `switchEvent(eventId)`, `loading`
- Replace the current `useEvent()` hook — all consumers switch to this context

**2. Update `AppModeContext`**
- Instead of querying the latest event directly, derive `mode` from the active event in `ActiveEventContext`
- Remove the duplicate event fetch

**3. Separate Profile Page from Event Settings**
- **Profile section**: avatar, display name, city, sign out — user-level stuff only
- **Event Settings section**: move honoree name, due date, event date, theme, gift policy, clear wrapping into a dedicated "Event Settings" card that reads from `activeEvent`
- This is mostly a reorganization of what's already in `ProfilePage.tsx`

**4. Add an Event Switcher**
- Small dropdown/selector on the Home page (and optionally in the sidebar/bottom nav area) showing all the user's events
- Tapping switches the active event context, which cascades to all pages (registry, guests, planning, etc.)

**5. Update `useEvent` → use context**
- Convert `useEvent()` from a standalone hook into a simple re-export from `ActiveEventContext`
- All 10+ files importing `useEvent` continue to work with no API change

**6. Update `useEventRole`**
- Already depends on `useEvent` — will automatically use the active event

### No database changes needed
The `events` and `event_members` tables already support multiple events per user. This is purely a frontend architecture change.

## Files Changed
- `src/contexts/ActiveEventContext.tsx` — **new**: stores active event, lists all user events, provides switcher
- `src/contexts/AppModeContext.tsx` — derive mode from ActiveEventContext instead of querying DB directly
- `src/hooks/useEvent.ts` — thin wrapper around ActiveEventContext for backward compat
- `src/pages/ProfilePage.tsx` — separate user profile settings from event settings
- `src/pages/HomePage.tsx` — add event switcher UI when user has multiple events
- `src/App.tsx` — wrap with `ActiveEventProvider`

