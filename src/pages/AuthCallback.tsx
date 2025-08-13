import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL and check for auth parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        console.log('Auth callback received:', { token: !!token, type });
        
        if (token && type === 'magiclink') {
          // Process the magic link
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink'
          });
          
          if (error) {
            console.error('Magic link verification error:', error);
            toast.error(`Authentication failed: ${error.message}`);
            navigate('/sign-in');
          } else {
            console.log('Magic link verification successful:', data);
            toast.success('Successfully signed in!');
            navigate('/');
          }
        } else {
          console.log('No auth parameters found, redirecting to sign in');
          navigate('/sign-in');
        }
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