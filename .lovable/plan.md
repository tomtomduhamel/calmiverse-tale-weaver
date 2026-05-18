
# Anthony Renard bloqué — diagnostic & plan d'action

## 1. Diagnostic (certitude haute)

L'image montre l'écran générique Lovable :
> « Publish or update your Lovable project for it to appear here. »

avec une URL tronquée se terminant par `…ories.lovable.app`. Il s'agit de l'**ancien sous-domaine publié** `calmi-stories.lovable.app`.

URLs actuelles du projet :
- Préviu : `id-preview--a3a7afdb-…lovable.app`
- **Publiée actuelle** : `https://calmistory.lovable.app`
- **Domaine officiel** : `https://calmistory.com` (et `www.`)

Quand le projet a été renommé / republié sous `calmistory`, l'ancien slug `calmi-stories` a été libéré. Lovable y sert désormais sa page placeholder. Anthony a donc :
- soit installé la **PWA il y a longtemps** depuis l'ancienne URL (l'icône sur son écran d'accueil pointe vers `calmi-stories.lovable.app`),
- soit conservé un **bookmark / lien partagé** vers cette URL.

Aucun problème côté base, code, abonnement ou pipeline de génération — Anthony est sur **Calmix actif** (vérifié le 17 mai). Il ne voit simplement jamais l'application : son navigateur affiche la page placeholder Lovable, donc il ne peut pas accéder à la création d'histoire.

Ce n'est **pas** le bug "Erreur de génération" du 17 mai. C'est un problème d'**adresse**.

## 2. Action immédiate — débloquer Anthony (aujourd'hui)

Lui envoyer un message clair en français, avec ces étapes dans l'ordre :

1. **Ne plus utiliser** l'icône actuelle / le lien actuel (`calmi-stories.lovable.app`).
2. **Désinstaller l'ancienne PWA** :
   - Android : appui long sur l'icône → Désinstaller / Supprimer.
   - iOS : appui long sur l'icône → Supprimer l'app.
3. Ouvrir Chrome / Safari et aller sur **`https://calmistory.com`** (la bonne URL, définitive).
4. Se reconnecter avec `anthonyrenard5@hotmail.com`.
5. (Optionnel) **Réinstaller la PWA** depuis cette nouvelle URL : menu navigateur → « Ajouter à l'écran d'accueil » / « Installer l'application ». La nouvelle icône pointera vers `calmistory.com` et restera à jour.

Lui préciser que son abonnement Calmix et ses 3 histoires sont intacts — il les retrouvera dans sa bibliothèque dès la connexion.

## 3. Vérification post-déblocage

Demander à Anthony une capture d'écran de :
- la nouvelle URL dans la barre d'adresse (`calmistory.com`),
- l'écran d'accueil de l'app après connexion.

Si à ce moment-là il rencontre **réellement** une erreur de création d'histoire, on bascule sur le diagnostic pipeline (cf. §5) — mais c'est un autre sujet.

## 4. Prévention pour les autres utilisateurs (haute priorité)

Anthony n'est probablement pas le seul. Toute personne ayant installé la PWA ou bookmarké le site avant le renommage est dans le même état. Actions à prévoir (hors plan mode, lors de l'implémentation) :

1. **Communication proactive** :
   - Email à toute la base utilisateur via Resend/Supabase : « Calmi a une nouvelle adresse, voici comment réinstaller l'app ».
   - Post sur les canaux existants (Instagram, communauté beta).

2. **Bandeau de redirection** : impossible à mettre sur `calmi-stories.lovable.app` (ce sous-domaine ne nous appartient plus côté Lovable, il sert la page placeholder). On ne peut donc **pas** y injecter une redirection. La seule chose à faire est la communication directe.

3. **Verrouiller l'URL canonique** : s'assurer que toutes les communications futures (emails transactionnels, partages d'histoires, signatures, factures Stripe, métadonnées OG, manifest PWA) pointent **exclusivement** vers `https://calmistory.com`. À auditer :
   - `public/manifest.json` → `start_url`, `scope`.
   - Edge functions envoyant des emails (lien dans le mail de confirmation, partage, Kindle).
   - Liens dans `index.html` (canonical, og:url) — déjà fait.
   - Webhooks Stripe et URLs de retour checkout.

4. **Monitoring** : ajouter un évènement analytique « première connexion depuis nouveau domaine » pour estimer combien d'utilisateurs sont encore perdus.

## 5. Note sur la fragilité du pipeline (rappel, pas l'objet immédiat)

Le 17 mai on avait identifié que le pipeline de génération de titres (`useStoryFormHandlers` → `generate-titles` n8n → Edge Function → DB) reste fragile. Ce n'est **pas** la cause du blocage d'aujourd'hui, mais à garder en tête : si Anthony revient sur la bonne URL et bute sur l'écran de génération, on aura confirmation que la robustesse du pipeline doit redevenir prioritaire (retry, timeout UX, message d'erreur clair, fallback).

## 6. Livrable de ce plan

Une fois validé, l'implémentation se résume à :
- (a) répondre à Anthony avec le message du §2,
- (b) auditer les URLs canoniques (§4.3),
- (c) préparer un email de communication aux utilisateurs (§4.1).

Aucun changement de code complexe — c'est principalement de la communication + un audit URL.
