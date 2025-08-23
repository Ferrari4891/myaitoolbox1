import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, Users, Mail, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


const rsvpSchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
  response: z.enum(["yes", "no"], {
    required_error: "Please select your response",
  }),
  guestCount: z.number().min(1).max(10).optional(),
  responseMessage: z.string().optional(),
});

type RSVPFormData = z.infer<typeof rsvpSchema>;

interface EventDetails {
  id: string;
  group_name: string;
  proposed_date: string;
  rsvp_deadline: string;
  custom_message: string;
  venue?: {
    business_name: string;
    address: string;
    description: string;
    image_1_url?: string;
    image_2_url?: string;
    image_3_url?: string;
    google_maps_link?: string;
    average_rating?: number;
    rating_count?: number;
  };
}

const EventRSVP = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const token = searchParams.get("token");

  const form = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      inviteeEmail: "",
      response: undefined,
      guestCount: 1,
      responseMessage: "",
    },
  });

  const response = form.watch("response");

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid invitation",
        description: "This invitation link is not valid.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        console.log("Fetching event with token:", token);
        
        const { data: invitation, error } = await supabase
          .from("group_invitations")
          .select(`
            id,
            group_name,
            proposed_date,
            rsvp_deadline,
            custom_message,
            approval_status,
            status,
            venue_id
          `)
          .eq("invite_token", token)
          .maybeSingle();

        console.log("Invitation query result:", { invitation, error });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!invitation) {
          console.log("No invitation found for token:", token);
          toast({
            title: "Event Not Found",
            description: "This invitation link is invalid or the event has been cancelled.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Check if event is approved and active
        if (invitation.approval_status !== "approved" || invitation.status !== "active") {
          console.log("Event not approved or not active:", { 
            approval_status: invitation.approval_status, 
            status: invitation.status 
          });
          toast({
            title: "Event Not Available",
            description: "This event is not currently available for RSVP.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Check if RSVP deadline has passed
        if (new Date(invitation.rsvp_deadline) < new Date()) {
          toast({
            title: "RSVP deadline passed",
            description: "The RSVP deadline for this event has already passed.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Get venue details separately
        const { data: venue, error: venueError } = await supabase
          .from("venues")
          .select("business_name, address, description, image_1_url, image_2_url, image_3_url, google_maps_link, average_rating, rating_count")
          .eq("id", invitation.venue_id)
          .maybeSingle();

        console.log("Venue query result:", { venue, venueError });

        if (venueError) {
          console.error("Venue fetch error:", venueError);
        }

        setEventDetails({
          ...invitation,
          venue: venue || undefined,
        });
      } catch (error) {
        console.error("Error fetching event details:", error);
        toast({
          title: "Error",
          description: "Could not load event details. Please check your invitation link.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [token, toast]);

  const onSubmit = async (data: RSVPFormData) => {
    if (!eventDetails) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("invitation_rsvps")
        .insert({
          invitation_id: eventDetails.id,
          invitee_email: data.inviteeEmail,
          response: data.response,
          guest_count: data.response === "yes" ? data.guestCount : null,
          response_message: data.responseMessage,
          responded_at: new Date().toISOString(),
        });

      if (error) {
        // Handle duplicate RSVP case
        if (error.code === "23505" && error.message.includes("invitation_rsvps_invitation_id_invitee_email_key")) {
          toast({
            title: "RSVP Already Submitted",
            description: "You have already submitted an RSVP for this event. Only one response per email address is allowed.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "RSVP submitted successfully!",
        description: `Thank you for ${data.response === "yes" ? "accepting" : "declining"} the invitation.`,
      });
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to submit your RSVP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-pulse">Loading event details...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <X className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground">
                This invitation link is invalid or the event has been cancelled.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Check className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">RSVP Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your response. The event organizer has been notified.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {eventDetails.group_name}
              </CardTitle>
              <CardDescription>
                You're invited to join this Galloping Geezers community event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(eventDetails.proposed_date), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(eventDetails.proposed_date), "p")}</span>
                </div>
                {eventDetails.venue && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{eventDetails.venue.business_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {eventDetails.venue.address}
                    </div>
                  </>
                )}
              </div>
              
              {eventDetails.custom_message && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Message from organizer:</h4>
                  <p className="text-sm">{eventDetails.custom_message}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <strong>RSVP by:</strong> {format(new Date(eventDetails.rsvp_deadline), "PPP")}
              </div>
            </CardContent>
          </Card>

          {/* Venue Details Card */}
          {eventDetails.venue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue Details
                </CardTitle>
                <CardDescription>
                  Learn more about the venue before you decide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Venue Image */}
                  {eventDetails.venue.image_1_url && (
                    <div className="md:w-1/3">
                      <img
                        src={eventDetails.venue.image_1_url}
                        alt={eventDetails.venue.business_name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Venue Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{eventDetails.venue.business_name}</h3>
                      <p className="text-muted-foreground">{eventDetails.venue.address}</p>
                    </div>
                    
                    {eventDetails.venue.description && (
                      <p className="text-sm">{eventDetails.venue.description}</p>
                    )}
                    
                    {eventDetails.venue.average_rating && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-yellow-500">⭐</span>
                        <span>{Number(eventDetails.venue.average_rating).toFixed(1)}</span>
                        {eventDetails.venue.rating_count && (
                          <span className="text-muted-foreground">
                            ({eventDetails.venue.rating_count} reviews)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {eventDetails.venue.google_maps_link && (
                      <a
                        href={eventDetails.venue.google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RSVP Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Your RSVP
              </CardTitle>
              <CardDescription>
                Please let us know if you can attend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="inviteeEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="response"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Can you attend?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="yes" />
                              <label htmlFor="yes" className="text-sm font-medium">
                                ✅ Yes, I'll be there!
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="no" />
                              <label htmlFor="no" className="text-sm font-medium">
                                ❌ Sorry, I can't make it
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {response === "yes" && (
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Number of people (including yourself)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="responseMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special notes or dietary requirements..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Submitting..." : "Submit RSVP"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventRSVP;