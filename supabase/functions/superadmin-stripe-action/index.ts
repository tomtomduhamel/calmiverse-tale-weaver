import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

async function getSuperAdminClient(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const { data: isSA } = await userClient.rpc('is_super_admin');
  if (!isSA) return null;
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  return { admin, user };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await getSuperAdminClient(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { admin, user } = auth;
    const body = await req.json();
    const { action, target_user_id, params = {} } = body;

    const logAudit = (result: string, metadata: any = {}) =>
      admin.from('security_audit_logs').insert({
        user_id: user.id,
        action: `superadmin.${action}`,
        resource: target_user_id,
        result,
        metadata,
      });

    let result: any = {};

    switch (action) {
      case 'resync_user': {
        const { data: u } = await admin.from('users').select('email').eq('id', target_user_id).maybeSingle();
        if (!u?.email) throw new Error('User not found');
        const customers = await stripe.customers.list({ email: u.email, limit: 1 });
        if (!customers.data.length) throw new Error('No Stripe customer');
        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'all', limit: 1 });
        if (!subs.data.length) throw new Error('No Stripe subscription');
        const sub = subs.data[0];
        const priceId = sub.items.data[0]?.price.id;
        const { data: mapping } = await admin.from('stripe_price_mapping').select('tier,is_annual').eq('stripe_price_id', priceId).maybeSingle();
        await admin.from('user_subscriptions').upsert({
          user_id: target_user_id,
          status: sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status === 'canceled' ? 'cancelled' : 'expired',
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          stripe_price_id: priceId,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          tier: mapping?.tier ?? 'calmini',
          is_annual: mapping?.is_annual ?? false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        result = { ok: true, stripe_subscription_id: sub.id };
        break;
      }
      case 'change_plan': {
        const { new_price_id } = params;
        const { data: us } = await admin.from('user_subscriptions').select('stripe_subscription_id').eq('user_id', target_user_id).maybeSingle();
        if (!us?.stripe_subscription_id) throw new Error('No Stripe subscription on file');
        const sub = await stripe.subscriptions.retrieve(us.stripe_subscription_id);
        const updated = await stripe.subscriptions.update(sub.id, {
          items: [{ id: sub.items.data[0].id, price: new_price_id }],
          proration_behavior: 'create_prorations',
        });
        result = { ok: true, status: updated.status };
        break;
      }
      case 'cancel_subscription': {
        const { at_period_end = true } = params;
        const { data: us } = await admin.from('user_subscriptions').select('stripe_subscription_id').eq('user_id', target_user_id).maybeSingle();
        if (!us?.stripe_subscription_id) throw new Error('No Stripe subscription');
        if (at_period_end) {
          await stripe.subscriptions.update(us.stripe_subscription_id, { cancel_at_period_end: true });
        } else {
          await stripe.subscriptions.cancel(us.stripe_subscription_id);
        }
        result = { ok: true };
        break;
      }
      case 'grant_free_month': {
        const { data: us } = await admin.from('user_subscriptions').select('stripe_subscription_id,current_period_end,is_annual').eq('user_id', target_user_id).maybeSingle();
        if (us?.stripe_subscription_id) {
          const coupon = await stripe.coupons.create({ percent_off: 100, duration: 'once', name: 'Superadmin free month' });
          await stripe.subscriptions.update(us.stripe_subscription_id, { coupon: coupon.id });
          result = { ok: true, coupon: coupon.id };
        } else {
          const newEnd = new Date(us?.current_period_end ?? new Date());
          newEnd.setMonth(newEnd.getMonth() + 1);
          await admin.from('user_subscriptions').update({ current_period_end: newEnd.toISOString(), status: 'active', updated_at: new Date().toISOString() }).eq('user_id', target_user_id);
          result = { ok: true, extended_until: newEnd.toISOString() };
        }
        break;
      }
      case 'reset_quota': {
        await admin.from('user_subscriptions').update({
          stories_used_this_period: 0,
          audio_generations_used_this_period: 0,
          video_intros_used_this_period: 0,
          updated_at: new Date().toISOString(),
        }).eq('user_id', target_user_id);
        result = { ok: true };
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await logAudit('success', { action, params });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[superadmin-stripe-action]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
