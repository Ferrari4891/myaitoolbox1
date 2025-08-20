import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInDialog = ({ isOpen, onClose }: SignInDialogProps) => {
  const [email, setEmail] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);

    try {
      // Call edge function to verify member exists
      const { data, error } = await supabase.functions.invoke('verify-simple-member', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (!data.exists) {
        toast.error("Email not found. Please join first or check your email address.");
        return;
      }

      // Store member data in localStorage
      const memberData = {
        firstName: data.member.first_name,
        lastName: data.member.last_name,
        email: data.member.email,
        displayName: data.member.display_name,
        joinedAt: data.member.joined_at
      };

      localStorage.setItem('gg_member', JSON.stringify(memberData));

      // Trigger storage event for other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gg_member',
        newValue: JSON.stringify(memberData)
      }));

      toast.success("Welcome back! You're now signed in.");

      // Reset form and close dialog
      setEmail('');
      onClose();

    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Member Sign In
          </DialogTitle>
          <DialogDescription>
            Enter your email address to sign in to your account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSigningIn}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth"
            disabled={isSigningIn}
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;