import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';

interface EventWithVenue {
  id: string;
  group_name: string;
  proposed_date: string;
  rsvp_deadline: string;
  custom_message: string | null;
  approval_status: string;
  status: string;
  venue: {
    business_name: string;
    address: string;
  };
  creator: {
    display_name: string;
  };
}

interface ResendInvitationDialogProps {
  event: EventWithVenue | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResendInvitationDialog = ({ event, isOpen, onClose }: ResendInvitationDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    if (!event || !email.trim()) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-event-invitations', {
        body: {
          invitationId: event.id,
          recipientEmail: email.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Event invitation sent successfully to ${email}`,
      });

      setEmail('');
      onClose();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error sending invitation",
        description: error.message || "Please try again.",
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
            <Mail className="h-5 w-5" />
            Resend Event Invitation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="font-medium">{event.group_name}</div>
            <div className="text-sm text-muted-foreground">
              {event.venue.business_name} • {new Date(event.proposed_date).toLocaleDateString()}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Member Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member email address..."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Send this event invitation to a specific member who may have missed it.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !email.trim()} 
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};