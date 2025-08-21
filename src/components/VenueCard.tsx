import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Link } from "react-router-dom";

interface VenueCardProps {
  venue: {
    id: string;
    business_name: string;
    description?: string;
    address?: string;
    image_1_url?: string;
    image_2_url?: string;
    image_3_url?: string;
  };
  showSeeMoreLink?: boolean;
}

const VenueCard = ({ venue, showSeeMoreLink = false }: VenueCardProps) => {
  const images = [venue.image_1_url, venue.image_2_url, venue.image_3_url]
    .filter(Boolean) as string[];

  return (
    <Card className="h-full hover-scale">
      <CardHeader className="p-0">
        {images.length > 0 ? (
          <ImageCarousel 
            images={images} 
            alt={venue.business_name}
            className="w-full h-48 rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="text-xl mb-2">{venue.business_name}</CardTitle>
        {venue.description && (
          <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {venue.description}
          </CardDescription>
        )}
        {venue.address && (
          <p className="text-sm text-muted-foreground">
            📍 {venue.address}
          </p>
        )}
        
        {showSeeMoreLink && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link 
              to="/approved-venues" 
              className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors font-medium w-full text-center"
            >
              See more venues
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueCard;