
-- Public read access for invited guests (no account required)
CREATE POLICY "Public can view event invite details"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view registry items"
  ON public.registry_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view predictions"
  ON public.predictions
  FOR SELECT
  TO anon, authenticated
  USING (true);
