-- Create venue-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for venue images
CREATE POLICY "Anyone can view venue images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'venue-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their venue images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'venue-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their venue images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'venue-images' AND
  auth.uid() IS NOT NULL
);