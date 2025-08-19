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
    let userData;
    let userId;

    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
      
      // Handle existing user case
      if (createError.message?.includes('A user with this email address has already been registered')) {
        console.log('User already exists, finding existing user and updating profile...');
        
        // Find the existing user
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          throw listError;
        }
        
        const existingUser = existingUsers.users.find(user => user.email === email);
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }
        
        userId = existingUser.id;
        console.log('Found existing user:', userId);
        
        // Reset their password to the temporary password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          user_metadata: {
            display_name: displayName,
            first_name: firstName || '',
            last_name: lastName || '',
            password_change_required: true
          }
        });
        
        if (updateError) {
          console.error('Error updating existing user:', updateError);
          throw updateError;
        }
        
        console.log('Successfully reset password for existing user');
      } else {
        throw createError;
      }
    } else {
      userData = createData;
      userId = userData.user.id;
      console.log('User created successfully:', userId);
    }

    // Upsert the profile with additional info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: displayName,
        first_name: firstName || '',
        last_name: lastName || '',
        email: email
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      throw profileError;
    }
    
    console.log('Profile upserted successfully for user:', userId);

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
      userId: userId,
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