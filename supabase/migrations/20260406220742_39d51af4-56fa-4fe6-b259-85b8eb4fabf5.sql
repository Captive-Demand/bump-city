
-- Create a security definer function to check event membership without recursion
CREATE OR REPLACE FUNCTION public.is_event_member(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_members
    WHERE user_id = _user_id AND event_id = _event_id
  )
$$;

-- Drop the recursive policy on events
DROP POLICY IF EXISTS "Members can view event details" ON public.events;

-- Recreate using the security definer function
CREATE POLICY "Members can view event details"
ON public.events FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_event_member(auth.uid(), id)
);

-- Fix event_members policies that reference events
DROP POLICY IF EXISTS "Event owners can manage members" ON public.event_members;

CREATE POLICY "Event owners can manage members"
ON public.event_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_members.event_id
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_members.event_id
    AND events.user_id = auth.uid()
  )
);
