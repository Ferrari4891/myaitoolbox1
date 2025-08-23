-- Create venues table with cuisine types for restaurants
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  description TEXT,
  venue_type TEXT NOT NULL CHECK (venue_type IN ('coffee_shop', 'restaurant')),
  cuisine_types TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  hours TEXT,
  features TEXT[],
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create cuisine_types table for admin management
CREATE TABLE public.cuisine_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_types ENABLE ROW LEVEL SECURITY;

-- Create policies for venues
CREATE POLICY "Anyone can view approved venues" 
ON public.venues 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can create venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pending venues" 
ON public.venues 
FOR UPDATE 
USING (auth.uid() = created_by AND status = 'pending');

-- Create policies for cuisine types
CREATE POLICY "Anyone can view active cuisine types" 
ON public.cuisine_types 
FOR SELECT 
USING (is_active = true);

-- Insert default cuisine types
INSERT INTO public.cuisine_types (name, description, sort_order) VALUES
('Italian', 'Traditional Italian cuisine including pasta, pizza, and regional specialties', 1),
('Chinese', 'Authentic Chinese dishes from various regions', 2),
('Mexican', 'Traditional Mexican food including tacos, burritos, and regional cuisine', 3),
('Indian', 'Spicy and flavorful dishes from the Indian subcontinent', 4),
('Japanese', 'Traditional Japanese cuisine including sushi, ramen, and tempura', 5),
('Thai', 'Aromatic Thai dishes with bold flavors and fresh ingredients', 6),
('French', 'Classic French cuisine and fine dining', 7),
('American', 'Contemporary American cuisine and comfort food', 8),
('Mediterranean', 'Healthy Mediterranean dishes with olive oil, vegetables, and seafood', 9),
('Korean', 'Traditional Korean barbecue, kimchi, and fermented foods', 10);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuisine_types_updated_at
  BEFORE UPDATE ON public.cuisine_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();