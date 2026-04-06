

# Complete Bump City Backlog — Implementation Plan

## Status Check

**Already Done:** BC-001 (role selection), BC-002 (city/location), BC-003 (welcome screen), BC-004 (dashboard + countdown), BC-008 (gifting preferences — partial), BC-009 (guest list with RSVP), BC-024 (responsive design)

**Remaining: 18 items** — grouped into 5 phases below, ordered by dependency.

---

## Phase 1: Database + Auth Foundation
*Needed by almost every other feature*

- Create database tables: `profiles`, `events`, `registry_items`, `guests`, `predictions`, `activity_log`, `gifts_received`, `planning_tasks`, `vendors`, `community_events`
- Add user authentication (email signup/login) with auto-created profile
- Migrate all hardcoded data (registry items, guests) to database reads/writes
- RLS policies so users only see their own data

**Covers:** Foundation for BC-005 through BC-023

---

## Phase 2: Predictions Portal (BC-015, BC-016)
*Replace the current "party games" page with actual prediction forms*

- **BC-015:** Build prediction submission forms — due date picker, gender selector (boy/girl/surprise), baby name text input. Store per-guest in `predictions` table. Show a leaderboard of submissions.
- **BC-016:** Host reveal flow — host marks actual results, system identifies winners, displays results. Gift card delivery is a placeholder/manual step until Shopify is integrated.

---

## Phase 3: Invite Builder + SMS (BC-006, BC-007, BC-010)
*The invite creation and delivery pipeline*

- **BC-006:** New `/invites` page with an invite builder — editable title, date/time, location fields, theme selector dropdown, and cover image upload (stored in Cloud storage). Preview card rendered from the data.
- **BC-007:** Send invites via email using a backend function. SMS delivery via Twilio requires an API key setup — will scaffold the edge function and prompt for Twilio credentials. Track delivery status per guest.
- **BC-010:** Add explicit SMS opt-in checkbox (unchecked by default) to the guest add flow and RSVP form. Record opt-in in the `guests` table.

---

## Phase 4: Registry Enhancements (BC-011, BC-012, BC-013) + Gift Tracker (BC-020)

- **BC-011:** "Add from URL" feature on registry page — paste a product URL, edge function scrapes title/image/price via metadata, saves to `registry_items`.
- **BC-012:** "Bump City Store" category in registry — items managed by admin, tagged with a `source = 'bumpcity-store'` flag. Shopify link placeholder until integration is live.
- **BC-013:** "Local Services" section — curated items (doula, night nurse, etc.) from a `local_services` category, managed via admin panel.
- **BC-020:** New `/gift-tracker` page — log gifts received at the shower with donor name, item description, and thank-you note status (sent/pending). List view with filters.

---

## Phase 5: Planning Tools + Community (BC-005, BC-021, BC-022, BC-023)

- **BC-005 (Surprise Mode):** Toggle on planner's dashboard that hides shower details from the expectant parent's view. Uses a `surprise_mode` boolean on the `events` table + conditional rendering.
- **BC-021:** New `/planning` page with a task checklist — assignable tasks with due dates, completion checkboxes, overdue highlighting. Stored in `planning_tasks` table.
- **BC-022:** New `/vendors` page — Nashville vendor directory filterable by category (venues, balloons, cakes). Data from `vendors` table, seeded with sample Nashville vendors. Admin manages via admin panel.
- **BC-023:** Community events calendar on a `/community` page — opt-in push notifications scaffolded (service worker + permission prompt). Events from `community_events` table.

---

## Phase 6: Admin Panel (BC-014, BC-019, BC-018)

- **BC-014:** Admin CRUD panel at `/admin` for managing custom registry items (local services, Bump City store items). Protected by admin role check.
- **BC-019:** Admin dashboard showing user count, active showers, registry stats. Editable app settings (incentive amounts, etc.).
- **BC-018:** Admin fields for download incentive value and prediction reward amounts.

---

## Out of Scope for Lovable (require external work)

- **BC-017 (Download gift card):** Requires Shopify API integration for barcode generation. Will scaffold the edge function and UI, but needs Shopify credentials.
- **BC-025 (Native app wrappers):** iOS/Android WebView wrappers cannot be built in Lovable. Will ensure the PWA manifest is properly configured for "Add to Home Screen" as an interim solution.
- **BC-007 (SMS via Twilio):** Edge function scaffolded, but requires Twilio API credentials to actually send.

---

## Files Summary

**New pages:** InviteBuilderPage, GiftTrackerPage, PlanningPage, VendorDirectoryPage, CommunityEventsPage, AdminPage, AuthPage, ResetPasswordPage

**New components:** InvitePreview, PredictionForm, PredictionLeaderboard, TaskChecklist, VendorCard, GiftLogForm, AdminItemEditor, AuthForm

**Modified pages:** PredictionsPage (full rewrite), ProfilePage (use context data), RegistryPage (database-backed), GuestListPage (database-backed), HomePage (add planning tasks section)

**Database migrations:** ~10 tables with RLS policies

**Edge functions:** `scrape-url` (registry URL import), `send-invite` (email/SMS delivery)

---

## Recommended Build Order

I suggest tackling these in the phase order above. Phase 1 (database + auth) is the foundation everything else depends on. After that, Phases 2-5 can be built incrementally. Want me to start with Phase 1?

