import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function resolveTierFromPriceId(priceId: string): Promise<{ tier: string; isAnnual: boolean } | null> {
  const { data } = await admin
    .from('stripe_price_mapping')
    .select('tier, is_annual')
    .eq('stripe_price_id', priceId)
    .maybeSingle();
  if (!data) return null;
  return { tier: data.tier, isAnnual: data.is_annual };
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription, resetUsage = false) {
  const item = sub.items.data[0];
  const priceId = item?.price.id;
  const resolved = priceId ? await resolveTierFromPriceId(priceId) : null;

  const periodStart = new Date(sub.current_period_start * 1000).toISOString();
  const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

  const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
    : sub.status === 'canceled' ? 'cancelled'
    : sub.status === 'past_due' || sub.status === 'unpaid' ? 'expired'
    : sub.status;

  const update: Record<string, unknown> = {
    status,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    stripe_price_id: priceId,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };
  if (resolved) {
    update.tier = resolved.tier;
    update.is_annual = resolved.isAnnual;
  }

  // Only reset usage on new subscription or new billing period
  if (resetUsage) {
    update.stories_used_this_period = 0;
    update.audio_generations_used_this_period = 0;
    update.video_intros_used_this_period = 0;
  }

  const { error } = await admin
    .from('user_subscriptions')
    .upsert({ user_id: userId, ...update }, { onConflict: 'user_id' });
  if (error) console.error('[webhook upsert error]', error);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) {
    return new Response('Missing signature', { status: 400, headers: corsHeaders });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook signature]', err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400, headers: corsHeaders });
  }

  let logStatus: 'success' | 'error' | 'ignored' = 'success';
  let logError: string | null = null;
  let logUserId: string | null = null;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId && session.subscription) {
          logUserId = userId;
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(userId, sub, true);
        }
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        let userId = sub.metadata?.supabase_user_id;
        if (!userId) {
          const { data } = await admin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', sub.customer as string)
            .maybeSingle();
          userId = data?.user_id;
        }
        if (userId) { logUserId = userId; await upsertSubscription(userId, sub, true); }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        let userId = sub.metadata?.supabase_user_id;
        if (!userId) {
          const { data } = await admin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', sub.customer as string)
            .maybeSingle();
          userId = data?.user_id;
        }
        if (userId) { logUserId = userId; await upsertSubscription(userId, sub, false); }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: row } = await admin
          .from('user_subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
          .select('user_id')
          .maybeSingle();
        logUserId = row?.user_id ?? null;
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription && inv.billing_reason === 'subscription_cycle') {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          let userId = sub.metadata?.supabase_user_id;
          if (!userId) {
            const { data } = await admin
              .from('user_subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', sub.customer as string)
              .maybeSingle();
            userId = data?.user_id;
          }
          if (userId) { logUserId = userId; await upsertSubscription(userId, sub, true); }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          const { data: row } = await admin
            .from('user_subscriptions')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', inv.subscription as string)
            .select('user_id')
            .maybeSingle();
          logUserId = row?.user_id ?? null;
        }
        break;
      }
      default:
        logStatus = 'ignored';
        console.log('[webhook] unhandled', event.type);
    }
    await admin.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      type: event.type,
      status: logStatus,
      payload: event.data.object as any,
      user_id: logUserId,
    });
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[webhook handler]', e);
    logError = (e as Error).message;
    await admin.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      type: event.type,
      status: 'error',
      payload: event.data.object as any,
      error_message: logError,
      user_id: logUserId,
    });
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
