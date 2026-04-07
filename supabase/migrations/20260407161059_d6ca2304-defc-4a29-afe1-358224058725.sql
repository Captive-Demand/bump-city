-- Allow authenticated users to upload to the invites folder
CREATE POLICY "Users can upload invites"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'invites');