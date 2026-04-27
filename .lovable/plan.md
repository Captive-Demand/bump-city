## Goal
Connect Tiffany's existing Bump City Shopify store to the registry using Lovable's native Shopify integration — abandoning the manual custom-app/Storefront-token approach.

## Why switch
The current `shopify-proxy` edge function + manual token approach works, but:
- Requires Tiffany (or you) to navigate Shopify's complex Partner/custom-app UI
- Manual token copying is error-prone
- Doesn't handle token refresh or expanded features (cart, checkout, orders)

The native integration handles auth via Shopify's official OAuth flow — one click, no tokens to copy.

## Steps

### 1. Enable native Shopify integration (existing store)
- Trigger Lovable's Shopify enable flow with `store_type: existing`
- You'll be prompted to enter the Bump City Shopify admin URL (e.g. `bumpcitybaby.myshopify.com`)
- Shopify OAuth handles the rest — Tiffany approves once and we're connected

### 2. Migrate `ShopifyBrowser.tsx` to use the native client
- Replace the `supabase.functions.invoke("shopify-proxy", ...)` call with the native Shopify client provided by the integration
- Same product-listing GraphQL query, but via the supported SDK
- Keep the existing UI/UX (search bar, product grid, add-to-registry dialog) unchanged

### 3. Deprecate the manual `shopify-proxy` edge function and `app_settings` rows
- Leave the function in place for now (in case we need a quick rollback)
- Remove the "Shopify connection" config UI from `AdminPage.tsx` since it's no longer needed

### 4. Verify end-to-end
- Open the registry page → confirm Bump City products load
- Click a product → confirm "Add to Registry" still writes to `registry_items` with `source: "shopify"`
- Test search filtering works

### 5. Cleanup (optional, after confirmed working)
- Delete `shopify-proxy` edge function
- Drop unused `shopify_store_domain` / `shopify_storefront_token` rows from `app_settings`

## What you need to have ready
- Tiffany's Shopify admin URL (the `.myshopify.com` permanent URL — find it in Shopify admin Settings → Domains)
- Tiffany available for ~30 seconds to approve the OAuth permission prompt (or her login credentials if you're doing it for her)

## What this does NOT change
- The registry UI, the "Add to Registry" flow, the `registry_items` table, or guest-facing browsing — all stay identical
- The existing manual setup (custom app you started in Shopify Partners) can simply be ignored or deleted from Shopify later