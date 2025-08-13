-- Create venues table for approved venues
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  google_maps_link TEXT,
  facebook_link TEXT,
  image_1_url TEXT,
  image_2_url TEXT, 
  image_3_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create policies for venue access
CREATE POLICY "Anyone can view approved venues" 
ON public.venues 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Authenticated users can submit venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view their own submissions" 
ON public.venues 
FOR SELECT 
USING (auth.uid() = submitted_by);

CREATE POLICY "Admins can manage all venues" 
ON public.venues 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON public.venues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();