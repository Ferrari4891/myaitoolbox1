import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MenuItem {
  id: string;
  name: string;
  href: string;
  parent_id: string | null;
  sort_order: number;
  depth: number;
  icon_name?: string;
  description?: string;
  target_blank: boolean;
  page_id?: string | null;
  page_title?: string | null;
  page_slug?: string | null;
  children?: MenuItem[];
}

export const useMenuHierarchy = (menuType = 'navigation') => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_menu_hierarchy', {
        menu_type_param: menuType
      });

      if (error) throw error;

      // Transform flat list to nested structure
      const itemsMap = new Map<string, MenuItem>();
      const rootItems: MenuItem[] = [];

      // First pass: create items map
      data?.forEach((item: any) => {
        const menuItem: MenuItem = {
          id: item.id,
          name: item.name,
          href: item.href || (item.page_slug ? `/page/${item.page_slug}` : '#'),
          parent_id: item.parent_id,
          sort_order: item.sort_order,
          depth: item.depth,
          icon_name: item.icon_name,
          description: item.description,
          target_blank: item.target_blank,
          page_id: item.page_id,
          page_title: item.page_title,
          page_slug: item.page_slug,
          children: []
        };
        itemsMap.set(item.id, menuItem);
      });

      // Second pass: build hierarchy
      itemsMap.forEach((item) => {
        if (item.parent_id) {
          const parent = itemsMap.get(item.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(item);
          }
        } else {
          rootItems.push(item);
        }
      });

      // Sort children by sort_order
      const sortItems = (items: MenuItem[]) => {
        items.sort((a, b) => a.sort_order - b.sort_order);
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            sortItems(item.children);
          }
        });
      };

      sortItems(rootItems);
      setMenuItems(rootItems);
    } catch (err) {
      console.error('Error fetching menu hierarchy:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuHierarchy();
  }, [menuType]);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuHierarchy
  };
};