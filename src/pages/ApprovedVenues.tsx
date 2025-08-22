import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

import StarRating from "@/components/StarRating";
import VenueCard from "@/components/VenueCard";
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
              <div key={venue.id} className="relative">
                <div className="absolute top-6 right-6 z-20">
                  <StarRating
                    venueId={venue.id}
                    currentRating={venue.average_rating || 0}
                    ratingCount={venue.rating_count || 0}
                    userRating={userRatings[venue.id]}
                    isAuthenticated={isAuthenticated}
                    onRatingUpdate={handleRatingUpdate}
                  />
                </div>
                <VenueCard venue={venue} />
                {isAdmin && (
                  <div className="mt-2">
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ApprovedVenues;