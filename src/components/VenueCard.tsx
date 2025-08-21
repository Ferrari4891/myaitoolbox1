import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const getVenueImages = (venue: any) => {
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

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-card-foreground">
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
          {venue.description && (
            <p className="text-sm text-muted-foreground">
              {venue.description}
            </p>
          )}
        </div>
        
        <div className="h-px bg-border"></div>
        
        <div className="space-y-3">
          {venue.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {venue.address}
                </p>
              </div>
            </div>
          )}
          
          {venue.address && (
            <>
              <div className="h-px bg-border"></div>
              <div className="flex items-center flex-wrap gap-3">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary hover:text-primary/80"
                  onClick={() => openGoogleMaps(venue.address!)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Google Maps
                </Button>
              </div>
            </>
          )}
        </div>
        
        {showSeeMoreLink && (
          <div className="pt-2 border-t border-border">
            <Link 
              to="/approved-venues" 
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors font-medium w-full text-center"
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