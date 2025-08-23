import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Facebook, Check, X, Users, Trash2, Calendar, CalendarIcon, Clock, CheckCircle, XCircle, Settings, Edit, MessageCircle, UserCheck, Mail, UserPlus, Building2, UtensilsCrossed } from "lucide-react";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { EditEventDialog } from "@/components/EditEventDialog";
import { ResendInvitationDialog } from "@/components/ResendInvitationDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import SimpleMemberManagement from "@/components/SimpleMemberManagement";
import MessageBoardAdmin from "@/components/MessageBoardAdmin";
import VenueManagement from "@/components/admin/VenueManagement";
import CuisineManagement from "@/components/admin/CuisineManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  member_since: string;
  user_id: string;
  email: string | null;
  is_admin?: boolean;
  age_group?: string;
  gender?: string;
}

interface BlockedUser {
  id: string;
  email: string;
  reason?: string;
  created_at: string;
  blocked_by?: string;
}

interface EventWithVenue {
  id: string;
  group_name: string;
  proposed_date: string;
  rsvp_deadline: string;
  custom_message: string;
  approval_status: string;
  status: string;
  created_at: string;
  creator_id: string;
  venue: {
    business_name: string;
    address: string;
  };
  creator: {
    display_name: string;
  };
  rsvps?: RSVPResponse[];
}

interface RSVPResponse {
  id: string;
  invitee_email: string;
  response: string | null;
  guest_count: number | null;
  response_message: string | null;
  responded_at: string | null;
}

