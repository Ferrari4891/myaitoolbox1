import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Facebook, ExternalLink, Check, X, Eye, Users, Trash2 } from "lucide-react";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface Venue {
  id: string;
  business_name: string;
  description: string;
  address: string;
  google_maps_link?: string;
  facebook_link?: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  status: string;
  created_at: string;
  submitted_by?: string;
}

interface RecentMember {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  user_id: string;
  email: string | null;
  is_admin?: boolean;
  age_group?: string;
  gender?: string;
}

const Admin = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingVenues, setProcessingVenues] = useState<Set<string>>(new Set());
  const [removingMembers, setRemovingMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/sign-in');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
        fetchVenues();
        fetchRecentMembers();
        setupRealtimeSubscription();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

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
        description: "Failed to load venues. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchRecentMembers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, created_at, user_id, is_admin, age_group, gender, email')
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) throw profilesError;

      setRecentMembers(profilesData || []);
    } catch (error) {
      console.error('Error fetching recent members:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const newMember = payload.new as RecentMember;
          setRecentMembers(prev => [newMember, ...prev.slice(0, 9)]);
          
          toast({
            title: "New Member Joined!",
            description: `${newMember.display_name || 'New user'} just signed up`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'venues'
        },
        (payload) => {
          const newVenue = payload.new as Venue;
          setVenues(prev => [newVenue, ...prev]);
          
          toast({
            title: "New Venue Submitted!",
            description: `${newVenue.business_name} is awaiting approval`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateVenueStatus = async (venueId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingVenues(prev => new Set(prev).add(venueId));
    
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
        description: "Failed to update venue status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingVenues(prev => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    }
  };

  const getVenueImages = (venue: Venue) => {
    const images = [venue.image_1_url, venue.image_2_url, venue.image_3_url]
      .filter(Boolean) as string[];
    
    if (images.length === 0) {
      return [
        "/lovable-uploads/a44177ba-4fed-4d95-84a9-5f60ed868687.png",
        "/lovable-uploads/a15c0703-9909-4cba-a906-d5b7d26c81af.png",
        "/lovable-uploads/98b9f36a-cfb2-4516-b21d-9282258f27fd.png"
      ];
    }
    
    return images;
  };

  const removeMember = async (memberId: string, memberName: string) => {
    const confirmRemoval = window.confirm(
      `Are you sure you want to remove ${memberName || 'this member'}? This action cannot be undone.`
    );
    
    if (!confirmRemoval) return;
    
    setRemovingMembers(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setRecentMembers(prev => prev.filter(member => member.id !== memberId));

      toast({
        title: "Member Removed",
        description: `${memberName || 'Member'} has been removed successfully.`,
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-muted-foreground">Loading admin panel...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingVenues = venues.filter(v => v.status === 'pending');
  const approvedVenues = venues.filter(v => v.status === 'approved');
  const rejectedVenues = venues.filter(v => v.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Admin Panel
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage venue submissions and approvals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingVenues.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedVenues.length}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedVenues.length}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{recentMembers.length}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Members Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No members yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Name</th>
                      <th className="text-left py-2 px-3 font-medium">Email</th>
                      <th className="text-left py-2 px-3 font-medium">Role</th>
                      <th className="text-left py-2 px-3 font-medium">Joined</th>
                      <th className="text-left py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="font-medium">
                            {member.first_name && member.last_name 
                              ? `${member.first_name} ${member.last_name}`
                              : member.display_name || 'Name not provided'
                            }
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm text-muted-foreground">
                            {member.email || 'Not provided'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={member.is_admin ? "default" : "outline"}>
                            {member.is_admin ? 'Admin' : 'Member'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(
                              member.id, 
                              member.first_name && member.last_name 
                                ? `${member.first_name} ${member.last_name}`
                                : member.display_name || 'Member'
                            )}
                            disabled={removingMembers.has(member.id) || member.is_admin}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            {removingMembers.has(member.id) ? 'Removing...' : 'Remove'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {venues.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
              No venue submissions yet
            </h2>
            <p className="text-muted-foreground">
              Venue submissions will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingVenues.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                  Pending Approval ({pendingVenues.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingVenues.map((venue) => (
                    <Card key={venue.id} className="overflow-hidden border-orange-200">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl font-bold text-card-foreground">
                            {venue.business_name}
                          </CardTitle>
                          <Badge variant={getStatusBadgeVariant(venue.status)}>
                            {venue.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <ImageCarousel
                          images={getVenueImages(venue)}
                          alt={venue.business_name}
                          className="w-full h-48"
                          autoPlay={true}
                          interval={2000}
                        />
                        
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {venue.description}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              {venue.address}
                            </p>
                          </div>
                          
                          {venue.facebook_link && (
                            <div className="flex items-center gap-2">
                              <Facebook className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={venue.facebook_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:text-primary/80"
                              >
                                Facebook Page
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateVenueStatus(venue.id, 'approved')}
                            disabled={processingVenues.has(venue.id)}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateVenueStatus(venue.id, 'rejected')}
                            disabled={processingVenues.has(venue.id)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {approvedVenues.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-green-600">
                  Approved Venues ({approvedVenues.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedVenues.map((venue) => (
                    <Card key={venue.id} className="border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{venue.business_name}</h3>
                          <Badge variant={getStatusBadgeVariant(venue.status)}>
                            {venue.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {venue.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {rejectedVenues.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-red-600">
                  Rejected Venues ({rejectedVenues.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedVenues.map((venue) => (
                    <Card key={venue.id} className="border-red-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{venue.business_name}</h3>
                          <Badge variant={getStatusBadgeVariant(venue.status)}>
                            {venue.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {venue.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateVenueStatus(venue.id, 'approved')}
                          disabled={processingVenues.has(venue.id)}
                          className="mt-3 w-full"
                        >
                          Re-approve
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;