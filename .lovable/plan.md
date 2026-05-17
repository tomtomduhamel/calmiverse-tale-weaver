# Plan d'intégration Stripe (BYOK)

Le projet utilise un Supabase externe — l'intégration Stripe "seamless" de Lovable n'est pas compatible. On part donc sur le Stripe Bring-Your-Own-Key, qui s'appuie sur ton propre compte Stripe et 3 Edge Functions.

## Ce qui existe déjà
- Tables `user_subscriptions` (avec `stripe_subscription_id`) et `subscription_limits` (4 tiers).
- Page `/pricing` avec bouton "Choisir ce plan" (actuellement un `alert()`).
- `SubscriptionService.updateSubscriptionTier()` prêt à être déclenché par le webhook.
- Quotas, guards et UI d'upgrade fonctionnels.

## Ce qu'il reste à faire

### 1. Configuration Stripe (côté toi, dans le dashboard Stripe)
- Créer 4 **Products** Stripe (Calmini, Calmidium, Calmix, Calmixxl).
- Pour chaque produit, créer 2 **Prices** : mensuel + annuel (-20%).
- Noter les 8 `price_id` (format `price_xxx`) — je te demanderai où les coller.
- Récupérer la **Secret Key** (`sk_live_...` ou `sk_test_...`).

### 2. Secrets Supabase à ajouter
- `STRIPE_SECRET_KEY` — clé secrète Stripe.
- `STRIPE_WEBHOOK_SECRET` — généré après création du webhook (étape 4).

### 3. Migration DB
- Ajouter colonne `stripe_customer_id` (text) sur `user_subscriptions` pour relier l'utilisateur à son Customer Stripe.
- Ajouter colonne `stripe_price_id` pour tracer le prix en cours.
- Table `stripe_price_mapping` (tier + is_annual → price_id) pour éviter de hardcoder les IDs dans le code.

### 4. Trois Edge Functions

**`create-checkout`** (JWT requis)
- Reçoit `{ tier, isAnnual }`.
- Crée/réutilise un Customer Stripe lié au `user.id`.
- Crée une `checkout.session` mode `subscription` avec le bon `price_id`.
- Renvoie l'URL de redirection Stripe.

**`stripe-webhook`** (verify_jwt = false, signature Stripe vérifiée)
- Écoute `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Met à jour `user_subscriptions` (tier, status, dates, reset des compteurs) via service role key.

**`customer-portal`** (JWT requis)
- Crée une session du Stripe Billing Portal → l'utilisateur gère/annule son abo lui-même.

### 5. Frontend
- `Pricing.tsx` : remplacer le `alert()` par un appel à `create-checkout` + redirection.
- Ajouter un toggle Mensuel/Annuel fonctionnel (actuellement décoratif).
- `Subscription.tsx` : bouton "Gérer mon abonnement" qui appelle `customer-portal`.
- Pages de retour `/subscription/success` et `/subscription/cancel`.

### 6. Webhook Stripe
- Dans le dashboard Stripe → Developers → Webhooks → ajouter l'URL `https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/stripe-webhook`.
- Récupérer le `whsec_...` et le stocker dans `STRIPE_WEBHOOK_SECRET`.

## Ordre d'exécution recommandé
1. Tu crées les Products/Prices dans Stripe (test mode d'abord).
2. Je migre la DB et crée les 3 edge functions.
3. Tu ajoutes `STRIPE_SECRET_KEY` quand je te le demande.
4. Je branche l'UI sur `/pricing` et `/subscription`.
5. On configure le webhook → tu ajoutes `STRIPE_WEBHOOK_SECRET`.
6. Test bout-en-bout en mode test Stripe (carte `4242 4242 4242 4242`).
7. Passage en mode live.

## Question avant de lancer
As-tu déjà créé les Products/Prices dans Stripe, ou tu veux que je te guide étape par étape avant que je commence à coder ?
