import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { ArrowLeft } from "lucide-react";

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
  status: string;
}

const EditVenue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    address: "",
    google_maps_link: "",
    facebook_link: "",
    image_1_url: "",
    image_2_url: "",
    image_3_url: "",
    status: "approved"
  });

  useEffect(() => {
    checkAdminAndLoadVenue();
  }, [id]);

  const checkAdminAndLoadVenue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access this page.",
          variant: "destructive",
        });
        navigate('/sign-in');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);

      // Load venue data
      if (id) {
        const { data: venueData, error } = await supabase
          .from('venues')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error loading venue:', error);
          toast({
            title: "Error",
            description: "Failed to load venue data.",
            variant: "destructive",
          });
          navigate('/approved-venues');
          return;
        }

        setVenue(venueData);
        setFormData({
          business_name: venueData.business_name || "",
          description: venueData.description || "",
          address: venueData.address || "",
          google_maps_link: venueData.google_maps_link || "",
          facebook_link: venueData.facebook_link || "",
          image_1_url: venueData.image_1_url || "",
          image_2_url: venueData.image_2_url || "",
          image_3_url: venueData.image_3_url || "",
          status: venueData.status || "approved"
        });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    setSaving(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          business_name: formData.business_name,
          description: formData.description,
          address: formData.address,
          google_maps_link: formData.google_maps_link,
          facebook_link: formData.facebook_link,
          image_1_url: formData.image_1_url,
          image_2_url: formData.image_2_url,
          image_3_url: formData.image_3_url,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Venue Updated!",
        description: "The venue has been successfully updated.",
      });

      navigate('/approved-venues');
      
    } catch (error) {
      console.error('Error updating venue:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the venue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-muted-foreground">Loading venue...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin || !venue) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/approved-venues')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Venues
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Edit Venue
              </h1>
              <p className="text-lg text-muted-foreground">
                Update venue information and images
              </p>
            </div>
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
                    placeholder="Describe the venue"
                    className="min-h-[100px]"
                    maxLength={393}
                    required
                  />
                  <div className="flex justify-end">
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Venue Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload up to 3 high-quality images that showcase the venue.
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
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/approved-venues')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Update Venue"}
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

export default EditVenue;