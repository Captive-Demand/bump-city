

# Reset Sent Invitations & Enable Resending

## What needs to happen

### 1. Reset invite status (immediate, one-time)
Run a data update to set `invite_sent = false` and `invite_sent_at = NULL` on all guests so you can test again.

### 2. Add a "Resend" UI affordance
Currently the send button is already functional for resending (the idempotency key includes `Date.now()`), but there's no visual distinction or confirmation when resending. Add a small confirmation dialog when a guest already has `invite_sent = true` to prevent accidental resends, with a clear "Resend Invite" label.

### Changes

**Database** — reset invite flags (via insert/update tool, not migration):
```sql
UPDATE guests SET invite_sent = false, invite_sent_at = NULL;
```

**`src/pages/GuestListPage.tsx`**:
- When clicking send on a guest with `invite_sent = true`, show a small confirm toast or dialog: "Resend invite to {name}?" before proceeding
- Update the button tooltip to say "Resend invite" when already sent
- No changes needed to the idempotency key — it already uses `Date.now()` so every send is unique

## Files Modified
- `src/pages/GuestListPage.tsx` — add resend confirmation UX

