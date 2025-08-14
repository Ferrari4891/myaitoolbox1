import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, Users, Mail } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";

const eventSchema = z.object({
  memberName: z.string().min(2, "Member name must be at least 2 characters"),
  eventType: z.enum(["Coffee", "Lunch", "Dinner"], {
    required_error: "Please select an event type",
  }),
  eventDate: z.date({
    required_error: "Please select an event date",
  }),
  eventTime: z.string().min(1, "Please select a time"),
  venueId: z.string().min(1, "Please select a venue"),
  rsvpDeadline: z.date({
    required_error: "Please select an RSVP deadline",
  }),
  customMessage: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Venue {
  id: string;
  business_name: string;
  address: string;
}

const ScheduleEvent = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      memberName: "",
      eventType: undefined,
      eventDate: undefined,
      eventTime: "",
      venueId: "",
      rsvpDeadline: undefined,
      customMessage: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch approved venues
    const fetchVenues = async () => {
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("id, business_name, address")
          .eq("status", "approved")
          .order("business_name");

        if (error) throw error;
        setVenues(data || []);
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast({
          title: "Error",
          description: "Failed to load venues. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchVenues();
  }, [isAuthenticated, toast]);

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to schedule an event.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.eventTime.split(':');
      const proposedDate = new Date(data.eventDate);
      proposedDate.setHours(parseInt(hours), parseInt(minutes));

      // Create group invitation
      const { data: invitation, error: invitationError } = await supabase
        .from("group_invitations")
        .insert({
          creator_id: user.id,
          group_name: `${data.eventType} at ${venues.find(v => v.id === data.venueId)?.business_name}`,
          saved_restaurant_id: data.venueId,
          proposed_date: proposedDate.toISOString(),
          rsvp_deadline: data.rsvpDeadline.toISOString(),
          custom_message: data.customMessage || `Join us for ${data.eventType.toLowerCase()} organized by ${data.memberName}!`,
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      // Send invitation emails
      const { error: emailError } = await supabase.functions.invoke("send-event-invitations", {
        body: {
          invitationId: invitation.id,
          eventDetails: {
            eventType: data.eventType,
            memberName: data.memberName,
            venue: venues.find(v => v.id === data.venueId),
            proposedDate: proposedDate.toISOString(),
            rsvpDeadline: data.rsvpDeadline.toISOString(),
            customMessage: data.customMessage,
            inviteToken: invitation.invite_token,
          },
        },
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        toast({
          title: "Event scheduled, but email failed",
          description: "Your event was created but we couldn't send invitations. Please notify members manually.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Event scheduled successfully!",
          description: "Invitations have been sent to all members.",
        });
      }

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error scheduling event:", error);
      toast({
        title: "Error",
        description: "Failed to schedule event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to schedule events for the Galloping Geezers community.
              </p>
              <Button asChild>
                <a href="/sign-in">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6" />
                Schedule Community Event
              </CardTitle>
              <CardDescription>
                Create a Coffee, Lunch, or Dinner event for the Galloping Geezers community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Desktop Layout - 2 columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="memberName"
                        render={({ field }) => (
                          <FormItem>
                             <FormLabel className="flex items-center gap-2">
                               <Users className="h-4 w-4" />
                               EVENT CREATOR
                             </FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Coffee">☕ Coffee</SelectItem>
                                <SelectItem value="Lunch">🍽️ Lunch</SelectItem>
                                <SelectItem value="Dinner">🍽️ Dinner</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Event Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="eventTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Time
                              </FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="venueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Venue Selection
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a venue" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {venues.map((venue) => (
                                  <SelectItem key={venue.id} value={venue.id}>
                                    <div>
                                      <div className="font-medium">{venue.business_name}</div>
                                      <div className="text-sm text-muted-foreground">{venue.address}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rsvpDeadline"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              RSVP Deadline
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>RSVP by date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Full width section */}
                  <FormField
                    control={form.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a personal message for the invitation..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="min-w-[120px]">
                      {loading ? "Scheduling..." : "Schedule Event & Send Invites"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEvent;