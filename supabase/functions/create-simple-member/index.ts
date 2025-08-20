import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SimpleMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  joinedAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create simple member function called');
    
    const { email, firstName, lastName, displayName, joinedAt }: SimpleMemberRequest = await req.json();
    
    console.log(`Creating simple member: ${email} (${displayName})`);

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

    // Check if member already exists
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('simple_members')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing member:', checkError);
      throw checkError;
    }

    if (existingMember) {
      console.log('Member already exists');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Member already exists'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Insert the new simple member
    const { error: insertError } = await supabaseAdmin
      .from('simple_members')
      .insert({
        email: email,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        joined_at: joinedAt,
        is_active: true,
        receive_notifications: true
      });

    if (insertError) {
      console.error('Error inserting simple member:', insertError);
      throw insertError;
    }
    
    console.log('Simple member created successfully:', email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Member created successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in create-simple-member function:", error);
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