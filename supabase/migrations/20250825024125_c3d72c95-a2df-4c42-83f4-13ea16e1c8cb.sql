-- Enhance menu_items table to support hierarchical menu structure
ALTER TABLE public.menu_items 
ADD COLUMN parent_id uuid REFERENCES public.menu_items(id),
ADD COLUMN menu_type text NOT NULL DEFAULT 'navigation',
ADD COLUMN is_visible boolean NOT NULL DEFAULT true,
ADD COLUMN icon_name text,
ADD COLUMN description text,
ADD COLUMN target_blank boolean NOT NULL DEFAULT false,
ADD COLUMN page_id uuid REFERENCES public.pages(id),
ADD COLUMN depth integer NOT NULL DEFAULT 0;

-- Create index for better performance on hierarchical queries
CREATE INDEX idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX idx_menu_items_sort_order ON public.menu_items(sort_order);
CREATE INDEX idx_menu_items_menu_type ON public.menu_items(menu_type);

-- Update RLS policies for menu_items
DROP POLICY IF EXISTS "Anyone can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;

-- Anyone can view visible menu items
CREATE POLICY "Anyone can view visible menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_visible = true);

-- Admins can manage all menu items
CREATE POLICY "Admins can manage menu items" 
ON public.menu_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create function to get menu hierarchy
CREATE OR REPLACE FUNCTION get_menu_hierarchy(menu_type_param text DEFAULT 'navigation')
RETURNS TABLE (
  id uuid,
  name text,
  href text,
  parent_id uuid,
  sort_order integer,
  depth integer,
  icon_name text,
  description text,
  target_blank boolean,
  page_id uuid,
  page_title text,
  page_slug text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE menu_tree AS (
    -- Root level items (no parent)
    SELECT 
      mi.id,
      mi.name,
      mi.href,
      mi.parent_id,
      mi.sort_order,
      mi.depth,
      mi.icon_name,
      mi.description,
      mi.target_blank,
      mi.page_id,
      p.title as page_title,
      p.slug as page_slug,
      ARRAY[mi.sort_order] as path
    FROM menu_items mi
    LEFT JOIN pages p ON mi.page_id = p.id
    WHERE mi.parent_id IS NULL 
    AND mi.menu_type = menu_type_param
    AND mi.is_visible = true
    
    UNION ALL
    
    -- Child items
    SELECT 
      mi.id,
      mi.name,
      mi.href,
      mi.parent_id,
      mi.sort_order,
      mi.depth,
      mi.icon_name,
      mi.description,
      mi.target_blank,
      mi.page_id,
      p.title as page_title,
      p.slug as page_slug,
      mt.path || mi.sort_order
    FROM menu_items mi
    LEFT JOIN pages p ON mi.page_id = p.id
    INNER JOIN menu_tree mt ON mi.parent_id = mt.id
    WHERE mi.menu_type = menu_type_param
    AND mi.is_visible = true
  )
  SELECT 
    mt.id,
    mt.name,
    mt.href,
    mt.parent_id,
    mt.sort_order,
    mt.depth,
    mt.icon_name,
    mt.description,
    mt.target_blank,
    mt.page_id,
    mt.page_title,
    mt.page_slug
  FROM menu_tree mt
  ORDER BY mt.path;
END;
$$;

-- Insert some default menu structure
INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, icon_name) VALUES
('Home', '/', 1, 'navigation', 0, 'Home'),
('Resources', '#', 2, 'navigation', 0, 'BookOpen'),
('Venues', '#', 3, 'navigation', 0, 'MapPin'),
('Events', '#', 4, 'navigation', 0, 'Calendar'),
('Community', '#', 5, 'navigation', 0, 'Users');

-- Insert submenu items for Resources
INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'How To', '/how-to', 1, 'navigation', 1, id FROM menu_items WHERE name = 'Resources' AND parent_id IS NULL;

INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'Tips & Tricks', '/tips-and-tricks', 2, 'navigation', 1, id FROM menu_items WHERE name = 'Resources' AND parent_id IS NULL;

-- Insert submenu items for Venues
INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'Browse Venues', '/venues', 1, 'navigation', 1, id FROM menu_items WHERE name = 'Venues' AND parent_id IS NULL;

INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'Add Venue', '/add-venue', 2, 'navigation', 1, id FROM menu_items WHERE name = 'Venues' AND parent_id IS NULL;

-- Insert submenu items for Events
INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'Schedule Event', '/schedule-event', 1, 'navigation', 1, id FROM menu_items WHERE name = 'Events' AND parent_id IS NULL;

-- Insert submenu items for Community
INSERT INTO public.menu_items (name, href, sort_order, menu_type, depth, parent_id) 
SELECT 'Message Board', '/message-board', 1, 'navigation', 1, id FROM menu_items WHERE name = 'Community' AND parent_id IS NULL;