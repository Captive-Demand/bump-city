
-- Create public storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow anyone to view files (public bucket)
CREATE POLICY "Anyone can view uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add event image column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_image_url text;
