
-- Event members table: links users to events they've been invited to
CREATE TABLE public.event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.event_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Event owners can manage members
CREATE POLICY "Event owners can manage members"
  ON public.event_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_members.event_id AND events.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_members.event_id AND events.user_id = auth.uid()));

-- Users can insert themselves as members (for joining via invite)
CREATE POLICY "Users can join events"
  ON public.event_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Invite codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INT,
  use_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read invite codes (needed to validate)
CREATE POLICY "Authenticated users can read invite codes"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (true);

-- Event owners can manage invite codes
CREATE POLICY "Event owners can manage invite codes"
  ON public.invite_codes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = invite_codes.event_id AND events.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = invite_codes.event_id AND events.user_id = auth.uid()));

-- Update invite code use count function
CREATE OR REPLACE FUNCTION public.increment_invite_use(code_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  UPDATE public.invite_codes
  SET use_count = use_count + 1
  WHERE code = code_text
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR use_count < max_uses)
  RETURNING event_id INTO v_event_id;
  
  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  RETURN v_event_id;
END;
$$;

-- Allow guests to view event details for events they're members of
CREATE POLICY "Members can view event details"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid())
  );

-- Allow guests to view registry items for events they're members of  
CREATE POLICY "Members can view registry items"
  ON public.registry_items FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = registry_items.event_id AND event_members.user_id = auth.uid())
  );

-- Allow guests to claim registry items
CREATE POLICY "Members can claim registry items"
  ON public.registry_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = registry_items.event_id AND event_members.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = registry_items.event_id AND event_members.user_id = auth.uid()));

-- Allow guests to insert predictions for events they're members of
CREATE POLICY "Members can add predictions"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = predictions.event_id AND event_members.user_id = auth.uid()));

-- Allow guests to view predictions
CREATE POLICY "Members can view predictions"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = predictions.event_id AND event_members.user_id = auth.uid()));

-- Allow guests to view/update their own guest record
CREATE POLICY "Members can view guests"
  ON public.guests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.event_members WHERE event_members.event_id = guests.event_id AND event_members.user_id = auth.uid())
  );
