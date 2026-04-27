## Goal
Make Tiffany's Bump City Boutique products browsable and addable from the Registry page, now that the native Shopify integration is connected.

## Root cause
`RegistryPage.tsx` still gates the "Bump City Boutique" button behind a `shopifyConfigured` flag that checks two `app_settings` rows (`shopify_store_domain`, `shopify_storefront_token`). Those keys belonged to the **old** edge-function-proxy approach and were removed when we migrated to the native Lovable Shopify integration. So the flag is always `false` → button is permanently disabled → users can't open the product browser.

The browser itself (`ShopifyBrowser.tsx`) and `src/lib/shopify.ts` are already correctly wired to the native Storefront API — they just never get opened.

## Changes

### 1. `src/pages/RegistryPage.tsx` — remove stale gate
- Delete the `shopifyConfigured` state and its `useEffect` lookup against `app_settings`.
- Keep the `registry_intro_blurb` lookup (unrelated, still needed).
- Treat Shopify as **always available** (it is — the integration is connected at the project level):
  - Remove `disabled={!shopifyConfigured}` on both Bump City buttons (mobile category card + desktop "Browse Bump City" CTA).
  - Remove the `Tooltip` wrapper that says "Connect Shopify in Admin Settings".
  - Simplify `handleShopifyClick` to just `setShopifyOpen(true)`.

### 2. `src/lib/shopify.ts` — light hardening (optional but recommended)
- Current file hardcodes the domain and token. They're valid public Storefront values, so this works. No change strictly required, but I'll add a brief comment noting these come from the native integration so future-me doesn't try to "fix" them.

### 3. `src/pages/AdminPage.tsx` — sanity check
- Confirm we're no longer rendering the old manual "Shopify domain/token" inputs (last migration removed these). If any leftover references to `shopify_store_domain`/`shopify_storefront_token` remain, delete them.

### 4. Verification (no code, just checks)
- Open `/registry` → click "Bump City Boutique" → sheet opens → products load (1,297 available).
- Search "swaddle" → results filter.
- Click a product → "Add to Registry" → row inserted into `registry_items` with `source: "shopify"`, `image_url`, `external_url`, price.
- Item appears in the registry grid immediately (already wired via `onAdded={fetchItems}`).

## Out of scope
- Cart / checkout flow (registry uses external_url to send guests to Shopify product pages — no cart needed).
- Refactoring `shopify.ts` to fetch token dynamically from `shopify--get_storefront_token` at runtime (the hardcoded public token is fine and faster).
- Any UI redesign of the browser sheet.

## Risk
Very low — purely removing a broken gate. Worst case: button opens a sheet that errors loading products, in which case the existing error state in `ShopifyBrowser` handles it gracefully.