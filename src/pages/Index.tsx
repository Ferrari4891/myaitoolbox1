import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import VenueCard from "@/components/VenueCard";
import { supabase } from "@/integrations/supabase/client";
interface Venue {
  id: string;
  business_name: string;
  description?: string;
  address?: string;
  google_maps_link?: string;
  facebook_link?: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
}

const Index = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [displayedVenues, setDisplayedVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, business_name, description, address, google_maps_link, facebook_link, image_1_url, image_2_url, image_3_url')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const venuesData = data || [];
      setVenues(venuesData);
      
      // Rotate through venues to show different ones on each visit
      const rotateVenues = (venuesList: Venue[]) => {
        if (venuesList.length <= 3) return venuesList;
        
        // Use timestamp to create a pseudo-random rotation
        const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % venuesList.length;
        const rotated = [...venuesList.slice(rotationIndex), ...venuesList.slice(0, rotationIndex)];
        return rotated.slice(0, 3);
      };
      
      setDisplayedVenues(rotateVenues(venuesData));
    } catch (error) {
      console.error('Error fetching venues:', error);
      // Fallback to mock venues if database fails
      const mockVenues = [
        {
          id: '1',
          business_name: 'Riverside Bistro',
          description: 'Elegant dining with waterfront views',
          address: '123 Riverside Drive',
          image_1_url: '/lovable-uploads/a44177ba-4fed-4d95-84a9-5f60ed868687.png'
        },
        {
          id: '2', 
          business_name: 'Garden Terrace',
          description: 'Farm-to-table cuisine in a beautiful setting',
          address: '456 Garden Lane',
          image_1_url: '/lovable-uploads/a15c0703-9909-4cba-a906-d5b7d26c81af.png'
        },
        {
          id: '3',
          business_name: 'Sunset Lounge',
          description: 'Craft cocktails and stunning city views',
          address: '789 Sunset Boulevard',
          image_1_url: '/lovable-uploads/98b9f36a-cfb2-4516-b21d-9282258f27fd.png'
        }
      ];
      setDisplayedVenues(mockVenues);
    }
  };

  return <div className="min-h-screen">
      <HeroSection 
        backgroundImage="/lovable-uploads/5f8a99df-9a98-4353-baa1-0be5ebd5f02b.png" 
        title="" 
        height="h-64 md:h-96" 
      />

      <main className="pt-0 md:pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-5xl font-bold text-primary mb-6">
              Welcome to <br className="md:hidden" />Gallopinggeezers.online
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Welcome to Gallopinggeezers.com, where adults worldwide gather to argue about wine pairings while pretending we know the difference between "oaky" and "just tastes like wine."
            </p>
          </div>

          {/* Featured Venues */}
          {displayedVenues.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-center text-primary mb-8">
                Featured Venues
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {displayedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} showSeeMoreLink={true} />
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 text-lg transition-smooth shadow-elegant">
              <a href="#/join-now">Become a Geezer</a>
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Already a member?{' '}
              <Link 
                to="/member-sign-in" 
                className="text-primary hover:underline font-medium"
              >
                Sign In Here
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;