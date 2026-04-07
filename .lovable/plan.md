

# Role System Overhaul

## Current State

Right now, the app has a fragmented role system:

- **`user_roles` table** — uses `app_role` enum with values: `admin`, `moderator`, `user`. Only used for admin panel access check via `has_role()`.
- **`profiles.role` column** — stores `planner` or `expectant-parent` (set during shower setup). Not connected to `user_roles`.
- **`event_members.role` column** — stores `guest` (default). Set when someone joins via invite code.
- **No "super admin" distinction** — admin is a flat role with no hierarchy.

These three systems don't talk to each other, and there's no unified way to determine what a user can see/do.

## Proposed Role Architecture

```text
┌─────────────────────────────────────────────┐
│  PLATFORM ROLES (user_roles table)          │
│  Controls app-wide access                   │
├─────────────────────────────────────────────┤
│  super_admin  — Full platform control,      │
│                 can promote admins           │
│  admin        — Manage vendors, community   │
│                 events, app settings         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  EVENT ROLES (event_members.role column)     │
│  Controls per-event access                  │
├─────────────────────────────────────────────┤
│  host         — Created the event, full     │
│                 control (was "planner")      │
│  co-host      — Can manage guests, registry │
│  honoree      — The expectant parent,       │
│                 limited in surprise mode     │
│  guest        — View event, RSVP, claim     │
│                 registry, make predictions   │
└─────────────────────────────────────────────┘
```

**Key insight**: Platform roles and event roles are separate concerns. A user can be a `guest` on one event and a `host` on another. Platform roles (`super_admin`/`admin`) are orthogonal.

## Implementation Steps

### 1. Database Migration

- Add `super_admin` to the `app_role` enum
- Update `event_members.role` to support: `host`, `co-host`, `honoree`, `guest`
- Remove `profiles.role` column (move logic to `event_members.role`)
- Update `has_role()` to handle super_admin (super_admin inherits admin)
- Auto-insert event creator as `host` in `event_members` during shower setup

### 2. Update Admin Panel (BC-014)

- Super admins see a "Manage Admins" tab to promote/demote users
- Regular admins see vendors, community events, settings only
- Update `AdminPage.tsx` to distinguish super_admin vs admin

### 3. Update Shower Setup Flow

- Replace `profiles.role` usage with `event_members` role assignment
- When user picks "I'm the expectant parent" → insert as `honoree` + `host`
- When user picks "I'm planning for someone else" → insert as `host`, optionally invite the honoree

### 4. Update Navigation & Permissions

- **Host/Co-host**: See full nav (guests, invites, planning, predictions, registry, gift tracker)
- **Honoree**: See home, registry, gift tracker, predictions (hide guest list & invites if surprise mode)
- **Guest**: See guest event page only (already works via `/event/:eventId`)
- **Admin/Super Admin**: See admin link in sidebar

### 5. Update AuthContext / AppModeContext

- Add a `useEventRole()` hook that returns the user's role for the current event
- Replace `mode` logic (shower/registry/choose) with role-based navigation
- Sidebar and bottom nav render tabs based on event role

### 6. RLS Policy Updates

- Co-hosts can manage guests, registry items for their event
- Honorees can view registry, manage gifts received, but not guest list in surprise mode
- Keep existing guest policies intact

## Files Changed

- **Migration**: alter `app_role` enum, update `event_members.role`, drop `profiles.role`, update `has_role()`
- **New hook**: `src/hooks/useEventRole.ts`
- **Modified**: `AuthContext.tsx` or `AppModeContext.tsx` — integrate event role
- **Modified**: `DesktopSidebar.tsx`, `BottomNav.tsx` — role-based tab rendering
- **Modified**: `ShowerSetupPage.tsx` — write to `event_members` instead of `profiles.role`
- **Modified**: `AdminPage.tsx` — super_admin vs admin distinction
- **Modified**: `HomePage.tsx` — role-aware dashboard

