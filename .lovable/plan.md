

# Self-Service Shopify Connection in Admin Settings

## Summary

Add a "Shopify Store" integration card to the Admin Settings tab so Tiffany (or any admin) can connect her own Shopify store directly from the app — no developer access needed.

## How It Works

1. **New `app_settings` row** — store the Shopify store domain (e.g. `bumpcity.myshopify.com`) and a Shopify Storefront Access Token as app settings. These are the two things needed to pull products/gift cards via the Storefront API.

2. **Admin Settings UI** — add an "Integrations" section to the Settings tab on the Admin page with:
   - A Shopify card showing connection status (connected / not connected)
   - Input fields for **Shopify store domain** and **Storefront Access Token**
   - A "Connect" / "Update" button that saves to `app_settings`
   - A "Disconnect" button that clears the values
   - Brief instructions telling the admin where to find the token in Shopify (Settings → Apps and sales channels → Develop apps → Storefront API)

3. **Database** — add two new rows to `app_settings`:
   - `shopify_store_domain` (value: empty by default)
   - `shopify_storefront_token` (value: empty by default)

4. **Edge function for Shopify API calls** — create `supabase/functions/shopify-proxy/index.ts` that reads the domain and token from `app_settings` and proxies Storefront API requests (products, gift cards). This keeps the token server-side.

## Technical Details

- **Migration**: Insert two new `app_settings` rows with keys `shopify_store_domain` and `shopify_storefront_token`
- **AdminPage.tsx**: Add an "Integrations" section inside the Settings tab with the Shopify connection form, visible to admins
- **Edge function**: A simple proxy that reads credentials from `app_settings` and forwards GraphQL queries to `https://{domain}/api/2024-01/graphql.json` with the storefront token
- No Lovable-level Shopify connector needed — this is a self-service flow using Shopify's public Storefront API

## Files Changed

- `supabase/migrations/` — new migration for `app_settings` rows
- `src/pages/AdminPage.tsx` — Shopify connection UI in Settings tab
- `supabase/functions/shopify-proxy/index.ts` — new edge function

