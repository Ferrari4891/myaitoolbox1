import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  invitationId: string;
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId, recipientEmail }: RequestBody = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error('Invalid email format');
    }

    // Get invitation details from database
    const { data: invitation, error: invitationError } = await supabase
      .from('group_invitations')
      .select(`
        id,
        group_name,
        proposed_date,
        rsvp_deadline,
        custom_message,
        invite_token,
        venue_id,
        creator_id,
        approval_status
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Failed to fetch invitation: ${invitationError.message}`);
    }

    // Check if invitation is approved
    if (invitation.approval_status !== 'approved') {
      throw new Error('Can only resend invitations for approved events');
    }

    // Get venue details
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('business_name, address, average_rating')
      .eq('id', invitation.venue_id);

    if (venueError || !venues || venues.length === 0) {
      throw new Error(`Failed to fetch venue details: ${venueError?.message || 'Venue not found'}`);
    }

    // Format the event date and time
    const eventDate = new Date(invitation.proposed_date);
    const rsvpDate = new Date(invitation.rsvp_deadline);
    
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

    // Create RSVP URL
    const rsvpUrl = `https://fd4c5f74-86bb-4f7e-bc3d-7c635105148c.lovableproject.com/event-rsvp?token=${invitation.invite_token}`;

    // Create email content
    const emailSubject = `🎉 You're Invited: ${invitation.group_name}`;
    
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
              <img src="https://fd4c5f74-86bb-4f7e-bc3d-7c635105148c.lovableproject.com/lovable-uploads/178b6d98-4629-47e5-a511-0325a803ccda.png" 
                   alt="Galloping Geezers Logo" 
                   style="max-width: 120px; height: auto; display: inline-block;">
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Galloping Geezers Community Event</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0; display: flex; align-items: center;">
              🍽️ ${invitation.group_name}
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
                <span>${venues[0].business_name}</span>
              </div>
              
              <div style="padding-left: 25px; color: #666; font-size: 14px;">
                ${venues[0].address}
              </div>
              ${venues[0].average_rating ? `<div style="padding-left: 25px; color: #666; font-size: 14px;">⭐ Rating: ${Number(venues[0].average_rating).toFixed(1)}/5</div>` : ''}
            </div>
          </div>
          
          ${invitation.custom_message ? `
            <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">Message from organizer:</h3>
              <p style="margin-bottom: 0; font-style: italic;">"${invitation.custom_message}"</p>
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

    // Send email
    console.log(`Attempting to send email to: ${recipientEmail}`);
    console.log(`Using Resend API key: ${resendApiKey ? 'Present' : 'Missing'}`);
    
    const emailResult = await resend.emails.send({
      from: 'Galloping Geezers <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log('Resend API response:', emailResult);

    if (emailResult.error) {
      console.error('Resend API error details:', emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message || JSON.stringify(emailResult.error)}`);
    }

    console.log(`Individual invitation sent successfully to ${recipientEmail} for event ${invitationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent successfully to ${recipientEmail}`,
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
    console.error('Error in send-individual-invitation function:', error);
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