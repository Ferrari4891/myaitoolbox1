-- Create ratings table for venue ratings
CREATE TABLE public.venue_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(venue_id, user_id)
);

-- Enable RLS
ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for venue ratings
CREATE POLICY "Anyone can view venue ratings" 
ON public.venue_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert their own ratings" 
ON public.venue_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.venue_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.venue_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_venue_ratings_updated_at
BEFORE UPDATE ON public.venue_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to venues table for rating aggregates
ALTER TABLE public.venues 
ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Create function to update venue rating aggregates
CREATE OR REPLACE FUNCTION public.update_venue_rating_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the venue's average rating and count
    UPDATE public.venues 
    SET 
        average_rating = COALESCE((
            SELECT ROUND(AVG(rating::decimal), 1) 
            FROM public.venue_ratings 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        ), 0),
        rating_count = COALESCE((
            SELECT COUNT(*) 
            FROM public.venue_ratings 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        ), 0)
    WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update aggregates
CREATE TRIGGER update_venue_aggregates_on_insert
    AFTER INSERT ON public.venue_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_venue_rating_aggregates();

CREATE TRIGGER update_venue_aggregates_on_update
    AFTER UPDATE ON public.venue_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_venue_rating_aggregates();

CREATE TRIGGER update_venue_aggregates_on_delete
    AFTER DELETE ON public.venue_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_venue_rating_aggregates();