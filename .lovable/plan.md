## Diagnostic complet

J'ai investigué la base, le code d'inscription et le flow de création d'histoire. Il y a en réalité **trois problèmes distincts** qui se cumulent sur le compte d'Anthony Renard (`anthonyrenard5@hotmail.com`, id `f997ee22-e15f-41c1-bccb-6305d8f305a2`).

### Problème 1 — Le mail de confirmation n'arrivera jamais (par design, mais le UX ment)

État réel d'Anthony dans la base :
- `auth.users.email_confirmed_at` = `2026-05-17 16:10:15` (= identique à `created_at`)
- Audit log : `user_signedup` suivi immédiatement de `login` (provider email). **Aucune entrée `user_confirmation_requested`.**
- `supabase/config.toml` :
  ```toml
  [auth.email]
  enable_confirmations = false
  ```

Conclusion : la confirmation par e-mail est **désactivée** côté projet Supabase. Aucun mail de confirmation n'est généré, l'utilisateur est auto-confirmé et auto-connecté.

Pourtant, `useAuthOperations.signUpWithEmail` (src/hooks/auth/useAuthOperations.ts ligne 82-85) affiche après inscription :
> *« Votre demande est en attente de validation. Vous serez notifié dès que votre accès sera activé. »*

→ Anthony interprète ça comme « j'attends un mail ». Mais aucun mail ne lui sera envoyé (ni confirmation, ni validation beta — voir Problème 2).

### Problème 2 — Anthony n'existe ni dans `beta_users` ni dans `public.users`, donc rien ne s'active

Vérifications base :
- `public.beta_users` WHERE user_id = `f997ee22…` → **0 ligne**
- `public.users` WHERE id = `f997ee22…` → **0 ligne**
- `public.user_subscriptions` WHERE user_id = `f997ee22…` → **0 ligne**
- `public.children` WHERE authorid = `f997ee22…` → 1 ligne (Myla)
- `public.stories` WHERE authorid = `f997ee22…` → **0 histoire** (les tentatives ont échoué)

Causes :

1. `signUpWithEmail` appelle `supabase.rpc('create_pending_beta_user', ...)` dans un `try/catch` qui **avale les erreurs** (lignes 65-79). La RPC a manifestement échoué (probablement contrainte `NOT NULL` sur `invitation_code` mais valeur `'DIRECT'` rejetée par une autre règle, ou contrainte FK manquante) — résultat : Anthony n'est pas dans la file de validation admin.
2. Le seul trigger sur `auth.users` est `on_auth_user_created_for_family` qui crée `families` + `family_members`. **Aucun trigger** ne crée la ligne `public.users` correspondante. Or `user_subscriptions.user_id` a une FK vers `public.users(id)` (mémoire projet « validate_beta_user auto-creates public.users entry via UPSERT »). Donc la tentative d'auto-création d'un trial dans `useSubscription.fetchSubscription` se solde par une violation de FK → toast d'erreur « Impossible de récupérer les informations d'abonnement ».
3. Conséquence en cascade : pas d'abonnement → pas de quotas → l'app peut afficher des erreurs ou bloquer certains parcours.

Anthony est donc **un fantôme** : connecté, autorisé à voir l'app, mais sans aucun statut d'abonnement et invisible pour l'admin qui pourrait valider son accès beta.

### Problème 3 — « Failed to fetch » sur la génération de titres

Le bouton « Créer mon histoire » sur la page d'accueil déclenche `useN8nTitleGeneration.generateTitles` qui appelle :
```ts
supabase.functions.invoke('trigger-n8n', {
  body: { targetUrl: 'https://n8n.srv856374.hstgr.cloud/webhook/067ee…', payload }
});
```

`"Failed to fetch"` (visible dans la toast) est une erreur **réseau pure** côté navigateur : la requête n'a même pas atteint la Edge Function (ou la réponse a été interrompue avant les headers). Trois causes plausibles, par ordre de probabilité :

1. **Service Worker PWA obsolète sur l'appareil d'Anthony** : il a installé une ancienne version de la PWA avec le bug `reloadApp` corrigé hier. Le vieux SW peut servir des fragments HTML cachés et bloquer en silence des requêtes `POST` vers `/functions/v1/` si la registration est incohérente. Le polling de version qu'on a mis en place ne se déclenche que pour des reloads navigationnels, pas pour les fetch d'API.
2. **Webhook n8n indisponible / lent au-delà du timeout** : `n8n.srv856374.hstgr.cloud` peut être down ou en train de cold-start. Le retry intégré (`while (retriesGen < 3)`) ne déclenche que sur certains mots-clés d'erreur, pas sur tous les cas `TypeError: Failed to fetch`.
3. **JWT expiré dans le client** : `supabase.functions.invoke` envoie automatiquement le token, mais si l'auto-refresh a foiré, l'edge function répond 401 ; cependant ça serait remonté comme `error.message`, pas comme « Failed to fetch » côté supabase-js v2 — peu probable.

Logs : `supabase--edge_function_logs` ne retourne rien pour `trigger-n8n` sur les dernières heures → la requête d'Anthony n'a probablement **jamais touché** l'edge function, ce qui pointe fortement vers les causes 1 ou 2.

---

## Plan d'action

### Étape A — Récupérer le compte d'Anthony (immédiat, manuel)

But : qu'il puisse utiliser l'app dès maintenant.

1. **Migration SQL one-shot** pour réparer son compte :
   ```sql
   -- 1. Créer la ligne public.users manquante
   INSERT INTO public.users (id, email)
   VALUES ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'anthonyrenard5@hotmail.com')
   ON CONFLICT (id) DO NOTHING;

   -- 2. Créer son entrée beta_users en statut 'pending' (pour que l'admin la voie)
   INSERT INTO public.beta_users (user_id, email, invitation_code, status, requested_at)
   VALUES ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'anthonyrenard5@hotmail.com', 'DIRECT', 'pending', now())
   ON CONFLICT DO NOTHING;

   -- 3. Lui créer un trial calmini de 30 jours
   INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_start, current_period_end)
   VALUES ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'calmini', 'trial', now(), now() + interval '30 days')
   ON CONFLICT (user_id) DO NOTHING;
   ```

2. Envoyer un message manuel à Anthony : « Ton compte est actif, aucun mail de confirmation n'est nécessaire, tu peux te connecter directement. »

### Étape B — Corriger les causes systémiques (pour les futurs inscrits)

#### B1. Trigger `on_auth_user_created` pour peupler `public.users` automatiquement

Migration :
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_public_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_public_users
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_public_row();
```

Ça résout définitivement la racine : tous les futurs inscrits auront une ligne `public.users` → plus de violation FK sur `user_subscriptions`.

#### B2. Trigger pour auto-créer un trial Calmini

Migration complémentaire (en option, dépend de la politique business — on peut aussi laisser `useSubscription` le faire à la 1re connexion, mais c'est plus robuste côté DB) :
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_subscriptions
    (user_id, tier, status, current_period_start, current_period_end)
  VALUES (NEW.id, 'calmini', 'trial', now(), now() + interval '30 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_trial
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trial();
```

L'ordre des triggers garantira que `public.users` est créé avant `user_subscriptions` (ou on chaîne tout dans un seul trigger qui fait les 3 INSERT).

#### B3. Robustifier `signUpWithEmail`

`src/hooks/auth/useAuthOperations.ts` :
- Ne plus avaler en silence l'erreur de `create_pending_beta_user` — la logger + afficher une vraie toast d'erreur si elle échoue, pour qu'on s'en rende compte la prochaine fois.
- Adapter le message de fin d'inscription au vrai état du projet :
  - Aujourd'hui : « Votre demande est en attente de validation. »
  - Réécriture : « Bienvenue ! Votre compte est créé. Votre essai gratuit Calmini de 30 jours est actif. »
  - Si vraiment une validation beta est attendue, garder « en attente » mais préciser : « Aucun mail de confirmation à attendre — vous serez prévenu directement dans l'app dès que votre accès sera activé. »

### Étape C — Résoudre le « Failed to fetch »

#### C1. Forcer un reset PWA sur les anciennes installations

Sur l'appareil d'Anthony, l'ancien SW est probablement bloquant. Deux actions :

1. **Lui dire** : ouvrir la PWA, aller dans Paramètres → « Vérifier les mises à jour » (le bouton qu'on a corrigé hier). Si rien, désinstaller + réinstaller la PWA. En navigateur classique : vider le cache du site.
2. **Ajouter un "kill switch" côté code** : dans `usePWA`, si `version.json` du serveur diffère du `APP_VERSION` local **et** que la version locale est antérieure à `1.2.1+<buildHier>`, déclencher automatiquement le `reloadApp()` corrigé sans attendre l'action utilisateur. Ça désamorcera tous les anciens SW restants chez les autres utilisateurs en silence.

#### C2. Ajouter un fallback / meilleure gestion d'erreur sur `generateTitles`

`src/hooks/stories/useN8nTitleGeneration.tsx` (ligne 388-398) :
- Élargir la condition de retry pour inclure aussi `TypeError`, `Failed to fetch`, `failed to fetch` (cas insensible).
- Augmenter le nombre de retries de 3 à 4 avec backoff.
- En cas d'échec final, afficher un message plus actionable : « Le service de génération est temporairement indisponible. Réessaie dans quelques secondes — si l'erreur persiste, recharge l'app depuis Paramètres → Vérifier les mises à jour. »

#### C3. Vérifier la santé du webhook n8n

Action manuelle : aller sur `https://n8n.srv856374.hstgr.cloud/healthz` (ou pinger le webhook avec un payload de test depuis `supabase--curl_edge_functions trigger-n8n`) pour confirmer qu'il répond. Si n8n est down/lent, c'est une cause externe à corriger côté infra n8n (pas dans cette app).

### Étape D — Communication à Anthony

Une fois Étape A appliquée :

> Bonjour Anthony, ton compte est bien créé et déjà actif — il n'y avait en fait aucun mail de confirmation à attendre (notre système valide automatiquement). Tu peux te reconnecter directement avec `anthonyrenard5@hotmail.com`. Concernant l'erreur « Failed to fetch » au moment de créer une histoire, peux-tu : 1) recharger l'application (Paramètres → Vérifier les mises à jour), 2) réessayer la création — c'était probablement un souci réseau temporaire. Si ça reste, dis-le moi.

---

## Fichiers / migrations impactés

- **Migration SQL** : 1 migration unique avec
  - réparation manuelle du compte d'Anthony (Étape A)
  - création de `handle_new_user_public_row` + trigger (B1)
  - création de `handle_new_user_trial` + trigger (B2)
- `src/hooks/auth/useAuthOperations.ts` — log d'erreur RPC + message de toast (B3)
- `src/hooks/stories/useN8nTitleGeneration.tsx` — retry élargi + message d'erreur (C2)
- `src/hooks/usePWA.ts` — auto-reload silencieux sur versions très anciennes (C1, optionnel)
