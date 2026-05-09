-- Restrict the private 'storage' bucket to admin users only.
-- The bucket is not used by application code; only admins should manage its contents.

CREATE POLICY "Admins can read storage bucket objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'storage'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can upload storage bucket objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'storage'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update storage bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'storage'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'storage'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete storage bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'storage'
  AND public.has_role(auth.uid(), 'admin')
);