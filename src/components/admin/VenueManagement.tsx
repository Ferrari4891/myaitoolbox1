import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Edit, 
  Check, 
  X, 
  Trash2, 
  MapPin, 
  ExternalLink, 
  Search,
  Filter,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Venue {
  id: string;
  business_name: string;
  name: string;
  description: string;
  address: string;
  venue_type: string;
  cuisine_types: string[];
  phone?: string;
  website?: string;
  google_maps_link?: string;
  facebook_link?: string;
  status: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  rating_count?: number;
  image_url?: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
}

const VenueManagement = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVenueStatus = async (venueId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(prev => new Set(prev).add(venueId));
    
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: newStatus })
        .eq('id', venueId);

      if (error) throw error;

      setVenues(prev => 
        prev.map(venue => 
          venue.id === venueId 
            ? { ...venue, status: newStatus }
            : venue
        )
      );

      toast({
        title: `Venue ${newStatus}`,
        description: `The venue has been ${newStatus} successfully.`,
      });
    } catch (error) {
      console.error('Error updating venue status:', error);
      toast({
        title: "Error",
        description: "Failed to update venue status",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    }
  };

  const deleteVenue = async (venueId: string, venueName: string) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"? This action cannot be undone.`)) {
      return;
    }

    setProcessing(prev => new Set(prev).add(venueId));
    
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;

      setVenues(prev => prev.filter(venue => venue.id !== venueId));

      toast({
        title: "Venue deleted",
        description: `${venueName} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast({
        title: "Error",
        description: "Failed to delete venue",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    }
  };

  const startEditing = (venue: Venue) => {
    setEditingVenue(venue.id);
    setEditedName(venue.business_name || venue.name);
  };

  const saveEdit = async (venueId: string) => {
    if (!editedName.trim()) {
      toast({
        title: "Error",
        description: "Venue name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setProcessing(prev => new Set(prev).add(venueId));
    
    try {
      const { error } = await supabase
        .from('venues')
        .update({ business_name: editedName.trim() })
        .eq('id', venueId);

      if (error) throw error;

      setVenues(prev => 
        prev.map(venue => 
          venue.id === venueId 
            ? { ...venue, business_name: editedName.trim() }
            : venue
        )
      );

      setEditingVenue(null);
      setEditedName("");

      toast({
        title: "Success",
        description: "Venue name updated successfully",
      });
    } catch (error) {
      console.error('Error updating venue name:', error);
      toast({
        title: "Error",
        description: "Failed to update venue name",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    }
  };

  const cancelEdit = () => {
    setEditingVenue(null);
    setEditedName("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || venue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Venue Management</h2>
        <p className="text-muted-foreground">Manage venue submissions and approvals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Venues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Venues ({filteredVenues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVenues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell>
                    {editingVenue === venue.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveEdit(venue.id)}
                          disabled={processing.has(venue.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{venue.business_name || venue.name}</div>
                          {venue.cuisine_types && venue.cuisine_types.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {venue.cuisine_types.join(', ')}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(venue)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{venue.venue_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{venue.address}</span>
                      {venue.google_maps_link && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => window.open(venue.google_maps_link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(venue.status)}</TableCell>
                  <TableCell>
                    {venue.rating ? (
                      <div className="text-sm">
                        ★ {venue.rating.toFixed(1)} ({venue.rating_count || 0})
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No ratings</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(venue.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {venue.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateVenueStatus(venue.id, 'approved')}
                            disabled={processing.has(venue.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateVenueStatus(venue.id, 'rejected')}
                            disabled={processing.has(venue.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteVenue(venue.id, venue.business_name || venue.name)}
                        disabled={processing.has(venue.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredVenues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No venues found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueManagement;