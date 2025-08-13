-- Fix the search_path security warnings by updating existing functions
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Call the edge function asynchronously (fire and forget)
  PERFORM net.http_post(
    url := 'https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'email', user_email,
      'displayName', COALESCE(NEW.display_name, 'New Member')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_venue_rating_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;