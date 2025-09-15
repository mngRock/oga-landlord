import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // CORS pre-flight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyId, tenantEmail, tenantName, rentAmount, startDate, endDate } = await req.json()

    // Admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Auth client to verify the landlord making the request
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: landlordUser } } = await supabaseAuth.auth.getUser();
    if (!landlordUser) throw new Error("Authentication failed: Landlord not found.");

    // --- THE FIX: Handle both existing and new users ---
    let tenantId: string;

    // 1. Check if the user already exists using the correct listUsers method.
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        email: tenantEmail,
    });

    if (listError) throw listError;

    if (users && users.length > 0) {
        // If the user exists, use their ID.
        tenantId = users[0].id;
        // Also ensure they have a renter profile enabled.
        await supabaseAdmin.from('profiles').update({ has_renter_profile: true }).eq('id', tenantId);
    } else {
        // If the user does not exist, invite them.
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(tenantEmail, {
          data: { full_name: tenantName, role: 'renter', has_renter_profile: true }
        });
        if (inviteError) throw inviteError;
        tenantId = inviteData.user.id;
    }
    // --- End of Fix ---

    // --- Proceed with the rest of the logic ---
    const { data: landlordProfile } = await supabaseAuth.from('profiles').select('full_name').eq('id', landlordUser.id).single();
    const { data: property } = await supabaseAuth.from('properties').select('title').eq('id', propertyId).single();

    await supabaseAdmin.from('tenancies').insert({
      property_id: propertyId, tenant_id: tenantId, landlord_id: landlordUser.id,
      start_date: startDate, end_date: endDate, rent_amount: rentAmount,
      rent_frequency: 'per_year', is_active: false
    });

    await supabaseAdmin.from('notifications').insert({
      user_id: tenantId,
      message: `${landlordProfile?.full_name || 'A landlord'} has added you as a tenant for "${property?.title || 'a property'}". Please review.`,
      link_to: '/dashboard/my-rental'
    });
    
    return new Response(JSON.stringify({ message: "Invitation sent successfully!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})