import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Coffee, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CuisineType {
  id: string;
  name: string;
  description: string;
}

export const VenueDirectoryMenu = () => {
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCuisineTypes();
  }, []);

  const fetchCuisineTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cuisine_types')
        .select('id, name, description')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCuisineTypes(data || []);
    } catch (error) {
      console.error('Error fetching cuisine types:', error);
    }
  };

  const handleCoffeeShopsClick = () => {
    navigate('/venues/coffee-shops');
  };

  const handleRestaurantToggle = () => {
    setIsRestaurantOpen(!isRestaurantOpen);
  };

  const handleCuisineClick = (cuisineType: string) => {
    navigate(`/venues/restaurants/${cuisineType.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="space-y-2">
      {/* Coffee Shops */}
      <Button
        variant="ghost"
        className="w-full justify-start text-left font-normal"
        onClick={handleCoffeeShopsClick}
      >
        <Coffee className="mr-2 h-4 w-4" />
        Coffee Shops
      </Button>

      {/* Restaurants with Accordion */}
      <div>
        <Button
          variant="ghost"
          className="w-full justify-start text-left font-normal"
          onClick={handleRestaurantToggle}
        >
          <UtensilsCrossed className="mr-2 h-4 w-4" />
          Restaurants
          {isRestaurantOpen ? (
            <ChevronDown className="ml-auto h-4 w-4" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4" />
          )}
        </Button>

        {/* Cuisine Types Submenu */}
        {isRestaurantOpen && (
          <div className="ml-6 mt-2 space-y-1 border-l border-border pl-4">
            {cuisineTypes.map((cuisine) => (
              <Button
                key={cuisine.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left font-normal text-muted-foreground hover:text-foreground"
                onClick={() => handleCuisineClick(cuisine.name)}
              >
                {cuisine.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};