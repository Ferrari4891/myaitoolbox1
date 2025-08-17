
import HeroSection from "@/components/HeroSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const Index = () => {
  return <div className="min-h-screen bg-background">
      <HeroSection backgroundImage="/lovable-uploads/178b6d98-4629-47e5-a511-0325a803ccda.png" title="" height="h-96 md:h-screen" />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xl md:text-5xl font-bold text-primary mb-6">
              Welcome to <br className="md:hidden" />Gallopinggeezers.online
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join fellow members in organizing and participating in amazing activities. 
              From coffee meetups to lunch gatherings and dinner experiences - 
              there's always something exciting happening in our community.
            </p>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 text-lg transition-smooth shadow-elegant">
              <a href="#/join-now">Become a Geezer</a>
            </Button>
          </div>

          {/* Content placeholder for future additions */}
          <div className="mt-20 text-center">
            <p className="text-muted-foreground italic">
              More content coming soon...
            </p>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;