

## Plan: Make Guest Registry Items Clickable with Product Links

The `registry_items` table already has `external_url` and `source` columns that aren't being fetched or displayed on the guest page.

### Changes — single file: `src/pages/GuestEventPage.tsx`

1. **Fetch `external_url` and `source`** — add them to the select query and the `RegistryItem` interface

2. **Make items clickable** — when `external_url` exists, wrap the item name/image in a link that opens in a new tab. Add a small "View Item" or external link icon so guests know it's tappable.

3. **Show source badge** — if `source` is set (e.g. "Amazon", "Target"), display it as a small text label under the item name for context

No database changes needed — all data already exists.

