-- Create storage bucket for page images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('page-images', 'page-images', true);

-- Create pages table for dynamic page content
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_id UUID,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page templates table
CREATE TABLE public.page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pages table
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on page_templates table  
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages
CREATE POLICY "Anyone can view published pages" 
  ON public.pages 
  FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admins can manage all pages" 
  ON public.pages 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  ));

-- RLS Policies for page_templates
CREATE POLICY "Anyone can view active templates" 
  ON public.page_templates 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
  ON public.page_templates 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  ));

-- Storage policies for page images
CREATE POLICY "Anyone can view page images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'page-images');

CREATE POLICY "Admins can upload page images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'page-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update page images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'page-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete page images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'page-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create trigger for updated_at on pages
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on page_templates  
CREATE TRIGGER update_page_templates_updated_at
  BEFORE UPDATE ON public.page_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default page templates
INSERT INTO public.page_templates (name, description, thumbnail_url, template_data) VALUES 
(
  'Hero with Content Cards', 
  'A hero section with content cards below',
  null,
  '[
    {
      "id": "hero-1",
      "type": "hero",
      "content": {
        "title": "Welcome to Our Site",
        "subtitle": "Your subtitle here",
        "backgroundImage": null
      },
      "position": {"x": 0, "y": 0, "width": 12, "height": 400}
    },
    {
      "id": "card-1", 
      "type": "content-card",
      "content": {
        "title": "Feature 1",
        "description": "Description of feature 1",
        "image": null
      },
      "position": {"x": 0, "y": 400, "width": 4, "height": 300}
    },
    {
      "id": "card-2",
      "type": "content-card", 
      "content": {
        "title": "Feature 2",
        "description": "Description of feature 2",
        "image": null
      },
      "position": {"x": 4, "y": 400, "width": 4, "height": 300}
    },
    {
      "id": "card-3",
      "type": "content-card",
      "content": {
        "title": "Feature 3", 
        "description": "Description of feature 3",
        "image": null
      },
      "position": {"x": 8, "y": 400, "width": 4, "height": 300}
    }
  ]'::jsonb
),
(
  'Simple Text Page',
  'A basic page with text content', 
  null,
  '[
    {
      "id": "text-1",
      "type": "text-block",
      "content": {
        "title": "Page Title",
        "content": "<p>Your content goes here. You can format this text with rich text editing.</p>"
      },
      "position": {"x": 0, "y": 0, "width": 12, "height": 400}
    }
  ]'::jsonb
),
(
  'Image Gallery',
  'A page with image gallery layout',
  null, 
  '[
    {
      "id": "gallery-header",
      "type": "text-block",
      "content": {
        "title": "Our Gallery",
        "content": "<p>Check out our latest work</p>"
      },
      "position": {"x": 0, "y": 0, "width": 12, "height": 200}
    },
    {
      "id": "image-1",
      "type": "image-block",
      "content": {
        "image": null,
        "caption": "Image 1"
      },
      "position": {"x": 0, "y": 200, "width": 6, "height": 400}
    },
    {
      "id": "image-2", 
      "type": "image-block",
      "content": {
        "image": null,
        "caption": "Image 2"
      },
      "position": {"x": 6, "y": 200, "width": 6, "height": 400}
    }
  ]'::jsonb
);