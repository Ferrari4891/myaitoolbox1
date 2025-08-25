import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Save } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminVenueCreationProps {
  onVenueCreated: () => void;
  cuisineTypes: Array<{ id: string; name: string; }>;
}

export const AdminVenueCreation = ({ onVenueCreated, cuisineTypes }: AdminVenueCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    venue_type: 'restaurant',
    price_range: '',
    hours: '',
    google_maps_link: '',
    facebook_link: '',
    image_1_url: '',
    image_2_url: '',
    image_3_url: '',
    cuisine_types: [] as string[]
  });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (field: string) => (url: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: url
    }));
  };

  const handleImageRemove = (field: string) => () => {
    setFormData(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const resetForm = () => {
    setFormData({
      business_name: '',
      name: '',
      address: '',
      phone: '',
      website: '',
      description: '',
      venue_type: 'restaurant',
      price_range: '',
      hours: '',
      google_maps_link: '',
      facebook_link: '',
      image_1_url: '',
      image_2_url: '',
      image_3_url: '',
      cuisine_types: []
    });
    setIsCreating(false);
  };

  const createVenue = async () => {
    if (!formData.business_name || !formData.name || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in business name, venue name, and address.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const venueData = {
        business_name: formData.business_name,
        name: formData.name,
        address: formData.address,
        phone: formData.phone || null,
        website: formData.website || null,
        description: formData.description || null,
        venue_type: formData.venue_type,
        price_range: formData.price_range || null,
        hours: formData.hours || null,
        google_maps_link: formData.google_maps_link || null,
        facebook_link: formData.facebook_link || null,
        image_1_url: formData.image_1_url || null,
        image_2_url: formData.image_2_url || null,
        image_3_url: formData.image_3_url || null,
        cuisine_types: formData.cuisine_types,
        status: 'approved', // Admin created venues are auto-approved
        created_by: user.id
      };

      const { error } = await supabase
        .from('venues')
        .insert(venueData);

      if (error) throw error;

      toast({
        title: "Venue Created",
        description: `${formData.business_name} has been created and approved.`,
      });

      resetForm();
      onVenueCreated();
    } catch (error: any) {
      console.error('Error creating venue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create venue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Venue Creation
          </CardTitle>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Venue
            </Button>
          )}
        </div>
      </CardHeader>
      
      {isCreating && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Restaurant or business name"
              />
            </div>

            <div>
              <Label htmlFor="name">Venue Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Venue display name"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="venue_type">Venue Type</Label>
              <Select value={formData.venue_type} onValueChange={(value) => handleInputChange('venue_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pub">Pub</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price_range">Price Range</Label>
              <Select value={formData.price_range} onValueChange={(value) => handleInputChange('price_range', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Expensive</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Very Expensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={formData.hours}
                onChange={(e) => handleInputChange('hours', e.target.value)}
                placeholder="e.g., Mon-Fri 11am-10pm, Sat-Sun 10am-11pm"
              />
            </div>

            <div>
              <Label htmlFor="google_maps_link">Google Maps Link</Label>
              <Input
                id="google_maps_link"
                value={formData.google_maps_link}
                onChange={(e) => handleInputChange('google_maps_link', e.target.value)}
                placeholder="Google Maps URL"
              />
            </div>

            <div>
              <Label htmlFor="facebook_link">Facebook Link</Label>
              <Input
                id="facebook_link"
                value={formData.facebook_link}
                onChange={(e) => handleInputChange('facebook_link', e.target.value)}
                placeholder="Facebook page URL"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Venue description"
                rows={3}
              />
            </div>
          </div>

          {/* Image Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Image 1</Label>
                <ImageUpload
                  onImageUploaded={handleImageUpload('image_1_url')}
                  currentImage={formData.image_1_url}
                  onImageRemoved={handleImageRemove('image_1_url')}
                  label="Upload Image 1"
                />
              </div>
              <div>
                <Label>Image 2</Label>
                <ImageUpload
                  onImageUploaded={handleImageUpload('image_2_url')}
                  currentImage={formData.image_2_url}
                  onImageRemoved={handleImageRemove('image_2_url')}
                  label="Upload Image 2"
                />
              </div>
              <div>
                <Label>Image 3</Label>
                <ImageUpload
                  onImageUploaded={handleImageUpload('image_3_url')}
                  currentImage={formData.image_3_url}
                  onImageRemoved={handleImageRemove('image_3_url')}
                  label="Upload Image 3"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={createVenue}
              disabled={creating}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create Venue'}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};