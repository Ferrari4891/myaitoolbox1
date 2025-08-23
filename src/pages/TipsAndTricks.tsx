import HeroSection from "@/components/HeroSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import jugglerHero from "@/assets/juggler-hero.jpg";

const TipsAndTricks = () => {
  const tips = [
    {
      title: "Master the Basics",
      description: "Start with fundamental techniques and build your foundation before moving to advanced tricks."
    },
    {
      title: "Practice Daily",
      description: "Consistency is key. Even 15 minutes of daily practice will improve your skills significantly."
    },
    {
      title: "Learn from Others",
      description: "Watch experienced practitioners and don't be afraid to ask questions during events."
    },
    {
      title: "Document Your Progress",
      description: "Keep track of what you've learned and areas where you need improvement."
    },
    {
      title: "Safety First",
      description: "Always prioritize safety and use proper equipment when trying new techniques."
    },
    {
      title: "Stay Patient",
      description: "Rome wasn't built in a day. Be patient with yourself as you develop new skills."
    }
  ];

  return (
    <div className="min-h-screen">
      <HeroSection
        backgroundImage={jugglerHero}
        title="Tips & Tricks"
        subtitle="Master your skills with expert advice"
        height="h-96"
      />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Actual Tips & Tricks Coming Soon!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover proven strategies and techniques to improve your skills and make the most of your experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="bg-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-xl">{tip.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {tip.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TipsAndTricks;