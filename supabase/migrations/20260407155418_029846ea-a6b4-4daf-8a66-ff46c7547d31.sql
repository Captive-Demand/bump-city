ALTER TABLE public.events
  ADD COLUMN invite_template text,
  ADD COLUMN invite_title text,
  ADD COLUMN invite_message text;