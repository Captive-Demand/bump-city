

# Complete Remaining Backlog Items (No External Dependencies)

## Items to Complete

These 5 backlog items can be fully built without Twilio, Shopify, or any external API keys:

| Item | What's Missing |
|------|---------------|
| **BC-016** Host Reveal Flow | Predictions page needs a "Reveal Results" tab where the host enters actual results and the system picks winners |
| **BC-014** Admin CRUD | Admin page is a placeholder — needs real CRUD for registry items, vendors, and community events, protected by admin role |
| **BC-018** Admin Incentive Fields | Add an `app_settings` table and editable settings UI in admin (incentive values, reward amounts) |
| **BC-019** Admin Dashboard | Add stats section (user count, active events, registry stats) to admin page |
| **BC-011** Registry URL Import | Build a `scrape-url` edge function that fetches Open Graph metadata, plus an "Add from URL" button on the registry page |

BC-005 (Surprise Mode) already has the `surprise_mode` column on the `events` table, but the toggle UI and conditional hiding logic are missing — I'll include that too.

---

## Implementation Plan

### 1. Database Changes (single migration)

- Create `user_roles` table with `user_id` + `role` (enum: admin, moderator, user)
- Create `has_role()` security definer function for safe RLS checks
- Create `app_settings` table (single-row key/value config: `download_incentive_value`, `prediction_reward_amount`)
- Add RLS policies: admins can manage vendors, community_events, and app_settings; regular users read-only
- Seed default app_settings row

### 2. Admin Role System + Full CRUD Panel (BC-014, BC-018, BC-019)

Rewrite `AdminPage.tsx` with:
- **Dashboard tab**: query counts from events, profiles, registry_items tables to show stats
- **Registry Items tab**: table listing all Bump City Store / local service items with add/edit/delete
- **Vendors tab**: CRUD for vendor directory entries
- **Community Events tab**: CRUD for community events
- **Settings tab**: editable form for `app_settings` values (incentive amounts, reward values)
- Route protection: check `has_role(uid, 'admin')` — show "Access denied" if not admin

### 3. Host Reveal Flow (BC-016)

Add a "Results" tab to `PredictionsPage.tsx`:
- Host enters actual birth date, gender, weight, and name
- "Reveal Winners" button compares all predictions, scores them, marks `is_winner = true`
- Confetti animation on reveal
- Winner display with highlight badges

### 4. Scrape URL Edge Function + Registry UI (BC-011)

- Create `supabase/functions/scrape-url/index.ts` — fetches a URL, parses `og:title`, `og:image`, `og:description` from HTML
- Add "Add from URL" button on registry page — paste a product link, auto-populate name/image/price fields
- Deploy the edge function

### 5. Surprise Mode Toggle (BC-005)

- Add a "Surprise Mode" switch to the shower setup flow and to the home dashboard settings
- When enabled, conditional rendering hides shower details (date, location, theme) from the expectant parent's view based on their profile role

---

## Files Changed

- **New migration**: `user_roles` table, `has_role()` function, `app_settings` table, updated RLS for vendors/community_events
- **New edge function**: `supabase/functions/scrape-url/index.ts`
- **Rewritten**: `src/pages/AdminPage.tsx` (full CRUD + dashboard + settings)
- **Modified**: `src/pages/PredictionsPage.tsx` (add Results tab with reveal flow)
- **Modified**: `src/pages/RegistryPage.tsx` (add "Add from URL" feature)
- **Modified**: `src/pages/HomePage.tsx` (surprise mode conditional rendering)
- **Modified**: `src/pages/ShowerSetupPage.tsx` (surprise mode toggle)

