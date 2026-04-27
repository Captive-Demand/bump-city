## Goal

Reshape the app into **three main hubs**:

1. **Home** = main dashboard (walkthrough + quick actions + setup progress + shower blocks + "How it works")
2. **Showers** = dedicated hub for managing showers (settings, invitations, planning tools)
3. **Registry** = unchanged, already its own hub

Everything else (guests, invites, predictions, planning, gift tracker, vendors) stays as-is — just accessed from the Showers hub instead of crowding Home.

---

## Home (`/`) — main dashboard

Keep everything currently on Home, plus add a **"How it works"** strip near the top.

Order top → bottom:
1. Greeting header (avatar + name + bell) — kept
2. Event switcher (if >1 shower) — kept
3. **How it works** (NEW) — 3-step horizontal scroller: "1. Set up your shower → 2. Invite guests & build registry → 3. Track RSVPs & gifts". Compact, dismissible (stored in localStorage).
4. **Setup Progress** — kept
5. **Quick Actions** — kept (Send Invites, Add Registry, Predictions)
6. **Shower blocks** (NEW section title "Your Showers") — replaces the single EventCard. Lists all showers as cards. Each card: cover image, honoree name, date, days-to-go pill, "Open" → `/showers/:eventId`. Includes "+ Create new" tile at the end.
7. **Next Tasks** — kept
8. **Community** — kept

What gets removed from Home:
- The single big EventCard (becomes one of the shower blocks instead)
- The bottom "Create New Event" dashed button (folded into the shower blocks grid)

---

## Showers hub (`/showers` and `/showers/:eventId`)

### `/showers` (list view)
- Header: "Your Showers"
- Grid of all showers (same blocks as on Home, but bigger / more detail per card: honoree, date, city, guest count, registry %).
- "+ Create new shower" tile.

### `/showers/:eventId` (detail view) — the "shower hub"
On mount: calls `switchEvent(eventId)` so all sub-pages stay scoped.

Sections:
1. Back to `/showers`
2. **Hero**: cover image, honoree, date, city, days-to-go, "Edit details" button → `ShowerSetupPage`
3. **How it works for this shower** — 3-step mini guide ("Customize invite → Add guests → Build registry"), dismissible per-event.
4. **Quick settings** card — toggles surfaced inline:
   - Surprise mode
   - Registry private
   - Gift policy (bring-gift / registry-only / no-gifts)
   - "More settings" → `ShowerSetupPage`
5. **Invitation options** card — preview of current invite + buttons: "Edit invite" → `/invites`, "Share link" (existing ShareInviteButton), "Send to guests" → `/guests`.
6. **Manage tiles** grid (in-shower navigation):
   - Guests, Registry, Invites, Predictions, Planning, Gift Tracker, Vendors
   - Each tile shows a small stat (e.g., "12 guests", "8 items", "5 RSVPs"). Clicking routes to the existing page.
7. **Danger zone**: archive / delete shower.

---

## Routing & nav changes

**`src/App.tsx`**
- Add `/showers` → `ShowersListPage`
- Add `/showers/:eventId` → `ShowerDetailPage`

**`src/components/layout/BottomNav.tsx`** — update to reflect the three hubs:
- Home, **Showers** (NEW, replaces Invites), Registry, Predictions, Profile

(Invites and other tools remain reachable from the Showers hub and from existing direct routes.)

**`src/components/layout/DesktopSidebar.tsx`** — add "Showers" entry to match.

---

## Files touched

- edit: `src/App.tsx` — add 2 routes
- edit: `src/pages/HomePage.tsx` — add HowItWorks strip; replace single EventCard with `ShowerBlocksGrid`
- edit: `src/components/layout/BottomNav.tsx` — swap Invites → Showers
- edit: `src/components/layout/DesktopSidebar.tsx` — add Showers entry
- new: `src/pages/ShowersListPage.tsx`
- new: `src/pages/ShowerDetailPage.tsx`
- new: `src/components/home/HowItWorks.tsx` — reusable, takes a steps array + dismiss key
- new: `src/components/home/ShowerBlocksGrid.tsx` — grid of shower cards + create tile
- new: `src/components/shower/ShowerHero.tsx`
- new: `src/components/shower/QuickSettingsCard.tsx` — inline toggles, writes to `events` table
- new: `src/components/shower/InvitationOptionsCard.tsx`
- new: `src/components/shower/ManageTilesGrid.tsx` — with live stat counts

No DB schema changes. No edits to Registry, Guests, Invites, Predictions, Planning, Gift Tracker, Vendors pages — they continue to work against the active event.

---

## Assumptions (will use defaults unless you object)

- Bottom nav swap **Invites → Showers** (Invites still reachable from Showers hub and `/invites` URL).
- Sorting: Upcoming showers first (by `event_date` asc), then those without a date, then past.
- "How it works" dismiss state stored in `localStorage` (`bump_city_how_it_works_home_dismissed`, `bump_city_how_it_works_shower_<id>_dismissed`).
- No "past showers" segregation on Home — they just appear at the end of the grid with a muted style. Acceptable?
