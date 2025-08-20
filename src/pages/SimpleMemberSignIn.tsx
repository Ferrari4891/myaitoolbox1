import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SimpleMemberSignIn = () => {
  const [email, setEmail] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

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

      // Small delay to ensure auth state updates before redirect
      setTimeout(() => {
        navigate('/');
      }, 100);

    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Member Sign In
            </CardTitle>
            <CardDescription>
              Enter your email address to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
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

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account yet?{' '}
                <a 
                  href="#/join-now" 
                  className="text-primary hover:underline font-medium"
                >
                  Join Now
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleMemberSignIn;