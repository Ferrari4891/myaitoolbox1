-- Create venue-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('venue-images', 'venue-images', true);

-- Create RLS policies for venue-images bucket
CREATE POLICY "Anyone can view venue images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'venue-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own venue images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'venue-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own venue images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'venue-images' AND auth.uid()::text = (storage.foldername(name))[1]);