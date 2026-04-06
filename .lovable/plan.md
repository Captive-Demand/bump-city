

# Setup Flows for Both Paths

## Problem
Right now, clicking "I'm planning a baby shower" or "I'm building a registry" immediately drops the user into the app with no setup. There's no information collection, no personalization, and no guided onboarding.

## Solution
Add a multi-step setup wizard for each path that collects key details before entering the main app.

---

## Shower Setup Flow (3 steps)

**Step 1 — Your Role**
- "Are you the expectant parent or planning for someone else?"
- Radio selection: Planner / Expectant Parent

**Step 2 — Event Details**
- Honoree name(s) (e.g. "Sarah & Mike")
- Due date (date picker)
- Event date (date picker, optional)
- City/location (text input, with Nashville highlighted for local features)
- Theme (optional text input)

**Step 3 — Gifting Preferences**
- Gift policy: "Bring a gift" / "No gifts please" / "Bring a book instead"
- Wrapping preference toggle (clear wrapping)
- Custom note (optional textarea)

→ On complete: save to context, navigate to shower dashboard

## Registry Setup Flow (2 steps)

**Step 1 — About You**
- Your name(s)
- Due date (date picker)
- City/location

**Step 2 — Registry Preferences**
- Registry name (auto-suggested from names)
- Gift policy preference
- Share link preference (public/private)

→ On complete: save to context, navigate to registry page

---

## Technical Plan

### New files
- `src/pages/ShowerSetupPage.tsx` — 3-step wizard with progress indicator
- `src/pages/RegistrySetupPage.tsx` — 2-step wizard with progress indicator

### Modified files
- `src/contexts/AppModeContext.tsx` — expand state to store setup data (role, names, dates, city, gifting prefs, etc.)
- `src/pages/HomePage.tsx` — change card clicks to navigate to `/setup/shower` or `/setup/registry` instead of directly entering the app
- `src/App.tsx` — add routes for `/setup/shower` and `/setup/registry`
- `src/pages/HomePage.tsx` (ShowerDashboard) — use stored names/dates from context instead of hardcoded "Sarah & Mike" and "August 15, 2025"

### UI approach
- Step indicator dots at top of each wizard
- One step visible at a time with "Next" / "Back" buttons
- Final step has a "Let's go!" CTA
- All inputs use existing shadcn components (Input, DatePicker, RadioGroup, Switch, Textarea)
- Validation: name and due date required, everything else optional

