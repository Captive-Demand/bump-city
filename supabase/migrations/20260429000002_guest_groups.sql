-- Guest groups: lets hosts mentally segment guests (family / friends / coworkers
-- / partner) for at-a-glance scanning, filtering, and templated group messages.
--
-- Stored as a free-text label rather than an enum so users can add custom
-- groups (e.g. "book club") later without another migration. The UI presents
-- a curated list of presets and allows arbitrary custom values.

alter table public.guests
  add column if not exists group_label text;

-- Partial index for the common query: list all guests in a given group for
-- an event (used by group-message composer + filter row).
create index if not exists guests_event_group_idx
  on public.guests (event_id, group_label)
  where group_label is not null;
