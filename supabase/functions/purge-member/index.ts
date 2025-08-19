import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurgeMemberRequest {
  userId: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Purge member function called');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ 
        error: 'No authorization header',
        success: false 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      });
    }

    // Initialize Supabase client with user token to check permissions
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('is_admin')
      .eq('user_id', (await supabaseUser.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error('User is not admin or profile not found:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Admin access required',
        success: false 
      }), {
        status: 403,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      });
    }

    const { userId, email }: PurgeMemberRequest = await req.json();
    
    console.log(`Purging member: ${userId} (${email})`);

    // Initialize Supabase admin client for actual deletion
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

    // 1. Delete from all related tables first (foreign key order)
    console.log('Deleting invitation_rsvps...');
    const { error: rsvpError } = await supabaseAdmin
      .from('invitation_rsvps')
      .delete()
      .eq('invitee_user_id', userId);
    
    if (rsvpError) {
      console.warn('Error deleting RSVPs (may not exist):', rsvpError);
    }

    console.log('Deleting group_invitations...');
    const { error: invitationsError } = await supabaseAdmin
      .from('group_invitations')
      .delete()
      .eq('creator_id', userId);
    
    if (invitationsError) {
      console.warn('Error deleting invitations (may not exist):', invitationsError);
    }

    console.log('Deleting venue_ratings...');
    const { error: ratingsError } = await supabaseAdmin
      .from('venue_ratings')
      .delete()
      .eq('user_id', userId);
    
    if (ratingsError) {
      console.warn('Error deleting ratings (may not exist):', ratingsError);
    }

    console.log('Deleting venues...');
    const { error: venuesError } = await supabaseAdmin
      .from('venues')
      .delete()
      .eq('submitted_by', userId);
    
    if (venuesError) {
      console.warn('Error deleting venues (may not exist):', venuesError);
    }

    console.log('Deleting saved_restaurants...');
    const { error: restaurantsError } = await supabaseAdmin
      .from('saved_restaurants')
      .delete()
      .eq('user_id', userId);
    
    if (restaurantsError) {
      console.warn('Error deleting saved restaurants (may not exist):', restaurantsError);
    }

    console.log('Deleting collections...');
    const { error: collectionsError } = await supabaseAdmin
      .from('collections')
      .delete()
      .eq('user_id', userId);
    
    if (collectionsError) {
      console.warn('Error deleting collections (may not exist):', collectionsError);
    }

    console.log('Deleting businesses...');
    const { error: businessesError } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('user_id', userId);
    
    if (businessesError) {
      console.warn('Error deleting businesses (may not exist):', businessesError);
    }

    console.log('Deleting user_preferences...');
    const { error: prefsError } = await supabaseAdmin
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (prefsError) {
      console.warn('Error deleting preferences (may not exist):', prefsError);
    }

    console.log('Deleting profiles...');
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profilesError) {
      console.warn('Error deleting profile (may not exist):', profilesError);
    }

    // 2. Finally, delete the Auth user (this cascades to auth-related tables)
    console.log('Deleting auth user...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }

    console.log('Successfully purged all member data for user:', userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully purged all data for user ${email || userId}`,
      userId: userId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in purge-member function:", error);
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