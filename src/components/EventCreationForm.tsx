import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface Venue {
  id: string;
  name: string;
  business_name?: string;
}

const EventCreationForm = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { member, isMember } = useSimpleAuth();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    venue_id: '',
    max_attendees: '',
    rsvp_deadline: '',
    event_type: 'dining'
  });

  // Check if user is authenticated (either admin or simple member)
  const isUserAuthenticated = isAuthenticated || isMember;

  useEffect(() => {
    if (isUserAuthenticated) {
      fetchVenues();
    }
  }, [isUserAuthenticated]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, business_name')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUserAuthenticated) {
      toast.error('You must be signed in to create an event');
      return;
    }

    if (!formData.title || !formData.event_date) {
      toast.error('Please provide a title and event date');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        end_date: formData.end_date || null,
        venue_id: formData.venue_id || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        rsvp_deadline: formData.rsvp_deadline || null,
        event_type: formData.event_type,
        created_by: user?.id || member?.email, // Use admin user ID or simple member email as string
        status: 'active'
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      toast.success('Event created successfully!');
      navigate('/message-board');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-elegant text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Sign In Required</CardTitle>
              <CardDescription>
                You have to be signed in as a member to use this function. Join now It's FREE!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/join-now')} className="w-full">
                Join Now - It's FREE!
              </Button>
              <Button variant="outline" onClick={() => navigate('/member-sign-in')} className="w-full">
                Sign In as Member
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Create Event</CardTitle>
            <CardDescription>
              Schedule a new event for the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Event description and details"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date & Time *</Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue</Label>
                <Select value={formData.venue_id} onValueChange={(value) => setFormData(prev => ({ ...prev, venue_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.business_name || venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select value={formData.event_type} onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    name="max_attendees"
                    type="number"
                    min="1"
                    value={formData.max_attendees}
                    onChange={handleInputChange}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
                <Input
                  id="rsvp_deadline"
                  name="rsvp_deadline"
                  type="datetime-local"
                  value={formData.rsvp_deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCreationForm;