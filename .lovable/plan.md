
## Objectif

Créer un espace `/superadmin` réservé à un nouveau rôle `super_admin` (toi uniquement), pour piloter toute la partie facturation Stripe : KPIs, liste des abonnés, actions sur un abonné, logs webhooks et gestion des price_id.

---

## 1. Base de données — rôle super_admin

Migration :
- Ajouter la valeur `super_admin` à l'enum `app_role`.
- Insérer une ligne dans `user_roles` pour ton `user_id` avec `role = 'super_admin'` (tu confirmeras l'email à utiliser pour le lookup).
- Créer une fonction `is_super_admin()` (SECURITY DEFINER, basée sur `has_role(auth.uid(), 'super_admin')`).
- Créer une table `stripe_webhook_events` pour journaliser les events reçus :
  - `stripe_event_id` (unique), `type`, `status` (`success`/`error`/`ignored`), `payload` (jsonb), `error_message`, `user_id` (nullable), `created_at`.
  - RLS : SELECT réservé à `is_super_admin()`, INSERT autorisé (utilisé par l'edge function `stripe-webhook`).
- Politiques RLS supplémentaires sur `user_subscriptions`, `users`, `stripe_price_mapping` : `is_super_admin()` peut SELECT/UPDATE (en plus des règles existantes).

## 2. Edge functions

- **`stripe-webhook`** : à la fin de chaque traitement, insérer un enregistrement dans `stripe_webhook_events` (succès ou erreur, avec payload tronqué).
- **`superadmin-stripe-action`** (nouvelle, `verify_jwt=true`) : actions sensibles côté Stripe, après vérification serveur que `auth.uid()` est super_admin.
  - `resync_user` : récupère la subscription Stripe par email et met à jour `user_subscriptions` (tier, period, status).
  - `change_plan` : appelle `stripe.subscriptions.update` avec un nouveau price_id.
  - `cancel_subscription` : `stripe.subscriptions.cancel` (immédiat ou en fin de période).
  - `grant_free_month` : crée un coupon 100% / 1 mois et l'applique à la subscription, ou prolonge `current_period_end` en DB pour les comptes sans Stripe (beta).
  - `reset_quota` : remet à 0 les compteurs `*_used_this_period`.

## 3. Frontend — route `/superadmin`

- `SuperAdminGuard` (copie d'`AdminGuard`) basé sur un hook `useIsSuperAdmin` (`user_roles` where `role='super_admin'`).
- Layout dédié avec sidebar (sous-sections) :
  - **Overview** : cartes KPI
    - MRR estimé (somme des prix actifs depuis `user_subscriptions` + `subscription_limits`).
    - Abonnés actifs par tier (calmini/calmidium/calmix/calmixxl), répartition mensuel/annuel.
    - Nouveaux abonnés (7j / 30j), abonnés expirés.
    - Quotas consommés moyens par tier.
  - **Abonnés** : table filtrable/searchable (email, tier, statut, période, stripe_customer_id). Détail au clic :
    - Infos user + abonnement courant + historique invoices (récupéré via une edge function `superadmin-stripe-fetch` côté Stripe).
    - Boutons d'action : changer de tier (select des price_id), annuler, offrir un mois, reset quotas, resynchroniser depuis Stripe.
  - **Webhooks** : table paginée de `stripe_webhook_events` (filtre type/status), bouton pour rejouer un event échoué (re-traite localement le payload via une edge function dédiée).
  - **Price mapping** : CRUD sur `stripe_price_mapping` (tier, is_annual, stripe_price_id, active) avec validation que tous les couples tier × is_annual ont bien un price actif.
- Navigation : ajout d'un lien "Superadmin" dans `AdminLinksSection` visible uniquement si `isSuperAdmin`.

## 4. Sécurité

- Toutes les actions destructives passent par l'edge function avec re-check `is_super_admin()` côté serveur (jamais de confiance dans l'UI seule).
- AlertDialog de confirmation systématique côté UI (cancel, change_plan, grant_free_month).
- Logs : chaque action super_admin écrit dans `security_audit_logs` (action, target_user_id, metadata).

## 5. Hors scope

- Pas de modification du flux Stripe pour les utilisateurs finaux.
- Pas de refonte de l'admin existant (`/admin/*` reste tel quel).
- Pas de mobile-first poussé : interface optimisée desktop (usage interne).

---

## Détails techniques

- Fichiers créés :
  - `src/components/superadmin/SuperAdminGuard.tsx`
  - `src/hooks/auth/useIsSuperAdmin.ts`
  - `src/pages/superadmin/Layout.tsx`, `Overview.tsx`, `Subscribers.tsx`, `SubscriberDetail.tsx`, `Webhooks.tsx`, `PriceMapping.tsx`
  - `supabase/functions/superadmin-stripe-action/index.ts`
  - `supabase/functions/superadmin-stripe-fetch/index.ts`
- Migration : nouvelle valeur enum + table `stripe_webhook_events` + policies + insert du rôle.
- Confirmation requise avant migration : **quel email/user_id doit recevoir le rôle `super_admin`** ?
