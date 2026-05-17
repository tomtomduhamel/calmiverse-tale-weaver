import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: isSA } = await userClient.rpc('is_super_admin');
    if (!isSA) return new Response('Forbidden', { status: 403, headers: corsHeaders });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    if (!userId) return new Response('Missing user_id', { status: 400, headers: corsHeaders });

    const { data: u } = await admin.from('users').select('email').eq('id', userId).maybeSingle();
    if (!u?.email) return new Response(JSON.stringify({ customer: null, invoices: [], subscriptions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const customers = await stripe.customers.list({ email: u.email, limit: 1 });
    const customer = customers.data[0] ?? null;
    let invoices: any[] = [];
    let subscriptions: any[] = [];
    if (customer) {
      const [inv, subs] = await Promise.all([
        stripe.invoices.list({ customer: customer.id, limit: 20 }),
        stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10 }),
      ]);
      invoices = inv.data.map(i => ({
        id: i.id, number: i.number, amount_paid: i.amount_paid, currency: i.currency,
        status: i.status, created: i.created, hosted_invoice_url: i.hosted_invoice_url,
      }));
      subscriptions = subs.data.map(s => ({
        id: s.id, status: s.status,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        price_id: s.items.data[0]?.price.id,
      }));
    }

    return new Response(JSON.stringify({
      customer: customer ? { id: customer.id, email: customer.email } : null,
      invoices,
      subscriptions,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
