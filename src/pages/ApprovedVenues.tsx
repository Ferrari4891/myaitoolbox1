import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Facebook, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

import StarRating from "@/components/StarRating";
import { GrabLink } from "@/components/GrabLink";
import { useAuth } from "@/hooks/useAuth";

interface Venue {
  id: string;
  business_name: string;
  description: string;
  address: string;
  google_maps_link?: string;
  facebook_link?: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  average_rating?: number;
  rating_count?: number;
}

interface VenueRating {
  venue_id: string;
  rating: number;
}

const ApprovedVenues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    checkAdminStatus();
    fetchVenues();
    if (isAuthenticated) {
      fetchUserRatings();
    }
  }, [isAuthenticated]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*, average_rating, rating_count')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('venue_ratings')
        .select('venue_id, rating')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const ratingsMap = (data || []).reduce((acc: Record<string, number>, rating: VenueRating) => {
        acc[rating.venue_id] = rating.rating;
        return acc;
      }, {});
      
      setUserRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  };

  const handleRatingUpdate = () => {
    fetchVenues();
    if (isAuthenticated) {
      fetchUserRatings();
    }
  };

  const getVenueImages = (venue: Venue) => {
    const images = [venue.image_1_url, venue.image_2_url, venue.image_3_url]
      .filter(Boolean) as string[];
    
    // Filter out Google Photos URLs as they don't work for direct embedding
    const validImages = images.filter(url => 
      !url.includes('photos.google.com') && 
      (url.startsWith('http') || url.startsWith('/'))
    );
    
    // If no valid images, use default placeholder images
    if (validImages.length === 0) {
      return [
        "/lovable-uploads/a44177ba-4fed-4d95-84a9-5f60ed868687.png",
        "/lovable-uploads/a15c0703-9909-4cba-a906-d5b7d26c81af.png",
        "/lovable-uploads/98b9f36a-cfb2-4516-b21d-9282258f27fd.png"
      ];
    }
    
    return validImages;
  };

  const openGoogleMaps = (address: string, mapsLink?: string) => {
    if (mapsLink) {
      window.open(mapsLink, '_blank');
    } else {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-muted-foreground">Loading venues...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Approved Venues
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing venues approved by our community. Each location has been 
            verified and recommended by fellow members.
          </p>
        </div>

        {venues.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
              No approved venues yet
            </h2>
            <p className="text-muted-foreground">
              Be the first to add a venue for community approval!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 relative">
                  <div className="absolute top-4 right-4 z-10">
                    <StarRating
                      venueId={venue.id}
                      currentRating={venue.average_rating || 0}
                      ratingCount={venue.rating_count || 0}
                      userRating={userRatings[venue.id]}
                      isAuthenticated={isAuthenticated}
                      onRatingUpdate={handleRatingUpdate}
                    />
                  </div>
                  <CardTitle className="text-xl font-bold text-card-foreground pr-32">
                    {venue.business_name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ImageCarousel
                    images={getVenueImages(venue)}
                    alt={venue.business_name}
                    className="w-full"
                    autoPlay={true}
                    interval={2000}
                  />
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {venue.description}
                    </p>
                  </div>
                  
                  <div className="h-px bg-border"></div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {venue.address}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-px bg-border"></div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center flex-wrap gap-3">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary hover:text-primary/80"
                          onClick={() => openGoogleMaps(venue.address, venue.google_maps_link)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View on Google Maps
                        </Button>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <GrabLink venue={venue} />
                       </div>
                      
                      {venue.facebook_link && (
                        <>
                          <div className="h-px bg-border"></div>
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-muted-foreground" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary hover:text-primary/80"
                              onClick={() => window.open(venue.facebook_link, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Facebook Page
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                        onClick={() => navigate(`/edit-venue/${venue.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Venue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ApprovedVenues;