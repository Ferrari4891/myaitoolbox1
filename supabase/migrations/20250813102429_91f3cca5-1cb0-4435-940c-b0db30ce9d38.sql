-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_venue_rating_aggregates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;