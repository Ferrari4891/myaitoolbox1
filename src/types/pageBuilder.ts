export interface PageElement {
  id: string;
  type: 'hero' | 'content-card' | 'text-block' | 'image-block';
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    content?: string;
    image?: string;
    backgroundImage?: string;
    caption?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  template_data: PageElement[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: PageElement[];
  template_id?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DragItem {
  id: string;
  type: string;
  element?: PageElement;
}