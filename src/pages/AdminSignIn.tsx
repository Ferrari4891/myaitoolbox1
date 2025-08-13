import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";

const AdminSignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated and is admin
    const checkAdminStatus = async () => {
      if (isAuthenticated && user) {
        setIsCheckingAdmin(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          if (data?.is_admin) {
            toast.success("Welcome back, Admin!");
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        } finally {
          setIsCheckingAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user, navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
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
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          toast.error("Error verifying admin status. Please try again.");
          await supabase.auth.signOut();
          return;
        }

        if (!profile?.is_admin) {
          toast.error("Access denied. Admin privileges required.");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Admin access granted!");
        navigate('/admin');
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid admin credentials. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutAsAdmin = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });
      
      toast.success("Signed out as admin successfully");
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out. Please try again.");
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated admin, show sign out option
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <header className="bg-primary py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Admin Dashboard
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              You are signed in as an administrator
            </p>
          </div>
        </header>

        <main className="py-16">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-elegant">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">Admin Session</CardTitle>
                <CardDescription>
                  Signed in as: {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-smooth"
                >
                  Go to Admin Panel
                </Button>
                
                <Button
                  onClick={handleSignOutAsAdmin}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out as Admin
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <header className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Admin Sign In
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Administrative access required
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Administrator Access</CardTitle>
              <CardDescription>
                Enter your admin credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    placeholder="Enter admin email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Admin Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    placeholder="Enter admin password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-smooth"
                >
                  {isSigningIn ? "Verifying..." : "Sign In as Admin"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Regular member?{" "}
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Member sign in
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

export default AdminSignIn;