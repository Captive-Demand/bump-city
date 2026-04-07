

## Plan: Implement 4 Community Features (Skip Bottom Nav)

Dropping the Community tab from the bottom nav as requested. Implementing the remaining 4 items:

### 1. City-based filtering + event images on Community page
**File: `src/pages/CommunityEventsPage.tsx`**
- Import `useEvent` to get the active event's city
- Filter query with `.eq("city", city)` when available
- Add `image_url` to the interface and render it in cards when present

### 2. Community Events card on dashboard
**File: `src/pages/HomePage.tsx`**
- Add a "Community Events" card after NextTasks section
- Fetch count of upcoming events for user's city
- Link to `/community`

### 3. Push notification opt-in during onboarding
**File: `src/pages/ShowerSetupPage.tsx`** (and `RegistrySetupPage.tsx`)
- Add a toggle/prompt asking to enable notifications for local events
- Save to `profiles.push_notifications`

**Database migration:** Add `push_notifications` boolean column (default `false`) to `profiles` table.

