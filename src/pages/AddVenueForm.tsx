import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CuisineType {
  id: string;
  name: string;
}

const AddVenueForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  
  // Get venue type and preselected cuisine from navigation state
  const venueType = location.state?.venueType || 'restaurant';
  const preselectedCuisine = location.state?.preselectedCuisine;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    facebook_link: '',
    description: '',
    hours: '',
    price_range: '',
    rating: '',
    features: [] as string[],
    cuisine_types: preselectedCuisine ? [preselectedCuisine] : [] as string[],
    image_1_url: '',
    image_2_url: '',
    image_3_url: ''
  });

  const priceRanges = ['$', '$$', '$$$', '$$$$'];
  const commonFeatures = [
    'WiFi', 'Outdoor Seating', 'Takeout', 'Delivery', 'Parking', 
    'Wheelchair Accessible', 'Pet Friendly', 'Live Music', 'Happy Hour'
  ];

  useEffect(() => {
    if (venueType === 'restaurant') {
      fetchCuisineTypes();
    }
  }, [venueType]);

  const fetchCuisineTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cuisine_types')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCuisineTypes(data || []);
    } catch (error) {
      console.error('Error fetching cuisine types:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisine_types: prev.cuisine_types.includes(cuisine)
        ? prev.cuisine_types.filter(c => c !== cuisine)
        : [...prev.cuisine_types, cuisine]
    }));
  };

  const handleImageUpload = (imageUrl: string, imageNumber: number) => {
    const fieldName = `image_${imageNumber}_url` as keyof typeof formData;
    setFormData(prev => ({ ...prev, [fieldName]: imageUrl }));
  };

  const handleImageRemove = (imageNumber: number) => {
    const fieldName = `image_${imageNumber}_url` as keyof typeof formData;
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be signed in to add a venue');
      return;
    }

    setLoading(true);

    try {
      const venueData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || null,
        website: formData.website || null,
        facebook_link: formData.facebook_link || null,
        description: formData.description || null,
        hours: formData.hours || null,
        venue_type: venueType,
        price_range: formData.price_range || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        features: formData.features.length > 0 ? formData.features : null,
        cuisine_types: venueType === 'restaurant' ? formData.cuisine_types : [],
        image_1_url: formData.image_1_url || null,
        image_2_url: formData.image_2_url || null,
        image_3_url: formData.image_3_url || null,
        created_by: user.id,
        status: 'pending'
      };

      const { error } = await supabase
        .from('venues')
        .insert([venueData]);

      if (error) throw error;

      toast.success('Venue submitted successfully! It will be reviewed before appearing in the directory.');
      
      // Navigate back to appropriate directory
      if (venueType === 'coffee_shop') {
        navigate('/venues/coffee-shops');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error adding venue:', error);
      toast.error('Failed to add venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">
              Add {venueType === 'coffee_shop' ? 'Coffee Shop' : 'Restaurant'}
            </CardTitle>
            <CardDescription>
              Fill out the form below to add a new venue to our directory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Venue name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address, city, state"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_link">Facebook Page</Label>
                  <Input
                    id="facebook_link"
                    name="facebook_link"
                    type="url"
                    value={formData.facebook_link}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the venue"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Opening Hours</Label>
                <Textarea
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  placeholder={`Monday: 8:00 AM - 10:00 PM
Tuesday: 8:00 AM - 10:00 PM
Wednesday: 8:00 AM - 10:00 PM
Thursday: 8:00 AM - 10:00 PM
Friday: 8:00 AM - 11:00 PM
Saturday: 9:00 AM - 11:00 PM
Sunday: 9:00 AM - 9:00 PM`}
                  rows={7}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <Select value={formData.price_range} onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="4.5"
                  />
                </div>
              </div>

              {/* Cuisine Types - Only for restaurants */}
              {venueType === 'restaurant' && (
                <div className="space-y-3">
                  <Label>Cuisine Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cuisineTypes.map((cuisine) => (
                      <div key={cuisine.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={cuisine.id}
                          checked={formData.cuisine_types.includes(cuisine.name)}
                          onCheckedChange={() => handleCuisineToggle(cuisine.name)}
                        />
                        <Label htmlFor={cuisine.id} className="text-sm font-normal cursor-pointer">
                          {cuisine.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Uploads */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Venue Images</Label>
                <p className="text-sm text-muted-foreground">
                  Upload up to 3 images that will rotate in a carousel on your venue card.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <ImageUpload
                      label="Image 1"
                      currentImage={formData.image_1_url}
                      onImageUploaded={(url) => handleImageUpload(url, 1)}
                      onImageRemoved={() => handleImageRemove(1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUpload
                      label="Image 2"
                      currentImage={formData.image_2_url}
                      onImageUploaded={(url) => handleImageUpload(url, 2)}
                      onImageRemoved={() => handleImageRemove(2)}
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUpload
                      label="Image 3"
                      currentImage={formData.image_3_url}
                      onImageUploaded={(url) => handleImageUpload(url, 3)}
                      onImageRemoved={() => handleImageRemove(3)}
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <Label htmlFor={feature} className="text-sm font-normal cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Submitting...' : 'Submit Venue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddVenueForm;