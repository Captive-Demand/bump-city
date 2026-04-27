# Tonight's Build Plan — Bump City "Ready for Tiffany"

We'll execute the 13 prompts in the priority order you laid out (1 → 4 → 3 → 2 → 5 → 6 → 7 → 8-13). Each block is independently shippable so we can stop at any point and still have a coherent app. All work preserves existing `event_type=registry` data.

---

## 🔴 P0 — Strategic & Visual Foundation

### 1. Shower-first re-architecture (Prompt 1)
- **`GetStartedPage.tsx`**: Remove Step 0 (event type selector). Single step = role selection. Always sets `eventType=shower`, always routes to `/setup/shower`. Update heading to **"Let's plan your baby shower"** with subtext **"We'll handle invites, registry, predictions, and everything in between."** Remove `StepDots` (only one step).
- **`HomePage.tsx`**: Remove `ModeChooser`. If `mode === "choose"` and no active event → `<Navigate to="/get-started?new=true" replace />`.
- **`AppModeContext.tsx`**: Default mode stays `"shower"`. Keep `"registry"` in the union for backward-compat with existing rows but don't allow new selection.
- **`App.tsx`**: Delete `/setup/registry` route + import. Delete `src/pages/RegistrySetupPage.tsx`.
- Grep for any `navigate("/setup/registry")` calls and redirect to `/setup/shower`.
- **No DB changes** — existing registry-type events still load via `ActiveEventContext` and render the registry pages.

### 2. Shopify integration (Prompt 4)
- **`src/components/registry/ShopifyBrowser.tsx`** (new): On mount, calls `supabase.functions.invoke("shopify-proxy", { body: { query, variables: { first: 24, query: searchTerm } } })` with the verbatim GraphQL query you provided. 2-col card grid, search input (debounced, re-queries with `query` param), product detail modal (Dialog) with full description/images/variants, "Add to Registry" button that inserts into `registry_items` with `source: "shopify"`, `external_url: node.onlineStoreUrl`, `image_url: node.featuredImage.url`, `price: node.priceRange.minVariantPrice.amount`, `name: node.title`.
- **`RegistryPage.tsx`**: Add a third "Browse Bump City Store" button alongside URL import + manual add. Opens a full-screen `Sheet` containing `<ShopifyBrowser />`.
- **Setup-state check**: Read `app_settings` rows for `shopify_store_domain` + `shopify_storefront_token` once on page mount. If missing → button is disabled with tooltip "Connect Shopify in Admin Settings."
- **`AdminPage.tsx`** Settings tab: Add "Test Connection" button next to existing Shopify fields. Calls `shopify-proxy` with `query { shop { name } }` and renders ✅ green check + shop name OR ❌ red X + error message.

### 3. Registry homepage visual redesign (Prompt 3)
- **Hero section** above filters in `RegistryPage.tsx`: 3 differentiator cards in a row (mobile: stack/scroll; desktop: 3-col grid):
  - 🛍 **Bump City Boutique** — "Curated from our local Shopify store"
  - 💆 **Local Services** — "Night nurses, doulas, prenatal massage"
  - 🌐 **Anywhere on the Web** — "Paste any URL"
- **Source filter tabs** above category tabs: `All | Bump City | Local | Web` filtering by `registry_items.source` (`shopify` / `local` / `web`+`manual`).
- **Empty state** when 0 items: friendly card "Your registry is just getting started" + 3 CTAs (Browse Bump City Store, Add from URL, Add Local Service).
- **Item grid upgrade**: 2-col mobile grid, larger square images, `rounded-2xl`, hover lift (`hover:-translate-y-1 transition-all`), source badge chip top-right of each card (`BUMP CITY` / `LOCAL` / `WEB`).
- **Progress bar** above grid: read total + claimed counts, render `<Progress>` (h-3, gradient primary→mint) with label "Registry Progress — X of Y items claimed".
- **Intro blurb**: Read `app_settings` key `registry_intro_blurb`; fallback "Curated by Bump City. Built for real life. Add anything from anywhere."

### 4. Jost font swap (Prompt 2)
- **`index.html`**: Replace existing Google Fonts `<link>`s with single Jost weights 400-800 import.
- **`src/index.css`**: Remove `@import` for Nunito/Quicksand/Playfair/Cormorant. Update `body` and heading rules to `font-family: 'Jost', system-ui, sans-serif;`. Remove the second top-of-file `@import url(...)`.
- **`tailwind.config.ts`**: Set `theme.extend.fontFamily.sans = ["Jost", "system-ui", "sans-serif"]` (and remove any custom `serif`/`display` keys we no longer need).
- **Email templates** (`supabase/functions/_shared/email-templates/*.tsx` + `transactional-email-templates/shower-invitation.tsx`): Replace `'Nunito', 'Quicksand', Arial, sans-serif` with `'Jost', Arial, sans-serif`. Inline `<style>` blocks too.

---

## 🟠 P1 — Usability & Tiffany's explicit asks

### 5. Bottom nav with 5 key tabs (Prompt 5)
- Update **`BottomNav.tsx`**: Exactly 5 tabs in order — Home (`/`), Registry (`/registry`), Invites (`/invites`), Predictions (`/predictions`), Profile (`/profile`). Each is icon (`lucide-react` Home/Gift/Send/Sparkles/User) + small label. Active = `text-primary`, inactive = `text-muted-foreground`. Use `useLocation()`.
- **Hide nav** on `/auth`, `/get-started`, `/setup/shower`, `/reset-password`, plus respect existing `hideNav` prop. Update `MobileLayout.tsx` logic accordingly (already supports `hideNav`).
- Mirror the same 5 items in **`DesktopSidebar.tsx`** with active states.

