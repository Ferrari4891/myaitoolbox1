import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageElementRenderer } from '@/components/pageBuilder/PageElementRenderer';
import { Card } from '@/components/ui/card';

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      // Handle home route and extract slug from pathname
      let pageSlug = slug;
      if (location.pathname === '/') {
        pageSlug = 'home';
      } else if (!slug) {
        // Extract slug from pathname for other routes like /how-to, /tips-and-tricks
        pageSlug = location.pathname.replace('/', '');
      }

      if (!pageSlug) return;

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', pageSlug)
          .eq('is_published', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Page not found');
          } else {
            throw error;
          }
          return;
        }

        setPage(data);
      } catch (error) {
        console.error('Error fetching page:', error);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">{error || 'The requested page could not be found.'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-12 gap-4" style={{ minHeight: '800px' }}>
          {page.content?.map((element: any) => (
            <PageElementRenderer key={element.id} element={element} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;