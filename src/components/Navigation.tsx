import { useState, useEffect } from "react";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JoinNowDialog from "@/components/JoinNowDialog";
import SignInDialog from "@/components/SignInDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMenuHierarchy, MenuItem } from "@/hooks/useMenuHierarchy";
import * as icons from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { isMember, member, signOut: simpleMemberSignOut } = useSimpleAuth();
  const { toast } = useToast();
  const { menuItems, loading } = useMenuHierarchy();

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

  const handleRestrictedAction = (action: string) => {
    toast({
      title: "Sign In Required",
      description: "You have to be signed in as a member to use this function. Join now It's FREE!",
      variant: "destructive"
    });
    setShowJoinDialog(true);
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const handleMenuClick = (item: MenuItem, e: React.MouseEvent) => {
    // Check if this is a restricted item for non-members
    const restrictedPaths = ['/add-venue', '/schedule-event'];
    if (restrictedPaths.includes(item.href) && !isMember && !isAuthenticated) {
      e.preventDefault();
      handleRestrictedAction(item.name);
      return;
    }
    
    // Close mobile menu
    setIsOpen(false);
  };

  const renderDesktopMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    
    if (hasChildren) {
      return (
        <div key={item.id} className="relative">
          <div className="relative group">
            <button
              className="flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-smooth font-medium"
            >
              {getIcon(item.icon_name)}
              <span className={item.icon_name ? "ml-1" : ""}>{item.name}</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-elegant z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                {item.children?.map((child) => (
                  <Link
                    key={child.id}
                    to={child.href}
                    onClick={(e) => handleMenuClick(child, e)}
                    className="flex items-center px-4 py-2 text-foreground hover:bg-muted transition-smooth"
                  >
                    {getIcon(child.icon_name)}
                    <span className={child.icon_name ? "ml-2" : ""}>{child.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.href}
        onClick={(e) => handleMenuClick(item, e)}
        className={`flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-smooth font-medium ${
          isActive(item.href) ? "border-b-2 border-primary-foreground" : ""
        }`}
      >
        {getIcon(item.icon_name)}
        <span className={item.icon_name ? "ml-1" : ""}>{item.name}</span>
      </Link>
    );
  };

  const renderMobileMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <Link
          to={item.href}
          onClick={(e) => handleMenuClick(item, e)}
          className={`flex items-center w-full text-left text-foreground hover:bg-muted py-2 px-4 rounded-md transition-smooth ${
            level > 0 ? `ml-${level * 4}` : ""
          } ${isActive(item.href) ? "bg-muted font-semibold" : ""}`}
        >
          {getIcon(item.icon_name)}
          <span className={item.icon_name ? "ml-2" : ""}>{item.name}</span>
        </Link>
        {hasChildren && (
          <div className="ml-4">
            {item.children?.map(child => renderMobileMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-6">
            {!loading && menuItems.map(item => renderDesktopMenuItem(item))}

            {/* Auth buttons/menu */}
            {!isMember && !isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/admin-sign-in"
                  className="text-primary-foreground hover:text-primary-foreground/80 transition-smooth font-medium text-sm"
                >
                  Admin Sign In
                </Link>
                <Button
                  onClick={() => setShowJoinDialog(true)}
                  variant="secondary"
                  size="sm"
                >
                  Join Now
                </Button>
                <Button
                  onClick={() => setShowSignInDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <Link
                    to="/admin"
                    className="text-primary-foreground hover:text-primary-foreground/80 transition-smooth font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button - Visible on mobile only */}
          <div
            onClick={toggleMenu}
            className="lg:hidden text-primary-foreground hover:bg-primary/20 transition-smooth p-2 rounded-md cursor-pointer flex items-center justify-center"
            aria-label="Toggle menu"
            style={{ width: '48px', height: '48px' }}
          >
            {isOpen ? <X size={48} strokeWidth={2} /> : <Menu size={48} strokeWidth={2} />}
          </div>
        </div>

        {/* Mobile Menu - Slide out from left with scroll */}
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-background shadow-elegant z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ScrollArea className="h-full">
            <div className="px-4 py-6 space-y-2">
              {/* Auth buttons for non-members */}
              {!isMember && !isAuthenticated && (
                <>
                  <Button
                    onClick={() => {
                      setShowJoinDialog(true);
                      setIsOpen(false);
                    }}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-md hover:bg-primary/90 transition-smooth"
                  >
                    Join Now
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSignInDialog(true);
                      setIsOpen(false);
                    }}
                    variant="outline"
                    className="w-full py-3 px-4 rounded-md transition-smooth"
                  >
                    Sign In
                  </Button>
                </>
              )}

              {/* Navigation menu items */}
              {!loading && menuItems.map(item => renderMobileMenuItem(item))}
              
              {(isMember || isAuthenticated) && (
                <div className="border-t pt-4 mt-4">
                  {isAuthenticated && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-left text-foreground hover:bg-muted py-2 px-4 rounded-md transition-smooth"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full justify-start mt-2 transition-smooth"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
              
              {/* Admin Sign In - Always visible at bottom */}
              <div className="border-t pt-4 mt-4">
                <Link
                  to="/admin-sign-in"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 px-4 rounded-md transition-smooth"
                >
                  Admin Sign In
                </Link>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Backdrop overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 top-16"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Dialogs */}
      <JoinNowDialog 
        isOpen={showJoinDialog} 
        onClose={() => setShowJoinDialog(false)} 
      />
      <SignInDialog 
        isOpen={showSignInDialog} 
        onClose={() => setShowSignInDialog(false)} 
      />
    </nav>
  );
};

export default Navigation;