import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle, Clock, XCircle, Eye, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CuisineType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const CuisineManagement = () => {
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCuisine, setNewCuisine] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCuisineTypes();
  }, []);

  const fetchCuisineTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cuisine_types')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCuisineTypes(data || []);
    } catch (error) {
      console.error('Error fetching cuisine types:', error);
      toast.error('Failed to load cuisine types');
    } finally {
      setLoading(false);
    }
  };

  const addCuisineType = async () => {
    if (!newCuisine.name.trim()) {
      toast.error('Cuisine name is required');
      return;
    }

    setIsAdding(true);
    try {
      const maxOrder = Math.max(...cuisineTypes.map(c => c.sort_order), 0);
      
      const { error } = await supabase
        .from('cuisine_types')
        .insert([{
          name: newCuisine.name.trim(),
          description: newCuisine.description.trim() || null,
          sort_order: maxOrder + 1
        }]);

      if (error) throw error;

      toast.success('Cuisine type added successfully');
      setNewCuisine({ name: '', description: '' });
      fetchCuisineTypes();
    } catch (error) {
      console.error('Error adding cuisine type:', error);
      toast.error('Failed to add cuisine type');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCuisineStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cuisine_types')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Cuisine type ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCuisineTypes();
    } catch (error) {
      console.error('Error updating cuisine type:', error);
      toast.error('Failed to update cuisine type');
    }
  };

  const deleteCuisineType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cuisine type? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cuisine_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Cuisine type deleted successfully');
      fetchCuisineTypes();
    } catch (error) {
      console.error('Error deleting cuisine type:', error);
      toast.error('Failed to delete cuisine type');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cuisine management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cuisine Type Management</h2>
          <p className="text-muted-foreground">Manage restaurant cuisine categories</p>
        </div>
        <Button onClick={() => navigate('/admin')} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </div>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Manage Cuisines</TabsTrigger>
          <TabsTrigger value="add">Add New Cuisine</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Cuisine Type</CardTitle>
              <CardDescription>
                Create a new cuisine category for restaurants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisine Name *</label>
                <input
                  type="text"
                  value={newCuisine.name}
                  onChange={(e) => setNewCuisine(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Italian, Mexican, Vietnamese"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={newCuisine.description}
                  onChange={(e) => setNewCuisine(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this cuisine type"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button onClick={addCuisineType} disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Cuisine Type'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid gap-4">
            {cuisineTypes.map((cuisine) => (
              <Card key={cuisine.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{cuisine.name}</h3>
                      <Badge variant={cuisine.is_active ? "default" : "secondary"}>
                        {cuisine.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    {cuisine.description && (
                      <p className="text-muted-foreground">{cuisine.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Sort order: {cuisine.sort_order} • Created: {new Date(cuisine.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={cuisine.is_active ? "outline" : "default"}
                      onClick={() => toggleCuisineStatus(cuisine.id, cuisine.is_active)}
                    >
                      {cuisine.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCuisineType(cuisine.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cuisineTypes.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No cuisine types yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first cuisine type to get started
                  </p>
                  <Button onClick={() => navigate('?tab=add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cuisine Type
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CuisineManagement;