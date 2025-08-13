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
    { label: "How To", path: "/how-to" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary shadow-elegant relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Site Name */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/d9226602-30e1-47f3-a5f6-aa78079398ea.png" 
              alt="Galloping Geezers Logo" 
              className="h-10 w-10 rounded-full"
            />
            <span className="text-xl font-bold text-primary-foreground">Galloping geezers.online</span>
          </Link>

          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="text-primary-foreground hover:bg-primary/20 transition-smooth"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-primary border-t border-primary-foreground/20 shadow-elegant">
            <div className="px-4 py-4 space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block w-full text-left ${
                    item.isButton
                      ? "bg-primary-foreground text-primary font-semibold py-3 px-4 rounded-md hover:bg-primary-foreground/90"
                      : `text-primary-foreground hover:bg-primary/20 py-2 px-4 rounded-md ${
                          isActive(item.path) ? "bg-primary/20 font-semibold" : ""
                        }`
                  } transition-smooth`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;