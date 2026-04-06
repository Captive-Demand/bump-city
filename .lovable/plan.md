

# Tiffany's Requested Changes from Wireframe Review

Based on the kickoff conversation, here are the changes Tiffany (Bump City) requested while reviewing the wireframes, and how they map to updates in the current app.

---

## Changes to Implement

### 1. Rename "Games" to "Predictions" (or "Prediction Portal")
Tiffany explicitly said "Games" feels wrong for what are really predictions and crowdsourcing activities. She suggested "Prediction Portal" or similar premium-sounding language. This affects:
- Bottom nav tab label and icon
- GamesPage header and content
- HomePage quick actions card
- Route path (optionally `/predictions` instead of `/games`)

### 2. Two User Roles at Onboarding
Users should identify as either a **planner** (planning for someone else) or the **expectant parent** (planning for themselves / managing registry). The experience adapts based on selection:
- Planner sees: invite builder, event planning tools, vendor directory
- Expectant parent sees: registry management, gift tracker
- Both can see: community events, predictions
- Add an onboarding flow screen after signup with role selection

### 3. Add Gifting Settings to RSVP/Event Config
Tiffany wants gifting preferences on the invite/RSVP settings (not just dietary restrictions):
- "Bring a gift" / "No gifts please" / "Bring a book instead"
- Wrapping preferences (e.g., clear wrapping)
- Custom gifting notes
- Add these options to the event settings or a new RSVP settings section on ProfilePage

### 4. Location-Based Experience (Nashville-first)
- Add city/location selection during onboarding
- Nashville users get full vendor directory and local resources
- Non-Nashville users get core features (registry, invites, predictions) but limited local content
- Drop "Nashville" from branding — just "Bump City"

### 5. Vendor Directory for Event Planning
- Local vendors for baby showers: balloons, cakes, event spaces, photographers
- Separate from registry service providers (night nurses, doulas, etc.)
- Nashville-specific initially, expandable later
- Add a vendors/resources section within the event planning area

### 6. Gift Tracker
Tiffany loved the gift tracker concept — log who gave what at the shower, track shipped items:
- Scan/log gifts received
- Track thank-you note status
- Add as a feature within the registry or as its own section

### 7. Download Incentive with Barcode/Gift Card
- Show a redeemable coupon/barcode upon app download
- Integrates with Shopify gift cards
- Admin can customize the incentive amount
- Same mechanism for prediction game winners (gift card rewards)

### 8. Community Events Calendar
- Bump City store events, partner brand events, free classes
- Users opt in to push notifications for events
- Tied to location selection (Nashville gets Bump City events)

### 9. Admin Panel (for Tiffany)
- Manage custom registry items (local vendor offerings)
- Update download incentive/rewards
- Upload vendor lists
- Manage community event calendar

---

## Proposed Implementation Order

**Phase A — Quick UI updates (current sprint):**
1. Rename "Games" tab/page to "Predictions" everywhere
2. Add gifting settings UI to the profile/event settings page
3. Update HomePage to reflect new terminology

**Phase B — Onboarding & Roles:**
4. Build onboarding flow with role selection (planner vs. parent)
5. Add location/city selection screen
6. Conditionally show/hide features based on role

**Phase C — New Features:**
7. Gift tracker page/section
8. Vendor directory (event planning vendors)
9. Community events calendar
10. Download incentive/coupon screen

**Phase D — Backend & Admin:**
11. Admin panel for managing vendors, incentives, custom registry items
12. Shopify gift card integration
13. Push notification opt-in flow

---

## Technical Details

### Files to modify immediately (Phase A):
- `src/components/layout/BottomNav.tsx` — rename "Games" tab to "Predictions", swap icon
- `src/pages/GamesPage.tsx` — rename to `PredictionsPage.tsx`, update header text
- `src/pages/HomePage.tsx` — update quick actions label from "Games" to "Predictions"
- `src/App.tsx` — update route from `/games` to `/predictions`
- `src/pages/ProfilePage.tsx` — add gifting settings section

### New files for Phase B:
- `src/pages/OnboardingPage.tsx` — role selection + city selection
- `src/components/onboarding/RoleSelector.tsx`
- `src/components/onboarding/CitySelector.tsx`

### New files for Phase C:
- `src/pages/GiftTrackerPage.tsx`
- `src/pages/VendorDirectoryPage.tsx`
- `src/pages/CommunityEventsPage.tsx`
- `src/components/registry/GiftingSettings.tsx`

