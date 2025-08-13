import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

const AddVenue = () => {
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    address: "",
    google_maps_link: "",
    facebook_link: "",
    image_1_url: "",
    image_2_url: "",
    image_3_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageNumber: 1 | 2 | 3, url: string) => {
    setFormData(prev => ({
      ...prev,
      [`image_${imageNumber}_url`]: url
    }));
  };

  const handleImageRemove = (imageNumber: 1 | 2 | 3) => {
    setFormData(prev => ({
      ...prev,
      [`image_${imageNumber}_url`]: ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.description || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Business Name, Description, and Address).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a venue.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('venues')
        .insert({
          ...formData,
          submitted_by: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Venue Submitted!",
        description: "Your venue has been submitted for approval. You'll be notified once it's reviewed.",
      });

      // Reset form
      setFormData({
        business_name: "",
        description: "",
        address: "",
        google_maps_link: "",
        facebook_link: "",
        image_1_url: "",
        image_2_url: "",
        image_3_url: "",
      });

      // Navigate to approved venues page
      navigate("/approved-venues");
      
    } catch (error) {
      console.error('Error submitting venue:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your venue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Add a Venue
            </h1>
            <p className="text-lg text-muted-foreground">
              Share an amazing venue with our community. All submissions are reviewed before approval.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    placeholder="Enter the business name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the venue in 3 lines (what makes it special, atmosphere, specialties, etc.)"
                    className="min-h-[100px]"
                    maxLength={393}
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Keep it to about 3 lines for the best display on venue cards.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/393 characters
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full address of the venue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">Google Maps Link</Label>
                  <Input
                    id="google_maps_link"
                    name="google_maps_link"
                    value={formData.google_maps_link}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Direct link to Google Maps location (if not provided, we'll use the address)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_link">Facebook Page</Label>
                  <Input
                    id="facebook_link"
                    name="facebook_link"
                    value={formData.facebook_link}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/..."
                    type="url"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Venue Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload up to 3 high-quality images that showcase the venue. Images will be displayed in a 16:9 carousel on the venue card.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ImageUpload
                      label="Image 1"
                      currentImage={formData.image_1_url}
                      onImageUploaded={(url) => handleImageUpload(1, url)}
                      onImageRemoved={() => handleImageRemove(1)}
                    />
                    
                    <ImageUpload
                      label="Image 2"
                      currentImage={formData.image_2_url}
                      onImageUploaded={(url) => handleImageUpload(2, url)}
                      onImageRemoved={() => handleImageRemove(2)}
                    />
                    
                    <ImageUpload
                      label="Image 3"
                      currentImage={formData.image_3_url}
                      onImageUploaded={(url) => handleImageUpload(3, url)}
                      onImageRemoved={() => handleImageRemove(3)}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    If no images are uploaded, default showcase images will be used. Supported formats: JPG, PNG, GIF (max 5MB each)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AddVenue;