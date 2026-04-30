-- Add user_id to predictions so we can detect "this person already played"
-- without relying on fuzzy display-name matching. Nullable so anonymous
-- guests can still predict via the public invite link.
--
-- Pairs with logic in PredictionsPage that:
--   1. Auto-fills guest_name from the logged-in user's display_name
--   2. Loads the user's existing prediction (if any) and shows an edit view
--   3. Prevents accidental duplicate submissions

alter table public.predictions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Index to speed up the per-user lookup that runs on every page load.
create index if not exists predictions_event_user_idx
  on public.predictions (event_id, user_id)
  where user_id is not null;
