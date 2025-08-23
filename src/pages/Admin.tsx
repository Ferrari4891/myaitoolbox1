import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Facebook, Check, X, Users, Trash2, Calendar, CalendarIcon, Clock, CheckCircle, XCircle, Settings, Edit, MessageCircle, UserCheck, Mail, UserPlus } from "lucide-react";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { EditEventDialog } from "@/components/EditEventDialog";
import { ResendInvitationDialog } from "@/components/ResendInvitationDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import SimpleMemberManagement from "@/components/SimpleMemberManagement";
import MessageBoardAdmin from "@/components/MessageBoardAdmin";
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

      console.log('Fetched members from database:', profilesData);
      console.log('Tony Cook profiles found:', profilesData?.filter(p => p.email === 'tonycook396@gmail.com'));

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

  const unblockUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to unblock ${email}? They will be able to create a profile again.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User unblocked",
        description: `${email} has been unblocked and can now create a profile.`,
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      });
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
      // Temporarily disable new member notifications to prevent deleted users from reappearing
      // .on(
      //   'postgres_changes',
      //   {
      //     event: 'INSERT',
      //     schema: 'public',
      //     table: 'profiles'
      //   },
      //   (payload) => {
      //     const newMember = payload.new as RecentMember;
      //     setRecentMembers(prev => [newMember, ...prev.slice(0, 9)]);
      //     
      //     toast({
      //       title: "New Member Joined!",
      //       description: `${newMember.display_name || 'New user'} just signed up`,
      //     });
      //   }
      // )
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
      
      console.log('Permanently removing member:', memberToDelete);
      
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
        console.log('Updated member list after deletion. Remaining members:', updated.length);
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
      console.log('Blocking member:', email);
      
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
      console.log('Unblocking member:', email);
      
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
            Manage venue submissions and event approvals
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

        {/* Event Management Section */}
        <Card className="mb-8">
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
              <div className="space-y-6">
                {events.map((event, index) => (
                  <div key={event.id}>
                    <div className="space-y-4">
                      {/* Main Event Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-lg">{event.group_name}</h3>
                          <p className="text-sm text-muted-foreground">{event.venue.business_name}</p>
                          <p className="text-sm text-muted-foreground">
                            By: {event.creator.display_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Event Date</p>
                          <p className="text-sm">{new Date(event.proposed_date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            RSVP by: {new Date(event.rsvp_deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Status</p>
                          {getEventStatusBadge(event.approval_status, event.status)}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {/* Edit button for all events */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            disabled={processingEvents.has(event.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit event"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Approval buttons for pending events */}
                          {event.approval_status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventApproval(event.id, 'approved')}
                                disabled={processingEvents.has(event.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve event"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventApproval(event.id, 'rejected')}
                                disabled={processingEvents.has(event.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Reject event"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {/* Management buttons for approved events */}
                          {event.approval_status === 'approved' && event.status !== 'cancelled' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(event)}
                                disabled={processingEvents.has(event.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Resend invitation"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventCancellation(event.id)}
                                disabled={processingEvents.has(event.id)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Cancel event"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventRemoval(event.id)}
                                disabled={processingEvents.has(event.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remove event permanently"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {/* Remove button for cancelled events */}
                          {event.status === 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEventRemoval(event.id)}
                              disabled={processingEvents.has(event.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Remove event permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* RSVP Information - Second Line */}
                      <div className="p-4 bg-background border rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          RSVP Responses
                        </h4>
                        {event.rsvps && event.rsvps.length > 0 ? (
                          <div className="space-y-4">
                            {/* RSVP Summary */}
                            <div className="flex gap-6">
                              <div className="flex items-center gap-2 text-green-600">
                                <UserCheck className="h-4 w-4" />
                                <span className="font-medium">
                                  {event.rsvps.filter(r => r.response === 'yes').length} Yes
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-red-600">
                                <X className="h-4 w-4" />
                                <span className="font-medium">
                                  {event.rsvps.filter(r => r.response === 'no').length} No
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-yellow-600">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {event.rsvps.filter(r => r.response === 'maybe').length} Maybe
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="font-medium">
                                  {event.rsvps.filter(r => !r.response).length} No Response
                                </span>
                              </div>
                            </div>

                            {/* RSVP Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {event.rsvps.map((rsvp) => (
                                <div key={rsvp.id} className="p-3 border rounded-md bg-muted/10">
                                  <div className="font-medium text-sm">{rsvp.invitee_email}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={
                                        rsvp.response === 'yes' ? 'default' : 
                                        rsvp.response === 'no' ? 'destructive' : 
                                        rsvp.response === 'maybe' ? 'secondary' : 'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {rsvp.response || 'No response'}
                                    </Badge>
                                    {rsvp.guest_count && rsvp.guest_count > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{rsvp.guest_count - 1} guests
                                      </span>
                                    )}
                                  </div>
                                  {rsvp.response_message && (
                                    <div className="text-xs italic text-muted-foreground mt-2 bg-muted/20 p-2 rounded">
                                      "{rsvp.response_message}"
                                    </div>
                                  )}
                                  {rsvp.responded_at && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {new Date(rsvp.responded_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No RSVP responses yet</p>
                        )}
                      </div>
                    </div>

                    {/* Black separator line between events */}
                    {index < events.length - 1 && (
                      <div className="my-6">
                        <div className="h-px bg-black"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple Member Management Section */}
        <SimpleMemberManagement />

        {/* Message Board Management Section */}
        <MessageBoardAdmin />

        {/* Recent Members Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Directory
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
                            <div>{new Date(member.member_since).toLocaleDateString()}</div>
                            <div className="text-xs opacity-75">
                              {new Date(member.member_since).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => blockMember(member.email || '', 'Blocked by admin')}
                              disabled={!member.email || member.is_admin}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Block
                            </Button>
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
                              {removingMembers.has(member.id) ? 'Removing...' : 'Delete'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked Users Section */}
        {blockedUsers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Blocked Users ({blockedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Email</th>
                      <th className="text-left py-2 px-3 font-medium">Reason</th>
                      <th className="text-left py-2 px-3 font-medium">Blocked Date</th>
                      <th className="text-left py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="font-medium">{user.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm text-muted-foreground">
                            {user.reason || 'No reason specified'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unblockMember(user.email)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Unblock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

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

        <EditEventDialog 
          event={editingEvent}
          isOpen={isEditDialogOpen}
          onClose={handleEditDialogClose}
          onEventUpdated={handleEventUpdated}
        />

        <ResendInvitationDialog 
          event={resendingEvent}
          isOpen={isResendDialogOpen}
          onClose={handleResendDialogClose}
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