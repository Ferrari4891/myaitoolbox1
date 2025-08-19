import HeroSection from "@/components/HeroSection";
import confusedSeniorImage from "@/assets/confused-senior.jpg";
const HowTo = () => {
  return <div className="min-h-screen bg-background">
      <HeroSection backgroundImage={confusedSeniorImage} title="WTF" height="h-64 md:h-96" />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-4">
              How To Get Started
            </h2>
            <p className="text-xl text-muted-foreground">
              Don't worry, it's easier than you think!
            </p>
          </div>

          <div className="grid gap-8 md:gap-12">
            <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
              <h3 className="text-2xl font-semibold text-green-600 mb-4">Step 1: Become a Geezer</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Sign up using our simple form. We only need your name and email address 
                to get you started. No complicated registration process!
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
              <h3 className="text-2xl font-semibold text-green-600 mb-4">
                Step 2: Wait for Invitations
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Once you're a member, you'll receive invitations to various activities 
                like coffee meetups, lunch gatherings, and dinner experiences. No need 
                to search for events - they'll come to you!
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
              <h3 className="text-2xl font-semibold text-green-600 mb-4">
                Step 3: RSVP and Attend
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Simply respond to invitations that interest you and show up! 
                Meet fellow members, enjoy great food and conversations, and make 
                lasting friendships.
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-8 border border-primary/20">
              <h3 className="text-2xl font-semibold text-green-600 mb-4">
                Still Confused?
              </h3>
              <p className="text-foreground text-lg leading-relaxed mb-4">
                That's perfectly normal! Many of our members felt the same way at first. 
                The beauty of Galloping Geezers is its simplicity - we take care of 
                organizing, you just focus on having fun.
              </p>
              <p className="text-muted-foreground">
                Questions? Don't hesitate to reach out once you've joined. 
                Our community is here to help!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default HowTo;