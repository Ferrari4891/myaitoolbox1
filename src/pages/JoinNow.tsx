import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


const JoinNow = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store member info in localStorage for immediate access
      const memberData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`,
        joinedAt: new Date().toISOString(),
      };

      // Store in localStorage to grant immediate access
      localStorage.setItem('gg_member', JSON.stringify(memberData));
      
      // Also store in profiles table for admin management
      try {
        const response = await fetch(`https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/create-simple-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY3psaGpuenRpYXhkc2F0dWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTUyMDUsImV4cCI6MjA2NzM3MTIwNX0.0e1FjIIvCCCf3fZK6j7BsFmhuL3HT_Cc39SuQG0Mr28`
          },
          body: JSON.stringify(memberData)
        });
        
        if (!response.ok) {
          console.log('Failed to store member in database, but proceeding with local access');
        }
      } catch (dbError) {
        console.log('Database storage failed, but proceeding with local access');
      }
      
      toast.success("Welcome! You now have access to all features.");
      
      // Redirect to home page with full access
      navigate('/');
      
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Join Galloping Geezers
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Connect with fellow members and join amazing activities like coffee meetups, 
            lunch gatherings, and dinner experiences.
          </p>
        </div>
      </header>

      {/* Form Section */}
      <main className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Join Now</CardTitle>
              <CardDescription>
                Enter your details to get instant access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="transition-smooth focus:ring-primary"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="transition-smooth focus:ring-primary"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="transition-smooth focus:ring-primary"
                    placeholder="Enter your email address"
                  />
                </div>


                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-smooth"
                >
                  {isSubmitting ? "Joining..." : "Join Now - Instant Access"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JoinNow;