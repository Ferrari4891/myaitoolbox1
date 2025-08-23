import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Check, 
  X, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [editingCuisine, setEditingCuisine] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [newCuisine, setNewCuisine] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to load cuisine types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCuisineType = async () => {
    if (!newCuisine.name.trim()) {
      toast({
        title: "Error",
        description: "Cuisine name is required",
        variant: "destructive",
      });
      return;
    }

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

      toast({
        title: "Success",
        description: "Cuisine type added successfully",
      });
      
      setNewCuisine({ name: '', description: '' });
      setShowAddForm(false);
      fetchCuisineTypes();
    } catch (error) {
      console.error('Error adding cuisine type:', error);
      toast({
        title: "Error",
        description: "Failed to add cuisine type",
        variant: "destructive",
      });
    }
  };

  const toggleCuisineStatus = async (id: string, currentStatus: boolean) => {
    setProcessing(prev => new Set(prev).add(id));
    
    try {
      const { error } = await supabase
        .from('cuisine_types')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setCuisineTypes(prev => 
        prev.map(cuisine => 
          cuisine.id === id 
            ? { ...cuisine, is_active: !currentStatus }
            : cuisine
        )
      );

      toast({
        title: "Success",
        description: `Cuisine type ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating cuisine type:', error);
      toast({
        title: "Error",
        description: "Failed to update cuisine type",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const deleteCuisineType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setProcessing(prev => new Set(prev).add(id));
    
    try {
      const { error } = await supabase
        .from('cuisine_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCuisineTypes(prev => prev.filter(cuisine => cuisine.id !== id));

      toast({
        title: "Success",
        description: "Cuisine type deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting cuisine type:', error);
      toast({
        title: "Error",
        description: "Failed to delete cuisine type",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const startEditing = (cuisine: CuisineType) => {
    setEditingCuisine(cuisine.id);
    setEditedName(cuisine.name);
    setEditedDescription(cuisine.description || "");
  };

  const saveEdit = async (cuisineId: string) => {
    if (!editedName.trim()) {
      toast({
        title: "Error",
        description: "Cuisine name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setProcessing(prev => new Set(prev).add(cuisineId));
    
    try {
      const { error } = await supabase
        .from('cuisine_types')
        .update({ 
          name: editedName.trim(),
          description: editedDescription.trim() || null
        })
        .eq('id', cuisineId);

      if (error) throw error;

      setCuisineTypes(prev => 
        prev.map(cuisine => 
          cuisine.id === cuisineId 
            ? { 
                ...cuisine, 
                name: editedName.trim(),
                description: editedDescription.trim() || ""
              }
            : cuisine
        )
      );

      setEditingCuisine(null);
      setEditedName("");
      setEditedDescription("");

      toast({
        title: "Success",
        description: "Cuisine type updated successfully",
      });
    } catch (error) {
      console.error('Error updating cuisine type:', error);
      toast({
        title: "Error",
        description: "Failed to update cuisine type",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(cuisineId);
        return newSet;
      });
    }
  };

  const cancelEdit = () => {
    setEditingCuisine(null);
    setEditedName("");
    setEditedDescription("");
  };

  const filteredCuisines = cuisineTypes.filter(cuisine =>
    cuisine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuisine.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cuisine types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cuisine Management</h2>
          <p className="text-muted-foreground">Manage restaurant cuisine categories</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cuisine Type
        </Button>
      </div>

      {/* Add New Cuisine Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Cuisine Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cuisine Name *</label>
                <Input
                  value={newCuisine.name}
                  onChange={(e) => setNewCuisine(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Italian, Mexican, Vietnamese"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newCuisine.description}
                  onChange={(e) => setNewCuisine(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this cuisine type"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addCuisineType}>
                Add Cuisine Type
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cuisine types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cuisine Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cuisine Types ({filteredCuisines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCuisines.map((cuisine) => (
                <TableRow key={cuisine.id}>
                  <TableCell>
                    {editingCuisine === cuisine.id ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    ) : (
                      <div className="font-medium">{cuisine.name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCuisine === cuisine.id ? (
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="h-16"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground max-w-xs">
                        {cuisine.description || "No description"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cuisine.is_active ? "default" : "secondary"}>
                      {cuisine.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cuisine.sort_order}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(cuisine.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingCuisine === cuisine.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEdit(cuisine.id)}
                            disabled={processing.has(cuisine.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(cuisine)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCuisineStatus(cuisine.id, cuisine.is_active)}
                            disabled={processing.has(cuisine.id)}
                            className="h-8 w-8 p-0"
                          >
                            {cuisine.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCuisineType(cuisine.id, cuisine.name)}
                            disabled={processing.has(cuisine.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCuisines.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cuisine types found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CuisineManagement;