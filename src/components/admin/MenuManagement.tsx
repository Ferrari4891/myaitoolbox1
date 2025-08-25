import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, MoveUp, MoveDown, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMenuHierarchy, MenuItem } from "@/hooks/useMenuHierarchy";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Menu Item Component
const SortableMenuItem = ({ item, onEdit, onDelete, level = 0 }: { 
  item: MenuItem; 
  onEdit: (item: MenuItem) => void; 
  onDelete: (id: string) => void; 
  level?: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`ml-${level * 4} cursor-move`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button type="button" {...attributes} {...listeners} className="p-1 cursor-grab text-muted-foreground"><GripVertical className="h-4 w-4" /></button>
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">{item.href}</p>
                {item.icon_name && (
                  <Badge variant="secondary" className="mt-1">
                    Icon: {item.icon_name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MenuManagement = () => {
  const { menuItems, loading, refetch } = useMenuHierarchy();
  const [pages, setPages] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState({
    name: '',
    href: '',
    parent_id: 'none',
    icon_name: '',
    description: '',
    target_blank: false,
    page_id: 'none',
    is_visible: true
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('is_published', true)
        .order('title');
      
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      href: '',
      parent_id: 'none',
      icon_name: '',
      description: '',
      target_blank: false,
      page_id: 'none',
      is_visible: true
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedPage = pages.find((p) => p.id === (formData.page_id === 'none' ? null : formData.page_id));
      const effectiveHref = (formData.href?.trim() || '') || (selectedPage ? `/${selectedPage.slug}` : '#');

      const menuData = {
        ...formData,
        href: effectiveHref,
        parent_id: formData.parent_id === 'none' ? null : formData.parent_id,
        page_id: formData.page_id === 'none' ? null : formData.page_id,
        menu_type: 'navigation',
        sort_order: editingItem ? editingItem.sort_order : await getNextSortOrder(formData.parent_id === 'none' ? null : formData.parent_id),
        depth: formData.parent_id === 'none' ? 0 : 1
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Menu item updated",
          description: "The menu item has been successfully updated."
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([menuData]);
        
        if (error) throw error;
        
        toast({
          title: "Menu item created",
          description: "The menu item has been successfully created."
        });
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: `Failed to save menu item: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const getNextSortOrder = async (parentId: string | null) => {
    if (parentId === null) {
      const { data, error } = await supabase
        .from('menu_items')
        .select('sort_order')
        .is('parent_id', null)
        .eq('menu_type', 'navigation')
        .order('sort_order', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return 1;
      return (data[0].sort_order ?? 0) + 1;
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .select('sort_order')
        .eq('parent_id', parentId)
        .eq('menu_type', 'navigation')
        .order('sort_order', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return 1;
      return (data[0].sort_order ?? 0) + 1;
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      href: item.href,
      parent_id: item.parent_id || 'none',
      icon_name: item.icon_name || '',
      description: item.description || '',
      target_blank: item.target_blank,
      page_id: item.page_id || 'none',
      is_visible: true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Menu item deleted",
        description: "The menu item has been successfully deleted."
      });
      
      refetch();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: `Failed to delete menu item: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    try {
      // Get the flat list of all menu items
      const flatItems = flattenMenuItems(menuItems);
      const oldIndex = flatItems.findIndex((item) => item.id === active.id);
      const newIndex = flatItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder the array
      const reorderedItems = arrayMove(flatItems, oldIndex, newIndex);

      // Update sort_order for all affected items
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));

      // Update all items in the database
      for (const update of updates) {
        const { error } = await supabase
          .from('menu_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      toast({
        title: "Menu reordered",
        description: "The menu items have been successfully reordered."
      });

      refetch();
    } catch (error: any) {
      console.error('Error reordering menu items:', error);
      toast({
        title: "Error",
        description: `Failed to reorder menu items: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
    const flattened: MenuItem[] = [];
    items.forEach(item => {
      flattened.push(item);
      if (item.children) {
        flattened.push(...flattenMenuItems(item.children));
      }
    });
    return flattened;
  };

  if (loading) {
    return <div>Loading menu items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="href">URL</Label>
                  <Input
                    id="href"
                    value={formData.href}
                    onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                    placeholder="Leave empty for page-based links"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent">Parent Menu Item</Label>
                  <Select 
                    value={formData.parent_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent (Top Level)</SelectItem>
                      {flattenMenuItems(menuItems)
                        .filter(item => item.depth === 0)
                        .map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="page">Link to Page</Label>
                  <Select 
                    value={formData.page_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, page_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select page (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Page Link</SelectItem>
                      {pages.map(page => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon Name</Label>
                  <Input
                    id="icon"
                    value={formData.icon_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                    placeholder="e.g., Home, Settings, User"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="target_blank"
                    checked={formData.target_blank}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, target_blank: checked }))}
                  />
                  <Label htmlFor="target_blank">Open in new tab</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for the menu item"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Menu Structure</h3>
        <p className="text-sm text-muted-foreground">Drag and drop to reorder menu items</p>
        {menuItems.length === 0 ? (
          <p className="text-muted-foreground">No menu items found.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenMenuItems(menuItems).map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {flattenMenuItems(menuItems).map(item => (
                  <SortableMenuItem 
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    level={item.depth}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;