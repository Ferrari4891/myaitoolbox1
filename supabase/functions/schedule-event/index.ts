import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      memberEmail,
      memberName,
      eventType,
      venueId,
      proposedDate,
      rsvpDeadline,
      customMessage,
      inviteType,
      selectedMembers
    } = await req.json()

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the member exists in simple_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('simple_members')
      .select('id, email, display_name')
      .eq('email', memberEmail)
      .eq('is_active', true)
      .single()

    if (memberError || !memberData) {
      return new Response(
        JSON.stringify({ error: 'Member not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get venue name for the group name
    const { data: venueData } = await supabaseAdmin
      .from('venues')
      .select('business_name')
      .eq('id', venueId)
      .single()

    const venueName = venueData?.business_name || 'Unknown Venue'

    // Create the group invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('group_invitations')
      .insert({
        creator_id: memberData.id, // Use simple member ID
        group_name: `${eventType} at ${venueName}`,
        venue_id: venueId,
        proposed_date: proposedDate,
        rsvp_deadline: rsvpDeadline,
        custom_message: customMessage,
        approval_status: 'pending',
        invite_type: inviteType,
        selected_member_ids: inviteType === 'select' ? JSON.stringify(selectedMembers) : null
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create event invitation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in schedule-event function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})