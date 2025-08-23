import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Phone, Globe, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  description?: string;
  rating?: number;
  price_range?: string;
  hours?: string;
  features?: string[];
  cuisine_types: string[];
}

const RestaurantCuisine = () => {
  const { cuisineType } = useParams<{ cuisineType: string }>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisineName, setCuisineName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (cuisineType) {
      fetchRestaurantsByCuisine();
    }
  }, [cuisineType]);

  const fetchRestaurantsByCuisine = async () => {
    try {
      // Convert URL parameter back to cuisine name
      const formattedCuisine = cuisineType!
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setCuisineName(formattedCuisine);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('venue_type', 'restaurant')
        .eq('status', 'approved')
        .contains('cuisine_types', [formattedCuisine])
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = () => {
    navigate('/add-venue', { 
      state: { 
        venueType: 'restaurant',
        preselectedCuisine: cuisineName
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading restaurants...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                {cuisineName} Restaurants
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl">
                Discover the best {cuisineName.toLowerCase()} restaurants in your area
              </p>
            </div>
            <Button
              onClick={handleAddVenue}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {venues.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                No {cuisineName.toLowerCase()} restaurants yet
              </h3>
              <p className="text-muted-foreground mb-8">
                Be the first to add a {cuisineName.toLowerCase()} restaurant to our directory!
              </p>
              <Button onClick={handleAddVenue}>
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card key={venue.id} className="shadow-elegant hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{venue.name}</CardTitle>
                      {venue.rating && (
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm">{venue.rating}</span>
                        </div>
                      )}
                    </div>
                    {venue.price_range && (
                      <div className="text-primary font-semibold">{venue.price_range}</div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {venue.description && (
                      <CardDescription>{venue.description}</CardDescription>
                    )}
                    
                    <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{venue.address}</span>
                    </div>

                    {venue.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{venue.phone}</span>
                      </div>
                    )}

                    {venue.website && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="h-4 w-4" />
                        <a
                          href={venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    {venue.hours && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Hours:</strong> {venue.hours}
                      </div>
                    )}

                    {venue.cuisine_types && venue.cuisine_types.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {venue.cuisine_types.map((cuisine, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full"
                          >
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    {venue.features && venue.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {venue.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestaurantCuisine;