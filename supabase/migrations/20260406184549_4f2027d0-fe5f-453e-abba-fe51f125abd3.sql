
DROP POLICY "Anyone can insert predictions" ON public.predictions;
CREATE POLICY "Anyone can insert predictions with guest name" ON public.predictions FOR INSERT WITH CHECK (guest_name IS NOT NULL AND guest_name <> '');