const Admin = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingVenues, setProcessingVenues] = useState<Set<string>>(new Set());
  const [removingMembers, setRemovingMembers] = useState<Set<string>>(new Set());
  const [processingEvents, setProcessingEvents] = useState<Set<string>>(new Set());
  const [editingEvent, setEditingEvent] = useState<EventWithVenue | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resendingEvent, setResendingEvent] = useState<EventWithVenue | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberTypeToAdd, setMemberTypeToAdd] = useState<'admin' | 'simple'>('admin');
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
        fetchBlockedUsers();
        fetchEvents();
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
        .select('*, business_name')
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
        .select('id, first_name, last_name, created_at, user_id, is_admin, email')
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) throw profilesError;

      setRecentMembers(profilesData?.map(p => ({
        ...p,
        display_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
        member_since: p.created_at
      })) || []);
    } catch (error) {
      console.error('Error fetching recent members:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("group_invitations")
        .select(`
          id,
          group_name,
          proposed_date,
          rsvp_deadline,
          custom_message,
          approval_status,
          status,
          created_at,
          creator_id,
          venue_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data with venue and creator info
      const transformedEvents: EventWithVenue[] = [];
      
      for (const event of data || []) {
        // Fetch venue info
        const { data: venueData } = await supabase
          .from("venues")
          .select("business_name, address")
          .eq("id", event.venue_id)
          .single();
          
        // Fetch creator info
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("user_id", event.creator_id)
          .single();

        // Fetch RSVP responses for this event
        const { data: rsvpData } = await supabase
          .from("invitation_rsvps")
          .select("id, invitee_email, response, guest_count, response_date")
          .eq("invitation_id", event.id)
          .order("responded_at", { ascending: false });
        
        transformedEvents.push({
          id: event.id,
          group_name: event.group_name,
          proposed_date: event.proposed_date,
          rsvp_deadline: event.rsvp_deadline,
          custom_message: event.custom_message,
          approval_status: event.approval_status,
          status: event.status,
          created_at: event.created_at,
          creator_id: event.creator_id,
          venue: {
            business_name: venueData?.business_name || 'Unknown Venue',
            address: venueData?.address || 'Unknown Address'
          },
          creator: {
            display_name: `${creatorData?.first_name || ''} ${creatorData?.last_name || ''}`.trim() || 'Unknown Creator'
          },
          rsvps: rsvpData?.map(r => ({
            ...r,
            response_message: '',
            responded_at: r.response_date
          })) || []
        });
      }
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      });
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
      `Are you sure you want to permanently remove ${memberName || 'this member'}? This will delete ALL their data and cannot be undone.`
    );
    
    if (!confirmRemoval) return;
    
    setRemovingMembers(prev => new Set(prev).add(memberId));
    
    try {
      // Get member email and user_id to delete completely
      const { data: memberToDelete } = await supabase
        .from('profiles')
        .select('email, user_id')
        .eq('id', memberId)
        .single();
      
      if (!memberToDelete?.user_id || !memberToDelete?.email) {
        throw new Error('Cannot find member data for deletion');
      }
      
      // Use the purge-member edge function for complete deletion
      const { data, error } = await supabase.functions.invoke('purge-member', {
        body: { 
          userId: memberToDelete.user_id, 
          email: memberToDelete.email 
        }
      });

      if (error) {
        console.error('Error calling purge-member function:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to purge member data');
      }
      
      // Update local state - remove all members with same email
      setRecentMembers(prev => {
        const updated = prev.filter(member => member.email !== memberToDelete.email);
        return updated;
      });

      toast({
        title: "Member Permanently Removed",
        description: `${memberName || 'Member'} and all their data has been permanently deleted.`,
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member. Please try again.",
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

  const blockMember = async (email: string, reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          email,
          reason: reason || 'Blocked by admin',
          blocked_by: user?.id
        });

      if (error) {
        console.error('Error blocking member:', error);
        throw error;
      }

      // Refresh data
      await Promise.all([fetchRecentMembers(), fetchBlockedUsers()]);
      
      toast({
        title: "Success",
        description: `${email} has been blocked.`,
      });
    } catch (error: any) {
      console.error('Error blocking member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to block member",
        variant: "destructive",
      });
    }
  };

  const unblockMember = async (email: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('Error unblocking member:', error);
        throw error;
      }

      // Refresh data
      await Promise.all([fetchRecentMembers(), fetchBlockedUsers()]);
      
      toast({
        title: "Success",
        description: `${email} has been unblocked.`,
      });
    } catch (error: any) {
      console.error('Error unblocking member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unblock member",
        variant: "destructive",
      });
    }
  };

  const handleEventApproval = async (eventId: string, status: 'approved' | 'rejected') => {
    setProcessingEvents(prev => new Set(prev).add(eventId));
    try {
      // Update event status  
      const { error: updateError } = await supabase
        .from("group_invitations")
        .update({ 
          approval_status: status,
          status: status === 'approved' ? 'active' : 'rejected'
        })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // If approved, send invitations
      if (status === 'approved') {
        const event = events.find(e => e.id === eventId);
        if (event) {
          // Get the actual invite token from the database
          const { data: invitationData, error: tokenError } = await supabase
            .from('group_invitations')
            .select('invite_token')
            .eq('id', eventId)
            .single();

          if (tokenError) {
            console.error('Error fetching invite token:', tokenError);
            toast({
              title: "Error",
              description: "Failed to get invitation token.",
              variant: "destructive",
            });
            return;
          }

          const { error: emailError } = await supabase.functions.invoke('send-event-invitations', {
            body: {
              invitationId: eventId,
              eventDetails: {
                eventType: event.group_name.includes('Coffee') ? 'Coffee' : 
                           event.group_name.includes('Lunch') ? 'Lunch' : 'Dinner',
                memberName: event.creator.display_name,
                venue: event.venue,
                proposedDate: event.proposed_date,
                rsvpDeadline: event.rsvp_deadline,
                customMessage: event.custom_message,
                inviteToken: invitationData.invite_token
              }
            }
          });

          if (emailError) {
            console.error("Email sending failed:", emailError);
            toast({
              title: "Event approved, but email failed",
              description: "Event was approved but invitations couldn't be sent.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Event approved!",
              description: "Invitations have been sent to all members.",
            });
          }
        }
      } else {
        // Send rejection notification to event creator
        const event = events.find(e => e.id === eventId);
        if (event) {
          const { error: emailError } = await supabase.functions.invoke('send-event-rejection', {
            body: {
              eventId: eventId,
              eventDetails: {
                eventType: event.group_name.includes('Coffee') ? 'Coffee' : 
                           event.group_name.includes('Lunch') ? 'Lunch' : 'Dinner',
                memberName: event.creator.display_name,
                venue: event.venue,
                proposedDate: event.proposed_date,
                creatorId: event.creator_id
              }
            }
          });

          if (emailError) {
            console.error("Rejection email failed:", emailError);
          }
        }
        
        toast({
          title: "Event rejected",
          description: "The event has been rejected and creator notified.",
        });
      }

      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event status.",
        variant: "destructive",
      });
    } finally {
      setProcessingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const handleEventCancellation = async (eventId: string) => {
    setProcessingEvents(prev => new Set(prev).add(eventId));
    try {
      // Update event status to cancelled
      const { error: updateError } = await supabase
        .from("group_invitations")
        .update({ 
          status: 'cancelled'
        })
        .eq("id", eventId);

      if (updateError) throw updateError;

      toast({
        title: "Event cancelled",
        description: "The event has been cancelled successfully.",
      });

      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const handleEventRemoval = async (eventId: string) => {
    if (!confirm("Are you sure you want to permanently remove this event? This action cannot be undone.")) {
      return;
    }

    setProcessingEvents(prev => new Set(prev).add(eventId));
    try {
      // Delete the event permanently
      const { error: deleteError } = await supabase
        .from("group_invitations")
        .delete()
        .eq("id", eventId);

      if (deleteError) throw deleteError;

      toast({
        title: "Event removed",
        description: "The event has been permanently removed.",
      });

      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error("Error removing event:", error);
      toast({
        title: "Error",
        description: "Failed to remove the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const getEventStatusBadge = (approvalStatus: string, eventStatus?: string) => {
    switch (approvalStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        if (eventStatus === 'cancelled') {
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>;
        }
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{approvalStatus}</Badge>;
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

  const handleEditEvent = (event: EventWithVenue) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingEvent(null);
  };

  const handleEventUpdated = () => {
    fetchEvents();
  };

  const handleResendInvitation = (event: EventWithVenue) => {
    setResendingEvent(event);
    setIsResendDialogOpen(true);
  };

  const handleResendDialogClose = () => {
    setIsResendDialogOpen(false);
    setResendingEvent(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
  const pendingEvents = events.filter(e => e.approval_status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Admin Panel
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive management dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingVenues.length}</div>
                <div className="text-sm text-muted-foreground">Pending Venues</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedVenues.length}</div>
                <div className="text-sm text-muted-foreground">Approved Venues</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedVenues.length}</div>
                <div className="text-sm text-muted-foreground">Rejected Venues</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingEvents.length}</div>
                <div className="text-sm text-muted-foreground">Pending Events</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="venues">
              <Building2 className="h-4 w-4 mr-2" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="cuisines">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Cuisines
            </TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SimpleMemberManagement />
            <MessageBoardAdmin />
          </TabsContent>

          <TabsContent value="venues">
            <VenueManagement />
          </TabsContent>

          <TabsContent value="cuisines">
            <CuisineManagement />
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No events yet</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{event.group_name}</h3>
                            <p className="text-sm text-muted-foreground">{event.venue.business_name}</p>
                            <p className="text-sm text-muted-foreground">By: {event.creator.display_name}</p>
                          </div>
                          <Badge variant={event.approval_status === 'approved' ? 'default' : 'secondary'}>
                            {event.approval_status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Member Directory
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setMemberTypeToAdd('admin');
                        setIsAddMemberDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Administrator
                    </Button>
                    <Button
                      onClick={() => {
                        setMemberTypeToAdd('simple');
                        setIsAddMemberDialogOpen(true);
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Simple Member
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentMembers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">
                            {member.first_name && member.last_name 
                              ? `${member.first_name} ${member.last_name}`
                              : member.display_name || 'Name not provided'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <Badge variant={member.is_admin ? "default" : "outline"}>
                          {member.is_admin ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <EditEventDialog 
          event={editingEvent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onEventUpdated={fetchEvents}
        />

        <ResendInvitationDialog 
          event={resendingEvent}
          isOpen={isResendDialogOpen}
          onClose={() => setIsResendDialogOpen(false)}
        />

        <AddMemberDialog 
          open={isAddMemberDialogOpen}
          onClose={() => setIsAddMemberDialogOpen(false)}
          memberType={memberTypeToAdd}
          onMemberAdded={fetchRecentMembers}
        />
      </main>
    </div>
  );
};

export default Admin;
