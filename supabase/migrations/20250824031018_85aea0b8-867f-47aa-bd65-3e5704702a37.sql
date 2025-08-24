-- Create PageBuilder entries for existing static pages
INSERT INTO public.pages (title, slug, content, is_published, meta_title, meta_description, created_at, updated_at) VALUES
(
  'Home Page',
  'home',
  '[
    {
      "id": "hero-section-1",
      "type": "hero",
      "content": {
        "title": "",
        "subtitle": "",
        "backgroundImage": "/lovable-uploads/5f8a99df-9a98-4353-baa1-0be5ebd5f02b.png"
      },
      "position": {
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 300
      }
    },
    {
      "id": "welcome-section-1",
      "type": "text-block",
      "content": {
        "title": "Welcome to Gallopinggeezers.online",
        "content": "<h2 style=\"text-align: center; font-size: 3rem; font-weight: bold; color: hsl(var(--primary)); margin-bottom: 1.5rem;\">Welcome to <br class=\"md:hidden\" />Gallopinggeezers.online</h2><p style=\"text-align: center; font-size: 1.25rem; color: hsl(var(--muted-foreground)); max-width: 64rem; margin: 0 auto; line-height: 1.625;\">Welcome to Gallopinggeezers.com, where adults worldwide gather to argue about wine pairings while pretending we know the difference between \"oaky\" and \"just tastes like wine.\"</p>"
      },
      "position": {
        "x": 0,
        "y": 300,
        "width": 12,
        "height": 200
      }
    },
    {
      "id": "cta-section-1",
      "type": "text-block",
      "content": {
        "title": "Join Our Community",
        "content": "<div style=\"text-align: center; margin-top: 3rem;\"><a href=\"#/join-now\" style=\"display: inline-block; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); font-weight: 600; padding: 1rem 2rem; font-size: 1.125rem; border-radius: 0.375rem; text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.3);\">Become a Geezer</a><div style=\"margin-top: 1rem; font-size: 0.875rem; color: hsl(var(--muted-foreground));\">Already a member? <a href=\"/member-sign-in\" style=\"color: hsl(var(--primary)); text-decoration: none; font-weight: 500;\">Sign In Here</a></div></div>"
      },
      "position": {
        "x": 0,
        "y": 500,
        "width": 12,
        "height": 150
      }
    }
  ]'::jsonb,
  true,
  'Gallopinggeezers - Welcome to Our Community',
  'Join Gallopinggeezers.com where adults worldwide gather to share dining experiences and connect over great food and wine.',
  now(),
  now()
),
(
  'How To Guide',
  'how-to',
  '[
    {
      "id": "how-to-hero-1",
      "type": "hero",
      "content": {
        "title": "How To Get Started",
        "subtitle": "Your guide to joining and participating in our community",
        "backgroundImage": ""
      },
      "position": {
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 300
      }
    },
    {
      "id": "how-to-content-1",
      "type": "text-block",
      "content": {
        "title": "Getting Started Guide",
        "content": "<h2 style=\"font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem;\">How to Join Our Community</h2><div style=\"max-width: 48rem; margin: 0 auto;\"><p style=\"margin-bottom: 1.5rem; font-size: 1.125rem; line-height: 1.75;\">Getting started with Gallopinggeezers is easy! Follow these simple steps to become part of our vibrant dining community.</p><div style=\"background: hsl(var(--card)); padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;\"><h3 style=\"font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;\">Step 1: Join Our Community</h3><p style=\"margin-bottom: 1rem;\">Click the \"Become a Geezer\" button to start your membership process. We will guide you through setting up your profile.</p></div><div style=\"background: hsl(var(--card)); padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;\"><h3 style=\"font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;\">Step 2: Explore Venues</h3><p style=\"margin-bottom: 1rem;\">Browse our curated list of restaurants and venues. Each location has been reviewed by fellow geezers.</p></div><div style=\"background: hsl(var(--card)); padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;\"><h3 style=\"font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;\">Step 3: Join Events</h3><p style=\"margin-bottom: 1rem;\">Look for upcoming dining events and RSVP to join fellow members for memorable meals.</p></div><p style=\"text-align: center; margin-top: 2rem; font-size: 1.125rem;\">Our community is here to help!</p></div>"
      },
      "position": {
        "x": 0,
        "y": 300,
        "width": 12,
        "height": 600
      }
    }
  ]'::jsonb,
  true,
  'How To Get Started - Gallopinggeezers Guide',
  'Learn how to join and participate in the Gallopinggeezers community. Step-by-step guide to getting started.',
  now(),
  now()
),
(
  'Tips and Tricks',
  'tips-and-tricks',
  '[
    {
      "id": "tips-hero-1",
      "type": "hero",
      "content": {
        "title": "Tips & Tricks",
        "subtitle": "Helpful advice for dining experiences and community participation",
        "backgroundImage": ""
      },
      "position": {
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 300
      }
    },
    {
      "id": "tips-content-1",
      "type": "text-block",
      "content": {
        "title": "Community Tips",
        "content": "<h2 style=\"font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center;\">Tips & Tricks for Geezers</h2><div style=\"grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1.5rem; display: grid; margin-top: 2rem;\"><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Dining Etiquette</h3><p style=\"color: hsl(var(--muted-foreground));\">Remember to be respectful of your fellow diners and restaurant staff. Arrive on time for group events and communicate any dietary restrictions in advance.</p></div><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Making Reservations</h3><p style=\"color: hsl(var(--muted-foreground));\">When organizing group events, call ahead to make reservations. Many restaurants offer group dining packages for parties of 6 or more.</p></div><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Wine Pairing</h3><p style=\"color: hsl(var(--muted-foreground));\">Do not be afraid to ask your server for wine recommendations. Most restaurants have knowledgeable staff who can suggest perfect pairings for your meal.</p></div><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Group Dynamics</h3><p style=\"color: hsl(var(--muted-foreground));\">Keep conversations inclusive and be mindful of volume levels. Remember, we are all here to enjoy good food and great company.</p></div><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Sharing Photos</h3><p style=\"color: hsl(var(--muted-foreground));\">Feel free to share photos of your dining experiences! Food photography is encouraged, but be respectful of other diners privacy.</p></div><div style=\"background: hsl(var(--card)); padding: 1.5rem; border-radius: 0.5rem;\"><h3 style=\"font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;\">Payment Tips</h3><p style=\"color: hsl(var(--muted-foreground));\">For group dinners, discuss payment arrangements beforehand. Many prefer splitting the bill evenly, while others prefer separate checks.</p></div></div>"
      },
      "position": {
        "x": 0,
        "y": 300,
        "width": 12,
        "height": 600
      }
    }
  ]'::jsonb,
  true,
  'Tips and Tricks - Gallopinggeezers Community Guide',
  'Helpful tips and tricks for dining experiences and community participation at Gallopinggeezers.',
  now(),
  now()
);