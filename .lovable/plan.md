## Goal
Make the Registry page feel like a guided journey that **sells Bump City first**, then walks the user out to local picks, then anywhere on the web — instead of a wall of buttons and a redundant "Browse Bump City" CTA.

## What's confusing today
- Two separate "Browse Bump City" entry points (the small hero pill + a full-width button right below it) doing the exact same thing.
- The Bump City inline browser only appears *after* a click, and it's visually equal to all other options — Bump City doesn't feel like the headline.
- "All / Bump City / Local / Web" filter pills + category pills + "I'm Bringing" toggle all stack right next to each other → cognitively noisy.
- No sense of "step 1 → 2 → 3" so users don't know where to start.

## New design — a 3-step guided flow

Replace the current hero pills + redundant CTA bar with a numbered **stepper journey** at the top of the page. Each step is a card; the active step is expanded, the others are collapsed previews.

### Step 1 — Shop Bump City (default expanded, always first)
- Headline: **"Start with Bump City"** + sub: *"Tiffany's curated picks — added to your registry in one tap"*
- Renders the existing `BumpCityInlineBrowser` **inline, expanded by default** (no button to open it — it's just there).
- Category quick-chips at the top of this step (Nursery / Clothing / Toys / Feeding / Essentials) act as Shopify search filters, not just local-overrides.
- Small "✓ X items added from Bump City" counter appears as soon as the user adds one.
- "Continue → Add local favorites" link at the bottom that smooth-scrolls to Step 2 (does *not* hide Step 1 — user can come back).

### Step 2 — Add Local Favorites (collapsed card, expand on click)
- Headline: **"Add a local service or shop"** + sub: *"Doulas, night nurses, neighborhood boutiques"*
- Expands into the existing "Add Item" form inline (reuse current `addOpen` dialog content but rendered inline in the card).
- Defaults `category` to `Services` to nudge the right behavior.

### Step 3 — Add From Anywhere on the Web (collapsed card)
- Headline: **"Paste any product link"** + sub: *"Amazon, Target, anywhere — we'll grab the photo and price"*
- Expands into the URL-import flow inline (reuse current `urlOpen` content).

### Below the stepper: "Your Registry" section
- Progress bar (kept as-is).
- Source filter pills (kept, but moved here — they filter the *list*, not the *journey*).
- The 2-col item grid (kept as-is).

## File-by-file changes

### `src/pages/RegistryPage.tsx` (main work)
1. **Remove** the hero pills grid (lines ~407–426) and the standalone "Browse Bump City Store" button bar (lines ~428–436).
2. **Remove** the inline-browser-only-when-clicked gating; `BumpCityInlineBrowser` will render unconditionally inside Step 1.
3. **Remove** `shopifyOpen` state, `handleShopifyClick`, and the `bumpCityRef` scrolling logic (no longer needed — Step 1 is always visible).
4. **Add** a new `<RegistryJourney>` section composed of three numbered step cards:
   - Step 1 card always expanded → contains `<BumpCityInlineBrowser>`.
   - Step 2 + Step 3 cards collapsible (use `useState<"local"|"web"|null>(null)` for which is open). Clicking expands and smooth-scrolls into view.
5. **Inline** the contents of the `Add Item` and `Add from URL` `Dialog`s into Steps 2 and 3 (keep the Dialogs themselves around as-is for the header `+ Add` / `URL` buttons — power users still want them).
6. **Keep** progress bar, source filter pills, category pills, and item grid below the stepper, under a small heading **"Your Registry"**.
7. **Update** the empty state copy to say *"👇 Start with Step 1 below — Tiffany's picks"* instead of three competing buttons.
8. **Remove** the duplicate "Bump City" pill from the source filter row *only if* user has zero registry items (keep it once they have a mix, since it's then a useful filter).

### `src/components/registry/BumpCityInlineBrowser.tsx` (small polish)
- Remove its outer `<Card className="border-none bg-primary/5">` wrapper header ("Bump City Boutique" + blurb) since the parent Step 1 card already shows that title — avoids double-titling.
- Keep the search input and product grid.
- Add a "Showing top 24 — search to find more" hint under the search.

### Header buttons (top-right `+ Add` and `URL`)
- Keep both as quick-access for returning users; they open the same Dialogs as before. No change.

## Verification (manual, after implementation)
1. Land on `/registry` → Step 1 is expanded with Bump City products visible immediately, no extra clicks.
2. Add a Bump City product → toast + counter increments + item appears in "Your Registry" grid below.
3. Click Step 2 → inline form expands, default category = Services, can add a local item.
4. Click Step 3 → URL import form expands, paste a link, scrape, add.
5. Source filter pills below still work to filter the grid.
6. Mobile (≤430px): stepper cards stack cleanly, Bump City product grid stays 2-col, no horizontal overflow.

## Out of scope
- Cart/checkout flow (still external link to Shopify product page via `external_url`).
- Re-ordering the journey (Bump City is locked as Step 1 — that's the whole point).
- Persisting which step the user last had open across sessions.

## Risk
Low. Pure UI restructure of one page. All data flows (`registry_items` insert, `fetchItems`, scraping, image upload) are reused unchanged. Worst case: the Step 1 area is taller than today's collapsed view — acceptable since that's the goal (Bump City front and center).
