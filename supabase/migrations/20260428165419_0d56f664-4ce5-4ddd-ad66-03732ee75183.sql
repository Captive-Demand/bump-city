-- Add total_budget column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_budget numeric DEFAULT 0;

-- Budget line items
CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  label text NOT NULL,
  estimated_cost numeric NOT NULL DEFAULT 0,
  actual_cost numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage budget items"
ON public.budget_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members view budget items"
ON public.budget_items FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  is_event_member(auth.uid(), event_id)
);

CREATE INDEX IF NOT EXISTS budget_items_event_idx ON public.budget_items(event_id);

-- Potluck items
CREATE TABLE IF NOT EXISTS public.potluck_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'Food',
  label text NOT NULL,
  quantity_needed integer NOT NULL DEFAULT 1,
  claimed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.potluck_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage potluck items"
ON public.potluck_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members view potluck items"
ON public.potluck_items FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  is_event_member(auth.uid(), event_id)
);

CREATE POLICY "Members can claim potluck items"
ON public.potluck_items FOR UPDATE
TO authenticated
USING (is_event_member(auth.uid(), event_id))
WITH CHECK (is_event_member(auth.uid(), event_id));

CREATE INDEX IF NOT EXISTS potluck_items_event_idx ON public.potluck_items(event_id);

-- Event vendors (per-event vendor selection / status)
CREATE TABLE IF NOT EXISTS public.event_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vendor_id uuid,
  name text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'contacted',
  notes text,
  cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage event vendors"
ON public.event_vendors FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members view event vendors"
ON public.event_vendors FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  is_event_member(auth.uid(), event_id)
);

CREATE INDEX IF NOT EXISTS event_vendors_event_idx ON public.event_vendors(event_id);