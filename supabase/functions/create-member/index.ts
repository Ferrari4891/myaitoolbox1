import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { NewMemberEmail } from './_templates/new-member-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberRequest {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create member function called');
    
    const { email, displayName, firstName, lastName }: CreateMemberRequest = await req.json();
    
    console.log(`Creating member: ${email} (${displayName})`);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create the user with temporary password
    const tempPassword = "geezer";
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        display_name: displayName,
        first_name: firstName || '',
        last_name: lastName || '',
        password_change_required: true
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created successfully:', userData.user.id);

    // Update the profile with additional info (the trigger should create it, but we update it)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: displayName,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email
      })
      .eq('user_id', userData.user.id);

    if (profileError) {
      console.warn('Profile update error (may be normal):', profileError);
    }

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(NewMemberEmail, {
        displayName: displayName || 'New Member',
        email: email,
        tempPassword: tempPassword,
      })
    );

    // Send the email with login credentials
    const emailResponse = await resend.emails.send({
      from: "Smart Guide Books <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 Welcome to Smart Guide Books - Your Account Details",
      html: emailHtml,
    });

    console.log("New member email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      userId: userData.user.id,
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in create-member function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);