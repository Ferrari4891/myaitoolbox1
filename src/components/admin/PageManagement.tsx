import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Page, PageTemplate } from '@/types/pageBuilder';
import { PageBuilder } from '@/components/pageBuilder/PageBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy,
  Calendar,
  Settings
} from 'lucide-react';

export const PageManagement: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isNewPageDialogOpen, setIsNewPageDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    template_id: '',
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
    fetchTemplates();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages((data || []).map(page => ({
        ...page,
        content: Array.isArray(page.content) ? page.content : []
      })) as unknown as Page[]);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to load pages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        template_data: Array.isArray(template.template_data) ? template.template_data : []
      })) as unknown as PageTemplate[]);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const createNewPage = async () => {
    if (!newPageData.title || !newPageData.slug) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and URL slug.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get template data if selected
      let templateContent = [];
      if (newPageData.template_id) {
        const { data: template } = await supabase
          .from('page_templates')
          .select('template_data')
          .eq('id', newPageData.template_id)
          .single();
        
        if (template) {
          templateContent = Array.isArray(template.template_data) ? template.template_data : [];
        }
      }

      const { data, error } = await supabase
        .from('pages')
        .insert({
          title: newPageData.title,
          slug: newPageData.slug,
          template_id: newPageData.template_id || null,
          content: templateContent as any,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newPage = {
        ...data,
        content: Array.isArray(data.content) ? data.content : []
      } as unknown as Page;

      setPages([newPage, ...pages]);
      setIsNewPageDialogOpen(false);
      setNewPageData({ title: '', slug: '', template_id: '' });
      
      toast({
        title: "Page Created",
        description: `Page "${data.title}" has been created successfully.`,
      });

      // Open the page in the builder
      setSelectedPage(newPage);
      setIsBuilderOpen(true);
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create page.",
        variant: "destructive",
      });
    }
  };

  const deletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setPages(pages.filter(p => p.id !== pageId));
      toast({
        title: "Page Deleted",
        description: `Page "${pageTitle}" has been deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: "Failed to delete page.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      setPages(pages.map(p => 
        p.id === page.id 
          ? { ...p, is_published: !p.is_published }
          : p
      ));

      toast({
        title: page.is_published ? "Page Unpublished" : "Page Published",
        description: `Page is now ${!page.is_published ? 'live' : 'hidden'}.`,
      });
    } catch (error: any) {
      console.error('Error toggling publish state:', error);
      toast({
        title: "Error",
        description: "Failed to update publish state.",
        variant: "destructive",
      });
    }
  };

  const duplicatePage = async (page: Page) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pages')
        .insert({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy-${Date.now()}`,
          content: page.content as any,
          template_id: page.template_id,
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          is_published: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const duplicatedPage = {
        ...data,
        content: Array.isArray(data.content) ? data.content : []
      } as unknown as Page;

      setPages([duplicatedPage, ...pages]);
      toast({
        title: "Page Duplicated",
        description: `Page "${duplicatedPage.title}" has been created.`,
      });
    } catch (error: any) {
      console.error('Error duplicating page:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate page.",
        variant: "destructive",
      });
    }
  };

  const handlePageSaved = (savedPage: Page) => {
    setPages(pages.map(p => p.id === savedPage.id ? savedPage : p));
  };

  if (isBuilderOpen && selectedPage) {
    return (
      <div className="h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Editing: {selectedPage.title}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setIsBuilderOpen(false);
              setSelectedPage(null);
            }}
          >
            Back to Pages
          </Button>
        </div>
        <PageBuilder
          page={selectedPage}
          onSave={handlePageSaved}
          onPublish={() => fetchPages()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Page Management</h2>
          <p className="text-muted-foreground">
            Create and manage website pages with the drag-and-drop page builder
          </p>
        </div>
        
        <Dialog open={isNewPageDialogOpen} onOpenChange={setIsNewPageDialogOpen}>
          <Button className="flex items-center gap-2" onClick={() => setIsNewPageDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Page
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-title">Page Title</Label>
                <Input
                  id="new-title"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({ 
                    ...newPageData, 
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                  })}
                  placeholder="Enter page title"
                />
              </div>
              
              <div>
                <Label htmlFor="new-slug">URL Slug</Label>
                <Input
                  id="new-slug"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({ 
                    ...newPageData, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                  })}
                  placeholder="url-friendly-slug"
                />
              </div>

              <div>
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={newPageData.template_id}
                  onValueChange={(value) => setNewPageData({ ...newPageData, template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Blank Page</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewPageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewPage}>
                  Create Page
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading pages...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <div className="flex items-center gap-1">
                    {page.is_published ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  /{page.slug}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground mb-4">
                  <Calendar className="h-3 w-3 mr-1" />
                  Updated {(() => {
                    const updated = page.updated_at ? new Date(page.updated_at) : (page.created_at ? new Date(page.created_at) : null);
                    return updated && !isNaN(updated.getTime()) ? updated.toLocaleDateString() : 'Just now';
                  })()}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPage(page);
                      setIsBuilderOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublish(page)}
                  >
                    {page.is_published ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicatePage(page)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePage(page.id, page.title)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {pages.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pages yet</p>
                <p className="text-sm">Create your first page to get started</p>
              </div>
              <Button onClick={() => setIsNewPageDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Page
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};