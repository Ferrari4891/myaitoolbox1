import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, Users, Mail, UserCheck } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


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
  inviteType: z.enum(["all", "select"], {
    required_error: "Please select invitation type",
  }),
  selectedMembers: z.array(z.string()).optional(),
  customMessage: z.string().optional(),
}).refine((data) => {
  if (data.inviteType === "select" && (!data.selectedMembers || data.selectedMembers.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one member to invite",
  path: ["selectedMembers"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface Venue {
  id: string;
  business_name: string;
  address: string;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

const ScheduleEvent = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
      inviteType: "all",
      selectedMembers: [],
      customMessage: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch approved venues and members
    const fetchData = async () => {
      try {
        // Fetch venues
        const { data: venuesData, error: venuesError } = await supabase
          .from("venues")
          .select("id, business_name, address")
          .eq("status", "approved")
          .order("business_name");

        if (venuesError) throw venuesError;
        setVenues(venuesData || []);

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from("profiles")
          .select("id, user_id, display_name, email, first_name, last_name")
          .order("display_name");

        if (membersError) throw membersError;
        setMembers(membersData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
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

      // Create group invitation with pending status (no longer auto-sends emails)
      const { data: invitation, error: invitationError } = await supabase
        .from("group_invitations")
        .insert({
          creator_id: user.id,
          group_name: `${data.eventType} at ${venues.find(v => v.id === data.venueId)?.business_name}`,
          venue_id: data.venueId,
          proposed_date: proposedDate.toISOString(),
          rsvp_deadline: data.rsvpDeadline.toISOString(),
          custom_message: data.customMessage || `Join us for ${data.eventType.toLowerCase()} organized by ${data.memberName}!`,
          approval_status: 'pending'
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      toast({
        title: "Event submitted successfully!",
        description: "Your event has been submitted for admin approval. You'll be notified once it's approved and invitations are sent.",
      });

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6" />
                CREATE A GEEZER EVENT
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

                  {/* Invitation Type Selection */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="inviteType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Who would you like to invite?
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select invitation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">📢 Invite all members</SelectItem>
                              <SelectItem value="select">👥 Select specific members</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Member Selection - Only show when "select" is chosen */}
                    {form.watch("inviteType") === "select" && (
                      <FormField
                        control={form.control}
                        name="selectedMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Members to Invite</FormLabel>
                            <Card className="p-4 max-h-60 overflow-y-auto">
                              <div className="space-y-3">
                                {members.map((member) => {
                                  const displayName = member.display_name || 
                                    `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
                                    member.email || 
                                    'Unknown Member';
                                  
                                  return (
                                    <div key={member.user_id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={member.user_id}
                                        checked={field.value?.includes(member.user_id) || false}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, member.user_id]);
                                          } else {
                                            field.onChange(current.filter(id => id !== member.user_id));
                                          }
                                        }}
                                      />
                                      <Label 
                                        htmlFor={member.user_id} 
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div>
                                          <div className="font-medium">{displayName}</div>
                                          {member.email && (
                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                          )}
                                        </div>
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                              {members.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                  No members found
                                </p>
                              )}
                            </Card>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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