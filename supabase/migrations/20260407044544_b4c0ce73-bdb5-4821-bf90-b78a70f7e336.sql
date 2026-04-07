
-- 1. Fix invite_codes: replace overly broad SELECT policy with owner-scoped
DROP POLICY IF EXISTS "Authenticated users can read invite codes" ON public.invite_codes;
CREATE POLICY "Event owners can read invite codes"
  ON public.invite_codes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = invite_codes.event_id
        AND events.user_id = auth.uid()
    )
  );

-- 2. Fix predictions: tighten anonymous insert policy to validate event exists
DROP POLICY IF EXISTS "Anyone can insert predictions with guest name" ON public.predictions;
CREATE POLICY "Anyone can insert predictions for valid events"
  ON public.predictions FOR INSERT TO public
  WITH CHECK (
    guest_name IS NOT NULL
    AND guest_name <> ''
    AND EXISTS (SELECT 1 FROM public.events WHERE id = predictions.event_id)
  );

-- 3. Fix storage upload path: add ownership check to INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Fix guests PII: restrict member view to non-sensitive columns via a view approach
-- Instead, tighten the policy so only event owners can see all guest data
DROP POLICY IF EXISTS "Members can view guests" ON public.guests;
CREATE POLICY "Members can view guest names and status"
  ON public.guests FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.event_members
      WHERE event_members.event_id = guests.event_id
        AND event_members.user_id = auth.uid()
        AND event_members.role IN ('host', 'co-host')
    )
  );
