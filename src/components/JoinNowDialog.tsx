import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface JoinNowDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinNowDialog = ({ isOpen, onClose }: JoinNowDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const memberData = {
        firstName,
        lastName,
        email,
        displayName: `${firstName} ${lastName}`,
        joinedAt: new Date().toISOString()
      };

      // Store member data in localStorage
      localStorage.setItem('gg_member', JSON.stringify(memberData));

      // Trigger storage event for other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gg_member',
        newValue: JSON.stringify(memberData)
      }));

      // Try to create member in database via edge function
      try {
        await supabase.functions.invoke('create-simple-member', {
          body: memberData
        });
      } catch (dbError) {
        console.log('Database sync failed, continuing with local storage:', dbError);
      }

      toast.success("Welcome to Galloping Geezers! You now have instant access to all features.");
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      onClose();

    } catch (error: any) {
      console.error('Join error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Join Galloping Geezers
          </DialogTitle>
          <DialogDescription>
            Enter your details for instant access to all features
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={handleInputChange(setFirstName)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={handleInputChange(setLastName)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Joining..." : "Join Now for Instant Access"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinNowDialog;