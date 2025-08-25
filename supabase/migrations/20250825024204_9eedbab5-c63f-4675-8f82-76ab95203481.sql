-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.get_menu_hierarchy(menu_type_param text DEFAULT 'navigation')
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
SECURITY DEFINER
SET search_path = public
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

-- Fix the other function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;