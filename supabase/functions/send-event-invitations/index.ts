import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventInvitationRequest {
  invitationId: string;
  eventDetails: {
    eventType: string;
    memberName: string;
    venue: {
      business_name: string;
      address: string;
    };
    proposedDate: string;
    rsvpDeadline: string;
    customMessage?: string;
    inviteToken: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId, eventDetails }: EventInvitationRequest = await req.json();

    // Get all member emails from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .not('email', 'is', null);

    if (profilesError) {
      throw new Error(`Failed to fetch member emails: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('No member emails found');
    }

    const memberEmails = profiles
      .map(p => p.email)
      .filter(email => email && email.trim() !== '');

    if (memberEmails.length === 0) {
      throw new Error('No valid member emails found');
    }

    // Format the event date and time
    const eventDate = new Date(eventDetails.proposedDate);
    const rsvpDate = new Date(eventDetails.rsvpDeadline);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Create RSVP URL - point to the actual application
    const rsvpUrl = `https://fd4c5f74-86bb-4f7e-bc3d-7c635105148c.lovableproject.com/event-rsvp?token=${eventDetails.inviteToken}`;

    // Create email content
    const emailSubject = `🎉 You're Invited: ${eventDetails.eventType} at ${eventDetails.venue.business_name}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Galloping Geezers Event Invitation</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 10px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://fd4c5f74-86bb-4f7e-bc3d-7c635105148c.lovableproject.com/public/lovable-uploads/178b6d98-4629-47e5-a511-0325a803ccda.png" 
                   alt="Galloping Geezers Logo" 
                   style="max-width: 120px; height: auto; display: inline-block;">
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Galloping Geezers Community Event</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0; display: flex; align-items: center;">
              ${eventDetails.eventType === 'Coffee' ? '☕' : eventDetails.eventType === 'Lunch' ? '🍽️' : '🍽️'} ${eventDetails.eventType} Event
            </h2>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: #667eea;">📅 Date:</span>
                <span>${formatDate(eventDate)}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: #667eea;">🕐 Time:</span>
                <span>${formatTime(eventDate)}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: #667eea;">📍 Venue:</span>
                <span>${eventDetails.venue.business_name}</span>
              </div>
              
              <div style="padding-left: 25px; color: #666; font-size: 14px;">
                ${eventDetails.venue.address}
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: #667eea;">👤 Organized by:</span>
                <span>${eventDetails.memberName}</span>
              </div>
            </div>
          </div>
          
          ${eventDetails.customMessage ? `
            <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">Message from ${eventDetails.memberName}:</h3>
              <p style="margin-bottom: 0; font-style: italic;">"${eventDetails.customMessage}"</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${rsvpUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              🎯 RSVP Now
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; color: #856404;">
              <strong>⏰ Please RSVP by ${formatDate(rsvpDate)}</strong><br>
              This helps us plan for the right number of attendees.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
            <p>Can't click the button? Copy this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${rsvpUrl}</p>
            <p style="margin-top: 20px;">
              <strong>Galloping Geezers Community</strong><br>
              Bringing our community together, one event at a time!
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails to all members
    const emailPromises = memberEmails.map(async (email) => {
      try {
        const { error } = await resend.emails.send({
          from: 'Galloping Geezers <onboarding@resend.dev>',
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (error) {
          console.error(`Failed to send email to ${email}:`, error);
          return { email, success: false, error: error.message };
        }

        return { email, success: true };
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return { email, success: false, error: 'Unknown error' };
      }
    });

    const results = await Promise.all(emailPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email sending completed: ${successCount} successful, ${failureCount} failed`);
    
    if (failureCount > 0) {
      console.error('Failed emails:', results.filter(r => !r.success));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitations sent to ${successCount} members`,
        details: {
          successful: successCount,
          failed: failureCount,
          total: memberEmails.length,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-event-invitations function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);