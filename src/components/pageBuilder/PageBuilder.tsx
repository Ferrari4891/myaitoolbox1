import React, { useState, useEffect } from 'react';
import { PageElement, Page, PageTemplate } from '@/types/pageBuilder';
import { ComponentPalette } from './ComponentPalette';
import { PageCanvas } from './PageCanvas';
import { ElementEditDialog } from './ElementEditDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, EyeOff, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageBuilderProps {
  page?: Page;
  onSave?: (page: Page) => void;
  onPublish?: (page: Page) => void;
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ page, onSave, onPublish }) => {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [pageData, setPageData] = useState<Partial<Page>>({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    is_published: false,
  });
  const [editingElement, setEditingElement] = useState<PageElement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (page) {
      setElements(page.content);
      setPageData({
        title: page.title,
        slug: page.slug,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        is_published: page.is_published,
      });
    }
  }, [page]);

  const generateElementId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addElement = (elementType: PageElement['type']) => {
    const newElement: PageElement = {
      id: generateElementId(),
      type: elementType,
      content: {},
      position: {
        x: 0,
        y: elements.length * 300,
        width: elementType === 'hero' ? 12 : 4,
        height: elementType === 'hero' ? 400 : 300,
      },
    };

    // Set default content based on type
    switch (elementType) {
      case 'hero':
        newElement.content = {
          title: 'New Hero Title',
          subtitle: 'Hero subtitle goes here',
        };
        break;
      case 'content-card':
        newElement.content = {
          title: 'New Card',
          description: 'Card description goes here.',
        };
        break;
      case 'text-block':
        newElement.content = {
          title: 'New Text Block',
          content: '<p>Text content goes here.</p>',
        };
        break;
      case 'image-block':
        newElement.content = {
          caption: 'Image caption',
        };
        break;
    }

    setElements([...elements, newElement]);
  };

  const editElement = (element: PageElement) => {
    setEditingElement(element);
    setIsEditDialogOpen(true);
  };

  const saveElementEdit = async (updatedElement: PageElement) => {
    const newElements = elements.map(el => el.id === updatedElement.id ? updatedElement : el);
    setElements(newElements);
    
    // Auto-save the page when an element is edited
    if (page?.id) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        await supabase
          .from('pages')
          .update({
            content: newElements as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', page.id);

        toast({
          title: "Changes Saved",
          description: "Element changes have been saved automatically.",
        });
      } catch (error: any) {
        console.error('Error auto-saving element changes:', error);
        toast({
          title: "Auto-save Failed",
          description: "Please use the Save button to save your changes manually.",
          variant: "destructive",
        });
      }
    }
  };

  const duplicateElement = (element: PageElement) => {
    const duplicated = {
      ...element,
      id: generateElementId(),
      position: {
        ...element.position,
        y: element.position.y + element.position.height + 20,
      },
    };
    setElements([...elements, duplicated]);
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
  };

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const elementIndex = elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    const newElements = [...elements];
    const [element] = newElements.splice(elementIndex, 1);
    
    if (direction === 'up' && elementIndex > 0) {
      newElements.splice(elementIndex - 1, 0, element);
    } else if (direction === 'down' && elementIndex < elements.length) {
      newElements.splice(elementIndex + 1, 0, element);
    } else {
      newElements.splice(elementIndex, 0, element);
    }

    setElements(newElements);
  };

  const savePage = async () => {
    if (!pageData.title || !pageData.slug) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and URL slug for the page.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const pageToSave = {
        title: pageData.title,
        slug: pageData.slug,
        content: elements,
        meta_title: pageData.meta_title,
        meta_description: pageData.meta_description,
        is_published: pageData.is_published,
        created_by: user.id,
      };

      let result;
      if (page?.id) {
        // Update existing page
        result = await supabase
          .from('pages')
          .update({
            ...pageToSave,
            content: pageToSave.content as any
          })
          .eq('id', page.id)
          .select()
          .single();
      } else {
        // Create new page
        result = await supabase
          .from('pages')
          .insert({
            ...pageToSave,
            content: pageToSave.content as any
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Page Saved",
        description: `Page "${pageData.title}" has been saved successfully.`,
      });

      onSave?.(result.data);
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    const newPublishState = !pageData.is_published;
    setPageData({ ...pageData, is_published: newPublishState });
    
    if (page?.id) {
      try {
        const { error } = await supabase
          .from('pages')
          .update({ is_published: newPublishState })
          .eq('id', page.id);

        if (error) throw error;

        toast({
          title: newPublishState ? "Page Published" : "Page Unpublished",
          description: `Page is now ${newPublishState ? 'live' : 'hidden'}.`,
        });

        onPublish?.(page);
      } catch (error: any) {
        console.error('Error toggling publish state:', error);
        toast({
          title: "Error",
          description: "Failed to update publish state.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Component Palette */}
      {!isPreviewMode && (
        <div className="w-64 border-r bg-card p-4 overflow-y-auto">
          <ComponentPalette onAddElement={addElement} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant={isPreviewMode ? "default" : "outline"}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center gap-2"
              >
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPreviewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {elements.length} element{elements.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={togglePublish}
                disabled={!page?.id}
              >
                {pageData.is_published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                onClick={savePage}
                disabled={saving || !pageData.title || !pageData.slug}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="canvas" className="h-full">
            <TabsList className="m-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Page Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="h-full m-0">
              <PageCanvas
                elements={elements}
                isEditing={!isPreviewMode}
                onEditElement={editElement}
                onDuplicateElement={duplicateElement}
                onDeleteElement={deleteElement}
                onMoveElement={moveElement}
              />
            </TabsContent>

            <TabsContent value="settings" className="p-4">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="page-title">Page Title</Label>
                    <Input
                      id="page-title"
                      value={pageData.title || ''}
                      onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                      placeholder="Enter page title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="page-slug">URL Slug</Label>
                    <Input
                      id="page-slug"
                      value={pageData.slug || ''}
                      onChange={(e) => setPageData({ ...pageData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div>
                    <Label htmlFor="meta-title">SEO Title</Label>
                    <Input
                      id="meta-title"
                      value={pageData.meta_title || ''}
                      onChange={(e) => setPageData({ ...pageData, meta_title: e.target.value })}
                      placeholder="SEO-optimized title (60 chars max)"
                      maxLength={60}
                    />
                  </div>

                  <div>
                    <Label htmlFor="meta-description">SEO Description</Label>
                    <Input
                      id="meta-description"
                      value={pageData.meta_description || ''}
                      onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                      placeholder="Brief description for search engines (160 chars max)"
                      maxLength={160}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Element Dialog */}
      <ElementEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingElement(null);
        }}
        element={editingElement}
        onSave={saveElementEdit}
      />
    </div>
  );
};