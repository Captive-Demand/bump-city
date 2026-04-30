-- Personalization fields collected by the onboarding wizard.
-- These were previously stuffed into gift_preferences (JSONB) which is
-- functional but unqueryable and untyped — promoting them to real columns
-- so we can filter community feeds, vendor recommendations, etc.

alter table public.events
  -- Who created this event: the parent-to-be ("honoree") or someone planning
  -- on their behalf ("host").
  add column if not exists role text
    check (role in ('honoree', 'host')),

  -- The family-building path. Drives downstream copy (e.g. milestone tips
  -- adapt to adoption vs pregnancy timelines).
  add column if not exists journey text
    check (journey in ('pregnancy', 'adoption', 'surrogacy', 'trying')),

  -- Twins / triplets / etc. Off by default; toggled in the due-date step.
  add column if not exists multiples boolean not null default false,

  -- True = first-time parent. Null = not asked / opted out, so we don't
  -- conflate "no" with "didn't answer".
  add column if not exists first_time_parent boolean;

-- Backfill any rows that already encoded these in gift_preferences so
-- existing showers don't lose context. Only touches rows where the new
-- column is null and the JSONB key is present.
update public.events
   set role = (gift_preferences ->> 'role')
 where role is null
   and gift_preferences ? 'role'
   and (gift_preferences ->> 'role') in ('honoree', 'host');

update public.events
   set journey = (gift_preferences ->> 'journey')
 where journey is null
   and gift_preferences ? 'journey'
   and (gift_preferences ->> 'journey') in ('pregnancy', 'adoption', 'surrogacy', 'trying');

update public.events
   set multiples = (gift_preferences ->> 'multiples')::boolean
 where gift_preferences ? 'multiples'
   and (gift_preferences ->> 'multiples') in ('true', 'false');

update public.events
   set first_time_parent = (gift_preferences ->> 'first_time')::boolean
 where first_time_parent is null
   and gift_preferences ? 'first_time'
   and (gift_preferences ->> 'first_time') in ('true', 'false');

-- Indexes for the queries we'll actually run: filtering events by role
-- (e.g. "honoree-led showers in Nashville") and journey segmentation.
create index if not exists events_role_idx on public.events (role) where role is not null;
create index if not exists events_journey_idx on public.events (journey) where journey is not null;
