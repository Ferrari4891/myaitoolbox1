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
import { useMenuHierarchy } from '@/hooks/useMenuHierarchy';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy,
  Calendar,
  Settings,
  Menu
} from 'lucide-react';

export const PageManagement: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isNewPageDialogOpen, setIsNewPageDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [selectedPageForMenu, setSelectedPageForMenu] = useState<Page | null>(null);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    template_id: '',
    addToMenu: false,
    menuName: '',
    parentMenuId: '',
    menuOrder: 1,
    iconName: '',
    description: '',
    targetBlank: false,
  });
  const [menuData, setMenuData] = useState({
    addToMenu: false,
    menuName: '',
    parentMenuId: '',
    menuOrder: 1,
    iconName: '',
    description: '',
    targetBlank: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { menuItems, refetch: refetchMenu } = useMenuHierarchy();

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
          template_id: newPageData.template_id === 'blank' ? null : newPageData.template_id,
          content: templateContent as any,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create menu item if requested
      if (newPageData.addToMenu) {
        await createMenuItemForPage(data.id, {
          name: newPageData.menuName || newPageData.title,
          parentMenuId: newPageData.parentMenuId,
          menuOrder: newPageData.menuOrder,
          iconName: newPageData.iconName,
          description: newPageData.description,
          targetBlank: newPageData.targetBlank,
        });
      }

      const newPage = {
        ...data,
        content: Array.isArray(data.content) ? data.content : []
      } as unknown as Page;

      setPages([newPage, ...pages]);
      setIsNewPageDialogOpen(false);
      setNewPageData({ 
        title: '', 
        slug: '', 
        template_id: '',
        addToMenu: false,
        menuName: '',
        parentMenuId: '',
        menuOrder: 1,
        iconName: '',
        description: '',
        targetBlank: false,
      });
      
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

  const createMenuItemForPage = async (pageId: string, menuSettings: {
    name: string;
    parentMenuId: string;
    menuOrder: number;
    iconName: string;
    description: string;
    targetBlank: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: menuSettings.name,
          href: '', // Will be auto-generated from page_id
          parent_id: menuSettings.parentMenuId || null,
          page_id: pageId,
          menu_type: 'navigation',
          sort_order: menuSettings.menuOrder,
          depth: menuSettings.parentMenuId ? 1 : 0,
          icon_name: menuSettings.iconName || null,
          description: menuSettings.description || null,
          target_blank: menuSettings.targetBlank,
          is_visible: true,
        });

      if (error) throw error;
      refetchMenu();
    } catch (error) {
      console.error('Error creating menu item:', error);
    }
  };

  const updateMenuItemForPage = async (pageId: string, menuSettings: {
    name: string;
    parentMenuId: string;
    menuOrder: number;
    iconName: string;
    description: string;
    targetBlank: boolean;
  }) => {
    try {
      // Check if page already has menu item
      const { data: existingMenuItem } = await supabase
        .from('menu_items')
        .select('id')
        .eq('page_id', pageId)
        .eq('menu_type', 'navigation')
        .single();

      if (existingMenuItem) {
        // Update existing menu item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: menuSettings.name,
            parent_id: menuSettings.parentMenuId || null,
            sort_order: menuSettings.menuOrder,
            depth: menuSettings.parentMenuId ? 1 : 0,
            icon_name: menuSettings.iconName || null,
            description: menuSettings.description || null,
            target_blank: menuSettings.targetBlank,
          })
          .eq('id', existingMenuItem.id);

        if (error) throw error;
      } else {
        // Create new menu item
        await createMenuItemForPage(pageId, menuSettings);
      }

      refetchMenu();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const removeFromMenu = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('page_id', pageId)
        .eq('menu_type', 'navigation');

      if (error) throw error;
      refetchMenu();
      
      toast({
        title: "Removed from Menu",
        description: "Page has been removed from the navigation menu.",
      });
    } catch (error) {
      console.error('Error removing from menu:', error);
      toast({
        title: "Error",
        description: "Failed to remove page from menu.",
        variant: "destructive",
      });
    }
  };

  const openMenuDialog = async (page: Page) => {
    setSelectedPageForMenu(page);
    
    // Check if page already has menu item
    try {
      const { data: existingMenuItem } = await supabase
        .from('menu_items')
        .select('*')
        .eq('page_id', page.id)
        .eq('menu_type', 'navigation')
        .single();

      if (existingMenuItem) {
        setMenuData({
          addToMenu: true,
          menuName: existingMenuItem.name,
          parentMenuId: existingMenuItem.parent_id || '',
          menuOrder: existingMenuItem.sort_order,
          iconName: existingMenuItem.icon_name || '',
          description: existingMenuItem.description || '',
          targetBlank: existingMenuItem.target_blank,
        });
      } else {
        setMenuData({
          addToMenu: false,
          menuName: page.title,
          parentMenuId: '',
          menuOrder: 1,
          iconName: '',
          description: '',
          targetBlank: false,
        });
      }
    } catch (error) {
      // Page not in menu yet
      setMenuData({
        addToMenu: false,
        menuName: page.title,
        parentMenuId: '',
        menuOrder: 1,
        iconName: '',
        description: '',
        targetBlank: false,
      });
    }
    
    setIsMenuDialogOpen(true);
  };

  const saveMenuSettings = async () => {
    if (!selectedPageForMenu) return;

    try {
      if (menuData.addToMenu) {
        await updateMenuItemForPage(selectedPageForMenu.id, {
          name: menuData.menuName || selectedPageForMenu.title,
          parentMenuId: menuData.parentMenuId,
          menuOrder: menuData.menuOrder,
          iconName: menuData.iconName,
          description: menuData.description,
          targetBlank: menuData.targetBlank,
        });

        toast({
          title: "Menu Settings Updated",
          description: "Page menu settings have been saved.",
        });
      } else {
        await removeFromMenu(selectedPageForMenu.id);
      }

      setIsMenuDialogOpen(false);
      setSelectedPageForMenu(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save menu settings.",
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
                    <SelectItem value="blank">Blank Page</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="add-to-menu"
                    checked={newPageData.addToMenu}
                    onCheckedChange={(checked) => setNewPageData({ ...newPageData, addToMenu: checked })}
                  />
                  <Label htmlFor="add-to-menu">Add to Navigation Menu</Label>
                </div>

                {newPageData.addToMenu && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="menu-name">Menu Name</Label>
                        <Input
                          id="menu-name"
                          value={newPageData.menuName}
                          onChange={(e) => setNewPageData({ ...newPageData, menuName: e.target.value })}
                          placeholder={newPageData.title || "Menu display name"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="parent-menu">Parent Menu Item</Label>
                        <Select
                          value={newPageData.parentMenuId}
                          onValueChange={(value) => setNewPageData({ ...newPageData, parentMenuId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Top level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Top Level</SelectItem>
                            {menuItems.filter(item => item.depth === 0).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="menu-order">Menu Order</Label>
                        <Input
                          id="menu-order"
                          type="number"
                          min="1"
                          value={newPageData.menuOrder}
                          onChange={(e) => setNewPageData({ ...newPageData, menuOrder: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="icon-name">Icon Name (Optional)</Label>
                        <Input
                          id="icon-name"
                          value={newPageData.iconName}
                          onChange={(e) => setNewPageData({ ...newPageData, iconName: e.target.value })}
                          placeholder="e.g., Home, Settings"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newPageData.description}
                        onChange={(e) => setNewPageData({ ...newPageData, description: e.target.value })}
                        placeholder="Brief description for the menu item"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="target-blank"
                        checked={newPageData.targetBlank}
                        onCheckedChange={(checked) => setNewPageData({ ...newPageData, targetBlank: checked })}
                      />
                      <Label htmlFor="target-blank">Open in new tab</Label>
                    </div>
                  </>
                )}
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

      {/* Menu Settings Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Menu Settings: {selectedPageForMenu?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="add-to-menu-edit"
                checked={menuData.addToMenu}
                onCheckedChange={(checked) => setMenuData({ ...menuData, addToMenu: checked })}
              />
              <Label htmlFor="add-to-menu-edit">Include in Navigation Menu</Label>
            </div>

            {menuData.addToMenu && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-menu-name">Menu Name</Label>
                    <Input
                      id="edit-menu-name"
                      value={menuData.menuName}
                      onChange={(e) => setMenuData({ ...menuData, menuName: e.target.value })}
                      placeholder={selectedPageForMenu?.title || "Menu display name"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-parent-menu">Parent Menu Item</Label>
                    <Select
                      value={menuData.parentMenuId}
                      onValueChange={(value) => setMenuData({ ...menuData, parentMenuId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Top level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Top Level</SelectItem>
                        {menuItems.filter(item => item.depth === 0).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-menu-order">Menu Order</Label>
                    <Input
                      id="edit-menu-order"
                      type="number"
                      min="1"
                      value={menuData.menuOrder}
                      onChange={(e) => setMenuData({ ...menuData, menuOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-icon-name">Icon Name (Optional)</Label>
                    <Input
                      id="edit-icon-name"
                      value={menuData.iconName}
                      onChange={(e) => setMenuData({ ...menuData, iconName: e.target.value })}
                      placeholder="e.g., Home, Settings"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-description"
                    value={menuData.description}
                    onChange={(e) => setMenuData({ ...menuData, description: e.target.value })}
                    placeholder="Brief description for the menu item"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-target-blank"
                    checked={menuData.targetBlank}
                    onCheckedChange={(checked) => setMenuData({ ...menuData, targetBlank: checked })}
                  />
                  <Label htmlFor="edit-target-blank">Open in new tab</Label>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMenuSettings}>
                Save Menu Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    onClick={() => openMenuDialog(page)}
                    title="Menu Settings"
                  >
                    <Menu className="h-3 w-3" />
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