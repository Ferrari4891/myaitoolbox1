import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Join Now", path: "/join", isButton: true },
    { label: "Sign In", path: "/sign-in" },
    { label: "How To", path: "/how-to" },
    { label: "Approved Venues", path: "/approved-venues" },
    { label: "Add Venue", path: "/add-venue" },
    { label: "Admin", path: "/admin" },
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
          <Button
            variant="ghost"
            onClick={toggleMenu}
            className="text-primary-foreground hover:bg-primary/20 transition-smooth p-3 min-w-[60px] min-h-[60px]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-16 w-16" strokeWidth={4} /> : <Menu className="h-16 w-16" strokeWidth={4} />}
          </Button>
        </div>

        {/* Mobile Menu - Slide out from left */}
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-elegant z-40 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left ${
                  item.isButton
                    ? "bg-primary text-white font-semibold py-3 px-4 rounded-md hover:bg-primary/90"
                    : `text-gray-800 hover:bg-gray-100 py-2 px-4 rounded-md ${
                        isActive(item.path) ? "bg-gray-100 font-semibold" : ""
                      }`
                } transition-smooth`}
              >
                {item.label}
              </Link>
            ))}
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