import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Support both hash (#) and query (?) params from Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        const code = searchParams.get('code');

        console.log('Auth callback received:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasCode: !!code,
          type,
        });

        if (accessToken && refreshToken) {
          // Set the session directly using tokens (signup, magiclink, invite, recovery)
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session setup error:', error);
            toast.error(`Authentication failed: ${error.message}`);
            navigate('/sign-in');
          } else {
            console.log('Session setup successful:', data);
            toast.success('Successfully signed in!');
            window.history.replaceState({}, document.title, '/');
            navigate('/');
          }
          return;
        }

        if (code) {
          // Handle code exchange links
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            console.error('Code exchange error:', error);
            toast.error(`Authentication failed: ${error.message}`);
            navigate('/sign-in');
          } else {
            console.log('Code exchange successful:', data);
            toast.success('Successfully signed in!');
            window.history.replaceState({}, document.title, '/');
            navigate('/');
          }
          return;
        }

        console.log('No valid auth tokens found, redirecting to sign in');
        navigate('/sign-in');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/sign-in');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Processing sign in...
        </h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;