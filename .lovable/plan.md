## 1. Beta testeurs : Calmix 3 mois ?

**Oui, pour le système actuel.** Une seule invitation beta est active aujourd'hui :

- Code `LESAMISDECALMI` → **tier `calmix`**, **durée 3 mois**, 5 utilisations à ce jour.

La fonction `validate_beta_user` applique automatiquement le tier et la durée définis dans `beta_invitations` au moment de la validation admin.

**Exceptions historiques** (avant ce code unique) :
- `emeline_duhamel@yahoo.fr` → `calmini` (ancien code/process).
- `tomtom.duhamel@gmail.com` → aucune souscription créée (validation incomplète).
- Quelques beta users ont `subscription_expires_at` (beta_users) désynchronisé de `current_period_end` (user_subscriptions) parce que leur abonnement a été reconduit/réinitialisé après validation.

Tant que le seul code actif reste `LESAMISDECALMI`, **tous les nouveaux beta testeurs auront Calmix 3 mois**.

---

## 2. Anthony — bug "Quota vidéo atteint"

### Diagnostic confirmé (root cause)

État réel d'Anthony en base :
- Tier **calmix**, statut `active`, période 17 mai → 17 août 2026
- `video_intros_used_this_period` = **0 / 3**

Il devrait donc pouvoir générer une vidéo. Le message d'erreur est **un faux positif**.

**Cause exacte** : la fonction SQL `check_user_quota(p_user_id, p_quota_type)` ne gère **PAS** le type `video_intro`. Son `CASE` n'a que `stories`, `audio`, `children`, puis tombe dans le `ELSE` :

```sql
ELSE
  RETURN json_build_object('allowed', false, 'reason', 'Type de quota inconnu');
```

Côté client (`useQuotaChecker.ts`), `validateAction('show_video_intro')` mappe vers `quotaType = 'video_intro'` et appelle ce RPC. Résultat : `allowed = false` systématiquement → toast "Quota vidéo atteint" pour **tous les utilisateurs**, peu importe leur plan ou leur consommation.

C'est invoqué dans :
- `src/components/story/title/TitleBasedStoryCreator.tsx` (ligne 245)
- `src/components/story/fast/FastStoryCreator.tsx` (ligne ~75)

### Plan de correctif

**Migration SQL** — ajouter le case `video_intro` dans `check_user_quota`, avec :
- Bypass admin (déjà géré en début de fonction)
- Lecture de `user_subscriptions.video_intros_used_this_period`
- Comparaison à `subscription_limits.max_video_intros_per_period`
- Retour JSON cohérent avec les autres cas (`allowed`, `used`, `limit`, `tier`)

Logique ajoutée :
```sql
WHEN 'video_intro' THEN
  RETURN json_build_object(
    'allowed', COALESCE(user_sub.video_intros_used_this_period, 0) < COALESCE(limits.max_video_intros_per_period, 0),
    'used',    COALESCE(user_sub.video_intros_used_this_period, 0),
    'limit',   COALESCE(limits.max_video_intros_per_period, 0),
    'tier',    user_sub.tier
  );
```

**Aucune modification de code frontend** nécessaire : `useQuotaChecker` et les composants appelants sont déjà corrects, seule la fonction SQL est défectueuse.

### Vérification post-fix

1. Re-tester en simulant Anthony : `select check_user_quota('<anthony_id>', 'video_intro')` doit renvoyer `allowed: true, used: 0, limit: 3, tier: calmix`.
2. Vérifier qu'un user `calmini`/`calmidium` (limit 0) reçoit `allowed: false` (comportement attendu : ces tiers n'ont pas accès vidéo).
3. Confirmer côté UI : Anthony ne voit plus le toast et la vidéo se génère.

### Effets de bord

Aucun. La fonction n'est pas appelée ailleurs avec `video_intro` sans déjà attendre ce comportement. Les autres branches du `CASE` restent intactes.
