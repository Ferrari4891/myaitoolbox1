import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { MapPin, ExternalLink, Facebook, Share2, Copy, Mail, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GrabLink } from "@/components/GrabLink";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

interface VenueCardProps {
  venue: {
    id: string;
    business_name: string;
    description?: string;
    address?: string;
    google_maps_link?: string;
    facebook_link?: string;
    image_1_url?: string;
    image_2_url?: string;
    image_3_url?: string;
  };
  showSeeMoreLink?: boolean;
}

const VenueCard = ({ venue, showSeeMoreLink = false }: VenueCardProps) => {
  const { toast } = useToast();
  const [showFullText, setShowFullText] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

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

  const openGoogleMaps = (address: string, mapsLink?: string) => {
    if (mapsLink) {
      window.open(mapsLink, '_blank');
    } else {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com?q=${encodedAddress}`, '_blank');
    }
  };

  useEffect(() => {
    if (textRef.current && venue.description) {
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * 3; // 3 lines
      setShouldShowReadMore(textRef.current.scrollHeight > maxHeight);
    }
  }, [venue.description]);

  const handleReadMore = () => {
    setShowFullText(true);
  };

  const handleBackToCard = () => {
    setShowFullText(false);
  };

  const handleShare = async (platform: string) => {
    const shareData = {
      title: venue.business_name,
      text: `Check out ${venue.business_name}${venue.description ? ` - ${venue.description}` : ''}`,
      url: window.location.href
    };

    const shareUrl = window.location.href;
    const shareText = encodeURIComponent(shareData.text);
    const shareTitle = encodeURIComponent(shareData.title);

    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied!",
            description: "Venue link copied to clipboard.",
          });
        } catch (err) {
          toast({
            title: "Copy failed",
            description: "Unable to copy link to clipboard.",
            variant: "destructive",
          });
        }
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${shareTitle}&body=${shareText}%0A%0A${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.log('Share canceled or failed');
          }
        }
        break;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-card-foreground">
            {venue.business_name}
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share venue</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Share venue</h4>
                <div className="space-y-1">
                  {navigator.share && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => handleShare('native')}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handleShare('copy')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handleShare('facebook')}
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handleShare('twitter')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handleShare('whatsapp')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => handleShare('email')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showFullText ? (
          // Full text view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCard}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to card
              </Button>
            </div>
            
            {venue.description && (
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {venue.description}
                </p>
              </ScrollArea>
            )}
          </div>
        ) : (
          // Normal card view
          <>
            <ImageCarousel
              images={getVenueImages(venue)}
              alt={venue.business_name}
              className="w-full"
              autoPlay={true}
              interval={2000}
            />
            
            <div className="space-y-2">
              {venue.description && (
                <div className="relative">
                  <p 
                    ref={textRef}
                    className={`text-sm text-muted-foreground ${!shouldShowReadMore ? '' : 'line-clamp-3'}`}
                    style={{ 
                      overflow: shouldShowReadMore && !showFullText ? 'hidden' : 'visible',
                      display: shouldShowReadMore && !showFullText ? '-webkit-box' : 'block',
                      WebkitLineClamp: shouldShowReadMore && !showFullText ? 3 : 'unset',
                      WebkitBoxOrient: shouldShowReadMore && !showFullText ? 'vertical' : 'unset'
                    }}
                  >
                    {venue.description}
                  </p>
                  
                  {shouldShowReadMore && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleReadMore}
                      className="h-auto p-0 text-primary hover:text-primary/80 mt-1"
                    >
                      Read more
                    </Button>
                  )}
                </div>
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
                      onClick={() => openGoogleMaps(venue.address!, venue.google_maps_link)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Google Maps
                    </Button>
                  </div>
                </>
              )}
              
              {venue.address && (
                <div className="flex items-center gap-2">
                  <GrabLink venue={{...venue, address: venue.address}} />
                </div>
              )}
              
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueCard;