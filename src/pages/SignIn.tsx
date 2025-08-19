import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";


const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        toast.success('Successfully signed in!');
        navigate('/');
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        navigate('/');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);

    try {
      // Clean up auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Successfully signed in!");
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/auth-callback`,
      });

      if (error) throw error;

      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Sign In
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Sign in to your account with your email and password
          </p>
        </div>
      </header>

      {/* Form Section */}
      <main className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Member Sign In</CardTitle>
              <CardDescription>
                {showForgotPassword ? "Enter your email to reset your password" : "Enter your credentials to sign in"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="transition-smooth focus:ring-primary"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isResettingPassword}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-smooth"
                  >
                    {isResettingPassword ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="transition-smooth focus:ring-primary"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="transition-smooth focus:ring-primary"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="keepSignedIn"
                        checked={keepSignedIn}
                        onCheckedChange={(checked) => setKeepSignedIn(checked as boolean)}
                      />
                      <Label htmlFor="keepSignedIn" className="text-sm text-foreground">
                        Keep me signed in
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-smooth"
                  >
                    {isSigningIn ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Not a member yet?{" "}
                  <button
                    onClick={() => { window.location.hash = '/join-now'; }}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Join now
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SignIn;