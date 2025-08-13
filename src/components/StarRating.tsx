import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StarRatingProps {
  venueId: string;
  currentRating?: number;
  ratingCount?: number;
  userRating?: number;
  isAuthenticated: boolean;
  onRatingUpdate?: () => void;
}

const StarRating = ({ 
  venueId, 
  currentRating = 0, 
  ratingCount = 0, 
  userRating, 
  isAuthenticated, 
  onRatingUpdate 
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStarClick = async (rating: number) => {
    if (!isAuthenticated) {
      setShowJoinDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('venue_ratings')
          .update({ rating })
          .eq('venue_id', venueId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: "Rating updated successfully!" });
      } else {
        // Create new rating
        const { error } = await supabase
          .from('venue_ratings')
          .insert({
            venue_id: venueId,
            user_id: user.id,
            rating
          });

        if (error) throw error;
        toast({ title: "Rating submitted successfully!" });
      }

      onRatingUpdate?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({ 
        title: "Error submitting rating", 
        description: "Please try again later.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive 
            ? star <= (hoverRating || userRating || 0)
            : star <= currentRating;
          
          return (
            <Star
              key={star}
              size={20}
              className={`cursor-pointer transition-colors ${
                isFilled 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 hover:text-yellow-400"
              } ${interactive && !isAuthenticated ? "hover:text-red-400" : ""}`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
              onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {renderStars(!isSubmitting)}
        <span className="text-sm text-muted-foreground">
          {currentRating > 0 ? `${currentRating}` : "No ratings"}
          {ratingCount > 0 && ` (${ratingCount})`}
        </span>
      </div>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join to Rate Venues!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You need to be a member to rate venues. Join our community to share your experiences!
            </p>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to="/join">Join Now</Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowJoinDialog(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StarRating;