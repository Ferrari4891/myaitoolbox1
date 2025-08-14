import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventRejectionRequest {
  eventId: string;
  eventDetails: {
    eventType: string;
    memberName: string;
    venue: {
      business_name: string;
      address: string;
    };
    proposedDate: string;
    creatorId: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId, eventDetails }: EventRejectionRequest = await req.json();

    // Get creator's email from profiles
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', eventDetails.creatorId)
      .single();

    if (profileError || !creatorProfile?.email) {
      console.error('Error fetching creator profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not find creator email' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Format the date
    const eventDate = new Date(eventDetails.proposedDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create the rejection email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Rejection - Galloping Geezers</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 10px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://fd4c5f74-86bb-4f7e-bc3d-7c635105148c.lovableproject.com/lovable-uploads/178b6d98-4629-47e5-a511-0325a803ccda.png" 
                   alt="Galloping Geezers Logo" 
                   style="max-width: 120px; height: auto; display: inline-block;">
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Event Not Approved</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Galloping Geezers Community</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0; font-size: 22px;">Hi ${eventDetails.memberName},</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We regret to inform you that your event proposal has not been approved at this time.
            </p>
            
            <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #ef4444; margin-top: 0; font-size: 18px;">Event Details:</h3>
              <p style="margin: 8px 0;"><strong>Event:</strong> ${eventDetails.eventType} at ${eventDetails.venue.business_name}</p>
              <p style="margin: 8px 0;"><strong>Location:</strong> ${eventDetails.venue.address}</p>
              <p style="margin: 8px 0;"><strong>Proposed Date:</strong> ${formattedDate} at ${formattedTime}</p>
            </div>
            
            <p style="font-size: 16px;">
              Please feel free to submit a new event proposal with different details, or contact an administrator if you have questions about this decision.
            </p>
            
            <p style="font-size: 16px;">
              Thank you for your understanding and continued participation in our community!
            </p>
          </div>
          
          <div style="background: #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Best regards,<br>
              <strong>The Galloping Geezers Admin Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send the rejection email
    const { error: emailError } = await resend.emails.send({
      from: 'Galloping Geezers <onboarding@resend.dev>',
      to: [creatorProfile.email],
      subject: `Event Rejection - ${eventDetails.eventType} at ${eventDetails.venue.business_name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Failed to send rejection email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send rejection email' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Rejection email sent successfully to ${creatorProfile.email} for event: ${eventDetails.eventType}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rejection email sent successfully',
        sentTo: creatorProfile.email
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-event-rejection function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);