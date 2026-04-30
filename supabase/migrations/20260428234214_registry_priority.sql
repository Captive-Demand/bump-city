-- Add a "priority" flag to registry items so hosts can mark must-haves.
-- Guests see priority items first; sorting falls back to created_at.

alter table public.registry_items
  add column if not exists priority boolean not null default false;

create index if not exists registry_items_event_priority_idx
  on public.registry_items (event_id, priority desc, created_at);
