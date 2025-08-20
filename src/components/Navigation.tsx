import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth(); // Keep for admin functionality
  const { isMember, member, signOut: simpleMemberSignOut } = useSimpleAuth(); // New simple auth
  const { toast } = useToast();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Clean up auth state utility
  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignOut = async () => {
    try {
      if (isMember) {
        // Sign out simple member
        simpleMemberSignOut();
        toast({
          title: "Signed out successfully",
          description: "You have been logged out."
        });
      } else if (isAuthenticated) {
        // Sign out admin user
        cleanupAuthState();
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.log('Global signout failed, continuing with cleanup');
        }
        toast({
          title: "Signed out successfully",
          description: "You have been logged out of your admin account."
        });
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const menuItems = [
    { label: "Home", path: "/" },
    ...(isMember || isAuthenticated 
      ? [
          { label: "Approved Venues", path: "/approved-venues" },
          { label: "Add Venue", path: "/add-venue" },
          { label: "Schedule Event", path: "/schedule-event" },
        ]
      : [
          { label: "Join Now", path: "/join-now", isButton: true },
          { label: "How To", path: "/how-to" },
          { label: "Approved Venues", path: "/approved-venues" },
        ]
    )
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary shadow-elegant relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Site Name */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/c6be71fd-5746-49b1-bbe4-646fad1ff624.png" 
              alt="Gallopinggeezers Logo" 
              className="h-12 w-12"
            />
            <span className="text-xl font-bold text-primary-foreground">Gallopinggeezers.online</span>
          </Link>

          {/* Hamburger Menu Button */}
          <div
            onClick={toggleMenu}
            className="text-primary-foreground hover:bg-primary/20 transition-smooth p-2 rounded-md cursor-pointer flex items-center justify-center"
            aria-label="Toggle menu"
            style={{ width: '48px', height: '48px' }}
          >
            {isOpen ? <X size={48} strokeWidth={2} /> : <Menu size={48} strokeWidth={2} />}
          </div>
        </div>

        {/* Mobile Menu - Slide out from left */}
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-elegant z-40 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const commonClasses = `block w-full text-left ${
                item.isButton
                  ? "bg-primary text-white font-semibold py-3 px-4 rounded-md hover:bg-primary/90"
                  : `text-gray-800 hover:bg-gray-100 py-2 px-4 rounded-md ${
                      isActive(item.path) ? "bg-gray-100 font-semibold" : ""
                    }`
              } transition-smooth`;

              return item.path === "/join-now" ? (
                <a
                  key={item.path}
                  href="#/join-now"
                  onClick={() => setIsOpen(false)}
                  className={commonClasses}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={commonClasses}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {(isMember || isAuthenticated) && (
              <>
                {isAuthenticated && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left text-gray-800 hover:bg-gray-100 py-2 px-4 rounded-md transition-smooth"
                  >
                    Admin Panel
                  </Link>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full justify-start text-gray-800 hover:bg-gray-100 transition-smooth"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            )}
            
            {/* Admin Sign In - Always visible at bottom */}
            <div className="border-t pt-4 mt-4">
              <Link
                to="/admin-sign-in"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm text-gray-600 hover:text-gray-800 py-2 px-4 rounded-md transition-smooth"
              >
                Admin Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Backdrop overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 top-16"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </nav>
  );
};

export default Navigation;