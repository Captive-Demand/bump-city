# Role-Based Access Audit

## Current State

**Infrastructure exists, but is barely used in the UI.**

- `useEventRole()` hook works and returns `isHost`, `isHonoree`, `isGuest`, `isAdmin`.
- Database RLS is solid (hosts manage events/guests/registry; members can view; predictions are open for guest submission).
- Two distinct guest experiences already exist:
  - **`/event/:eventId`** (`GuestEventPage`) — clean public-style guest view with Registry / Predict / Details tabs. This is what guests get from an invite link.
  - **`/`, `/showers`, `/registry`, `/guests`, `/planning`, `/gift-tracker`, `/predictions`, `/invites`** — the full host app.

**The actual problem:** `useEventRole` is only consumed in **2 files** (`AdminPage`, `DesktopSidebar` — and only for the admin badge). Every host-only screen is reachable by any logged-in user, and the nav shows the same links to everyone.

## What Needs Setup

### 1. Navigation gating (Sidebar + BottomNav)
Currently both navs show the same 5–11 tabs to everyone.
- **Hosts/Co-hosts** should see: Home, Showers, Registry, Invites, Guests, Planning, Gifts, Guess & Win, Vendors, Profile.
- **Guests/Honorees** should see a slimmed view: Home, Registry, Guess & Win, Profile (no Invites, Guests, Planning, Gift Tracker).
- **Admin** tab continues to be admin-only (already works).

### 2. Page-level guards
For host-only pages, redirect non-hosts to `/` (or to their guest event view). Add a small `<HostOnly>` wrapper that uses `useEventRole`:
- `/guests` (GuestListPage) — host-only
- `/invites` (InviteBuilderPage) — host-only
- `/gift-tracker` (GiftTrackerPage) — host-only
- `/planning` (PlanningPage) — host-only

### 3. In-page control gating
- **PredictionsPage** — hide the "Reveal Winners" host controls (date, gender, name, weight inputs + Reveal button) behind `isHost`. Guests still see the leaderboard / their own prediction form.
- **RegistryPage** — hide "Add item", "Edit", "Delete" controls for guests; keep Claim available.
- **ShowerDetailPage** — hide edit/delete event actions for non-hosts.

### 4. Honoree special case (Surprise Mode)
Already handled by `surprise-mode` feature for the honoree's own view. Leave as-is, but ensure honorees use the same gated nav as guests (no Guest List, no Invites).

## Technical Implementation

**New files:**
- `src/components/auth/HostOnly.tsx` — wrapper that returns `<Navigate to="/" />` if `!isHost && !isAdmin` (waits for `loading`).

**Edits:**
- `src/components/layout/BottomNav.tsx` — filter `tabs` based on `useEventRole`.
- `src/components/layout/DesktopSidebar.tsx` — split `secondaryTabs` into host-only vs everyone, filter by role.
- `src/App.tsx` — wrap `/guests`, `/invites`, `/gift-tracker`, `/planning` routes with `<HostOnly>`.
- `src/pages/PredictionsPage.tsx` — wrap "Reveal Winners" card in `{isHost && (...)}`.
- `src/pages/RegistryPage.tsx` — gate add/edit/delete buttons behind `isHost`.
- `src/pages/ShowerDetailPage.tsx` — gate management actions behind `isHost`.

**No DB changes needed** — RLS is already correct.

## What This Won't Do
- Won't change the `/event/:eventId` invited-guest experience (it's already correct).
- Won't restructure the data model or roles.
- Won't add a role-management UI for hosts to promote co-hosts (separate feature if you want it).

Approve and I'll implement in this order: HostOnly wrapper → nav filtering → route guards → in-page control gating.
