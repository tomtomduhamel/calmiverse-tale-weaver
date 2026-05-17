import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string | undefined;

    const body = await req.json().catch(() => ({}));
    const tier = String(body.tier || '');
    const isAnnual = Boolean(body.isAnnual);
    if (!['calmini', 'calmidium', 'calmix', 'calmixxl'].includes(tier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Find price_id
    const { data: priceRow, error: priceErr } = await admin
      .from('stripe_price_mapping')
      .select('stripe_price_id')
      .eq('tier', tier)
      .eq('is_annual', isAnnual)
      .eq('active', true)
      .maybeSingle();
    if (priceErr || !priceRow) {
      return new Response(JSON.stringify({ error: 'Price not configured for this tier' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // Find or create Stripe customer
    const { data: sub } = await admin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id as string | null;
    if (!customerId) {
      if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data[0]) customerId = existing.data[0].id;
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          email,
          metadata: { supabase_user_id: userId },
        });
        customerId = created.id;
      }
      await admin.from('user_subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', userId);
    }

    const origin = req.headers.get('origin') || 'https://calmi-stories.lovable.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceRow.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?status=cancelled`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: userId, tier, is_annual: String(isAnnual) },
      subscription_data: {
        metadata: { supabase_user_id: userId, tier, is_annual: String(isAnnual) },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[create-checkout]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
