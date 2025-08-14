import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarIcon, MapPinIcon, Users, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";

interface EventWithVenue {
  id: string;
  group_name: string;
  proposed_date: string;
  rsvp_deadline: string;
  custom_message: string;
  approval_status: string;
  created_at: string;
  creator_id: string;
  venue: {
    business_name: string;
    address: string;
  };
  creator: {
    display_name: string;
  };
}

export default function EventManagement() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resendingEventId, setResendingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin-signin");
      return;
    }
    checkAdminAndFetchEvents();
  }, [isAuthenticated, navigate]);

  const checkAdminAndFetchEvents = async () => {
    try {
      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user?.id)
        .single();

      if (!profile?.is_admin) {
        navigate("/");
        return;
      }

      await fetchEvents();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
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
          created_at,
          creator_id,
          venue_id
        `)
        .in("approval_status", ["pending", "approved"])
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
          .select("display_name")
          .eq("user_id", event.creator_id)
          .single();
        
        transformedEvents.push({
          id: event.id,
          group_name: event.group_name,
          proposed_date: event.proposed_date,
          rsvp_deadline: event.rsvp_deadline,
          custom_message: event.custom_message,
          approval_status: event.approval_status,
          created_at: event.created_at,
          creator_id: event.creator_id,
          venue: {
            business_name: venueData?.business_name || 'Unknown Venue',
            address: venueData?.address || 'Unknown Address'
          },
          creator: {
            display_name: creatorData?.display_name || 'Unknown Creator'
          }
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
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (eventId: string, status: 'approved' | 'rejected') => {
    setProcessingId(eventId);
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
                inviteToken: 'placeholder' // Will be handled by the function
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
      setProcessingId(null);
    }
  };

  const handleResendInvitation = async (eventId: string) => {
    if (!resendEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resendEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setResendingEventId(eventId);
    try {
      const { error } = await supabase.functions.invoke('send-individual-invitation', {
        body: {
          invitationId: eventId,
          recipientEmail: resendEmail.trim()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invitation Resent",
        description: `Event invitation sent to ${resendEmail}`,
      });

      setResendEmail("");
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation.",
        variant: "destructive",
      });
    } finally {
      setResendingEventId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <LoadingScreen onLoadingComplete={() => {}} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Back to Admin
        </Button>
      </div>

      <div className="grid gap-6">
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No events found.</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{event.group_name}</CardTitle>
                  {getStatusBadge(event.approval_status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Created by {event.creator.display_name}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="font-medium">Event Date:</span>
                      <span>{new Date(event.proposed_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">RSVP Deadline:</span>
                      <span>{new Date(event.rsvp_deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="font-medium">Venue:</span>
                      <span>{event.venue.business_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      {event.venue.address}
                    </div>
                  </div>
                </div>

                {event.custom_message && (
                  <div className="bg-muted p-3 rounded-lg">
                    <span className="font-medium">Message:</span>
                    <p className="mt-1 text-sm">{event.custom_message}</p>
                  </div>
                )}

                {event.approval_status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApproval(event.id, 'approved')}
                      disabled={processingId === event.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Send Invites
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(event.id, 'rejected')}
                      disabled={processingId === event.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {event.approval_status === 'approved' && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Resend Invitation
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter member email..."
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleResendInvitation(event.id)}
                        disabled={resendingEventId === event.id || !resendEmail.trim()}
                        variant="outline"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {resendingEventId === event.id ? "Sending..." : "Resend"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Send event invitation to a specific member who may have missed it.
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(event.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}