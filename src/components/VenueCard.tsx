import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCarousel } from "@/components/ui/image-carousel";

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
}

const VenueCard = ({ venue }: VenueCardProps) => {
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
      </CardContent>
    </Card>
  );
};

export default VenueCard;