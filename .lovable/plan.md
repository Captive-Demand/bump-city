## Problem

The host edit controls (Edit Details button, Quick Settings card, Manage tiles, Delete button) are missing on the shower detail page even though the user is the event owner/host.

After investigating, there are two separate bugs causing this — both in how `isHost` is computed:

### Bug 1: Stale impersonation persists across pages

When an admin clicks "Preview as Guest" in the Admin panel, the role `"guest"` is saved to `sessionStorage` and used app-wide. The previous fix only clears it on `AdminPage` mount, but if the user is already on `/showers/:id` (or navigates there directly), the impersonated `guest` role overrides their real host role. The pencil/edit UI is gated by `isHost`, so it disappears.

The `ImpersonationBanner` should be visible when this happens, but if it isn't being noticed (small amber strip), the user just sees missing controls and reports them as a bug.

### Bug 2: `isHost` is computed against `activeEvent`, not the page's event

`ShowerDetailPage` shows the shower whose ID is in the URL (`event = allEvents.find(e => e.id === eventId)`), but `useEventRole()` derives `isHost` from `activeEvent` in `RoleContext`. When the URL event differs from the active event (e.g. on first navigation, or the user has multiple showers), `switchEvent(eventId)` is called in a `useEffect` — meaning during the first render after navigation, `isHost` is evaluated for the *previous* active event. If that previous event was one where the user is a guest (or null), the host UI is hidden.

## Fix

### 1. Make impersonation safe and visible

- In `ImpersonationBanner.tsx`: make the banner more prominent (taller, sticky at top) and add a clear "Stop preview" CTA, so the user always knows why their controls are missing.
- In `RoleContext.tsx`: when impersonation is active, **never downgrade an event owner**. Owners should always see host UI on their own showers regardless of impersonation. Impersonation should only affect non-owned events. (Alternative: keep impersonation global but change Admin's "Preview as guest" to require an explicit re-entry flow.)

Going with the simpler rule: **owners are always hosts on their own events**, even while impersonating. Admins who want to genuinely preview the guest experience can use the existing "Preview anonymous invite" button (opens a new tab without a session) — which already exists in AdminPage.

### 2. Per-event host derivation in `ShowerDetailPage`

Instead of relying on the global `isHost` (which is tied to `activeEvent`), compute host status directly on the page from the event being viewed:

```ts
const isOwner = !!user && event.user_id === user.id;
const isHost = isOwner || globalIsHost; // fallback for co-hosts via event_members
```

For co-hosts (who aren't owners), the existing `event_members` lookup is still needed. Add a small per-event role fetch in `ShowerDetailPage` so the page doesn't depend on `activeEvent` matching the URL.

### 3. Defensive cleanup

- Keep the `setImpersonatedRole(null)` on AdminPage mount.
- Also clear impersonation if the impersonating user is no longer an admin (e.g. role removed) — defensive, in `RoleContext`.

## Files to change

- `src/contexts/RoleContext.tsx` — owner is always treated as host even while impersonating; only apply impersonation to non-owned events.
- `src/pages/ShowerDetailPage.tsx` — derive `isHost` from the URL event (`event.user_id === user.id`) plus a per-event member-role fetch for co-hosts, instead of trusting global `isHost`.
- `src/components/layout/ImpersonationBanner.tsx` — make the banner more prominent so the user notices when preview mode is active.

## Out of scope

- No backend / RLS changes.
- No change to `ActiveEventContext` (keeps localStorage-backed active-event behavior).
- No change to the Admin "Preview as…" feature itself, just its side effects.