### 6. Progress bars across shower flow (Prompt 6)
- **`ShowerSetupPage.tsx`**: Replace `StepDots` with full-width `<Progress>` bar + caption "Step N of M — {stepName}".
- **`HomePage.tsx`**: New "Setup Progress" card between EventCard and QuickActions. Compute 5 milestones (event details, invite designed = `invite_image_url`, guests added, registry started, first invites sent = any `guests.invite_sent=true`). Show `<Progress>` + checklist with ✅/⚪ icons.
- **`RegistryPage.tsx`**: Bump existing claim progress bar to `h-3`, add label "Registry Progress" above, gradient fill primary→mint via inline style on indicator.

### 7. Gift claiming UX (Prompt 7)
- **`RegistryPage.tsx`**: When `claimed=true`, show "Claimed by {claimed_by}" prominently in card footer with small `Avatar` initial circle.
- **"Gifts I'm Bringing" filter chip**: Filter `registry_items` where `claimed_by === profile.display_name` (current user). Toggle chip in source-filter row.
- **`GiftTrackerPage.tsx`**: New stats row at top — 4 stat cards: Total claimed, Estimated value (sum of price), Thank-yous pending, Thank-yous sent (from `gifts_received.thank_you_sent`).
- **`GuestEventPage.tsx`**: When a guest claims an item, also `insert` into `gifts_received` with `donor_name = guest's name`, `item_description = item.name`, `event_id`, `user_id = event.user_id`. Use try/catch so failures don't break claim.

---

## 🟡 P2 — Polish (ship if time)

### 8. Multi-select gift preferences (Prompt 8)
- **Migration**: `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gift_preferences JSONB DEFAULT '{}'::jsonb;`
- **`ShowerSetupPage.tsx`** & **`ProfilePage.tsx`**: Replace `RadioGroup` with `Checkbox` group of 6 options storing as JSONB `{ bring_gift, bring_book, no_gifts, clear_wrapping, ship_to_home, bring_to_event }`. Keep writing legacy `gift_policy` + `clear_wrapping` for back-compat.
- **`RegistryPage.tsx`** + **`ProfilePage.tsx`**: Render active prefs as badge chips at top.

### 9. Vendor referral & discount codes (Prompt 9)
- **Migration**: Add `referral_code TEXT`, `discount_code TEXT` to `vendors`.
- **`AdminPage.tsx`** Vendors form: Two new inputs.
- **`VendorDirectoryPage.tsx`**: Show only `discount_code` publicly with a "Tap to copy" button (writes to clipboard, toast). Never render `referral_code`.

### 10. SMS opt-in compliance (Prompt 10)
- **Migration**: Add `profiles.sms_opt_in BOOLEAN NOT NULL DEFAULT false`, `profiles.email_notifications BOOLEAN NOT NULL DEFAULT true`.
- **`AuthPage.tsx`** signup: Explicit unchecked SMS consent checkbox + ToS link → save to `profiles.sms_opt_in`.
- **`ProfilePage.tsx`**: Split notifications switch into 3 (Email default true, SMS default false, Push default false).
- **One-time post-event-creation modal**: After first event insert, show "Want SMS updates?" dialog. Persist a `localStorage` flag so it doesn't repeat.

### 11. Twilio SMS wiring (Prompt 11)
- **`GuestListPage.tsx`**: When sending invite to guest with `phone` AND `sms_opt_in=true`, also `supabase.functions.invoke("send-sms", { body: { to, message } })`. Message: "You're invited to {Honoree}'s baby shower! RSVP here: {rsvp_url}".
- New **"Send SMS reminder"** bulk action: Filters attending + opted-in + has phone, sends reminder copy.
- **`AdminPage.tsx`** Twilio card: "Send Test SMS" button → small dialog → invoke `send-sms` with test message.
- Hard guard everywhere: skip any guest without `sms_opt_in=true`.

### 12. Login/logout polish (Prompt 12)
- **`ProfilePage.tsx`**: New top "Account" card with avatar, name, email, prominent outline-destructive Sign Out button.
- **`MobileLayout.tsx`** / Profile tab: Show "Set up your shower" badge if no event exists yet.
- **AuthContext signOut**: Redirect to `/auth` (not `/get-started`).
- **`AuthPage.tsx`**: Footer link "New to Bump City? Get started" → `/get-started`.

### 13. Final visual polish pass (Prompt 13)
- Audit headers for Jost + consistent size hierarchy (`text-2xl font-bold` page titles, `text-lg font-semibold` sections).
- Cards → `rounded-2xl border-none shadow-sm` site-wide.
- Primary buttons → `rounded-xl h-11 font-semibold`.
- Empty states → friendly icon + CTA pattern.
- 375px viewport sweep — fix any horizontal scroll / clipped buttons.
- Add "Powered by Bump City" footer on `GuestEventPage.tsx`.
- Verify `--primary: 0 46% 71%` stays in `index.css`.

---

## 📋 Migration Summary (single batched migration where possible)
```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gift_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;
```

## ⚠️ Risks & Mitigations
- **Backward compat**: We keep `event_type='registry'` rows readable, keep legacy `gift_policy`/`clear_wrapping` columns, keep `mode="registry"` in the type union.
- **Shopify failure modes**: Browser handles 400/empty-credential responses gracefully (shows "Connect Shopify" CTA inline).
- **SMS compliance**: All sends gated on `sms_opt_in=true` + presence of phone; no defaults flipped to true anywhere.
- **Big diff surface**: We'll commit in the 13 logical chunks above so each is reviewable.

## ✅ Stop-points
If we run short on time, every numbered section above is independently shippable. Sections 1-7 cover everything Tiffany explicitly flagged + the Vincent direction.
