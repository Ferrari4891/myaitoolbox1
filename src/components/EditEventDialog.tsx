import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Save, Facebook } from 'lucide-react';

interface EventWithVenue {
  id: string;
  group_name: string;
  proposed_date: string;
  rsvp_deadline: string;
  custom_message: string | null;
  approval_status: string;
  status: string;
  invite_token?: string;
  venue: {
    business_name: string;
    address: string;
  };
  creator: {
    display_name: string;
  };
}

interface EditEventDialogProps {
  event: EventWithVenue | null;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
}

export const EditEventDialog = ({ event, isOpen, onClose, onEventUpdated }: EditEventDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  
  const [formData, setFormData] = useState({
    group_name: event?.group_name || '',
    proposed_date: event?.proposed_date ? new Date(event.proposed_date).toISOString().slice(0, 16) : '',
    rsvp_deadline: event?.rsvp_deadline ? new Date(event.rsvp_deadline).toISOString().slice(0, 16) : '',
    custom_message: event?.custom_message || '',
  });

  React.useEffect(() => {
    if (event) {
      setFormData({
        group_name: event.group_name,
        proposed_date: new Date(event.proposed_date).toISOString().slice(0, 16),
        rsvp_deadline: new Date(event.rsvp_deadline).toISOString().slice(0, 16),
        custom_message: event.custom_message || '',
      });
    }
  }, [event]);

  const handleShareToFacebook = () => {
    if (!event) return;
    
    const eventUrl = `${window.location.origin}/#/event-rsvp?token=${event.invite_token || event.id}`;
    const eventText = `🎉 Join us for "${formData.group_name}"!

📍 Venue: ${event.venue.business_name}
📅 Date: ${new Date(formData.proposed_date).toLocaleDateString()} at ${new Date(formData.proposed_date).toLocaleTimeString()}
⏰ RSVP by: ${new Date(formData.rsvp_deadline).toLocaleDateString()}

${formData.custom_message ? `📝 ${formData.custom_message}` : ''}

Click here to RSVP: ${eventUrl}`;

    // Open Facebook share dialog
    const facebookShareUrl = `https://www.facebook.com/share.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(eventText)}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: "Facebook share opened",
      description: "You can now post this to your Facebook group!",
    });
  };

  const handleSave = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      // Update the event
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({
          group_name: formData.group_name,
          proposed_date: formData.proposed_date,
          rsvp_deadline: formData.rsvp_deadline,
          custom_message: formData.custom_message,
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      // Send notification if requested
      if (sendNotification) {
        const { error: emailError } = await supabase.functions.invoke('send-event-invitations', {
          body: { 
            invitationId: event.id,
            isUpdate: true 
          }
        });

        if (emailError) {
          console.error('Error sending update notifications:', emailError);
          toast({
            title: "Event updated but notification failed",
            description: "The event was updated successfully, but we couldn't send notification emails.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Event updated and notifications sent",
            description: "All members have been notified of the event updates.",
          });
        }
      } else {
        toast({
          title: "Event updated",
          description: "Event details have been saved successfully.",
        });
      }

      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error updating event",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Edit Event
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="group_name">Event Name</Label>
            <Input
              id="group_name"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              placeholder="Enter event name"
            />
          </div>

          <div>
            <Label htmlFor="proposed_date">Event Date</Label>
            <Input
              id="proposed_date"
              type="datetime-local"
              value={formData.proposed_date}
              onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
            <Input
              id="rsvp_deadline"
              type="datetime-local"
              value={formData.rsvp_deadline}
              onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="custom_message">Custom Message</Label>
            <Textarea
              id="custom_message"
              value={formData.custom_message}
              onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
              placeholder="Add a custom message for members"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send_notification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked === true)}
            />
            <Label htmlFor="send_notification" className="text-sm">
              Send update notification to all members
            </Label>
          </div>

          <div className="space-y-2 pt-4">
            <Button 
              onClick={handleShareToFacebook} 
              variant="outline" 
              className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Share to Facebook Group
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};