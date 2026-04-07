

# Skip Setup for Returning Users + "Create New Event" from App

## Summary
Returning users who already have an event skip setup screens and go straight to the dashboard. A new "Create New Event" option in the app lets them add a second shower or registry anytime.

## Changes

### 1. Smart post-login redirect (AuthPage.tsx)
After successful login/signup, query `events` and `event_members` for the user. If any rows exist, redirect to `/` instead of the setup path. Only first-time users flow through to `/setup/shower` or `/setup/registry`.

### 2. Guard on setup pages (ShowerSetupPage.tsx, RegistrySetupPage.tsx)
Add a `useEffect` that checks if the user already owns an event. If so, redirect to `/`. This prevents direct URL access to setup when they already have data. Skip this guard if a URL param like `?new=true` is present (used by the "Create New Event" flow).

### 3. "Create New Event" button on HomePage
Add a card or button (e.g. "+" or "Create New Event") on the home dashboard that links to `/get-started?new=true`. This passes through the event type/role selection, then into the setup wizard with the `?new=true` flag so the guard doesn't block it.

### 4. GetStartedPage update
When accessed with `?new=true`, pass that param through to the setup redirect so the guard knows to allow it.

## Files Changed
- `src/pages/AuthPage.tsx` -- smart redirect after login
- `src/pages/ShowerSetupPage.tsx` -- guard + `?new=true` bypass
- `src/pages/RegistrySetupPage.tsx` -- guard + `?new=true` bypass
- `src/pages/HomePage.tsx` -- "Create New Event" button
- `src/pages/GetStartedPage.tsx` -- pass `?new=true` through

