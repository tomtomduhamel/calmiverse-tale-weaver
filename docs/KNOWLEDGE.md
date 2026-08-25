
# Base de Connaissances Technique Complète - Calmiverse

## 1. Vue d'ensemble du projet
Calmiverse est une Progressive Web App (PWA) de génération d'histoires personnalisées pour enfants utilisant l'intelligence artificielle. L'application permet aux parents de créer des profils détaillés pour leurs enfants, puis de générer des histoires adaptées avec objectifs pédagogiques, génération audio (ElevenLabs), et système d'abonnements premium.

## 2. Personas utilisateurs
- **Parents modernes (30-45 ans)** : Cherchent des contenus éducatifs et personnalisés pour leurs enfants.
- **Grands-parents connectés** : Souhaitent offrir des histoires personnalisées à leurs petits-enfants.
- **Enseignants/éducateurs** : Utilisent l'application pour créer du contenu adapté à leurs groupes d'élèves.
- **Parents d'enfants avec besoins spécifiques** : Recherchent des histoires qui abordent des situations particulières (anxiété, peurs, etc.).

## 3. Spécifications des fonctionnalités

### Gestion des profils enfants
- Création et modification avec nom, date de naissance, genre, centres d'intérêt
- Description du doudou avec photos (stockage Supabase Storage)
- Monde imaginaire personnalisé
- Limitation selon tier d'abonnement (2 à illimité)

### Génération d'histoires
- IA Lovable AI (GPT-4o-mini) & n8n pour contenu adapté enfants
- 4 objectifs pédagogiques : Sommeil, Concentration, Détente, Amusement
- **Durées calibrées** : 3 min (Express, ~250-350 mots), 5 min (Courte, ~600 mots), 10 min (Moyenne, ~1200 mots), 15 min (Longue, ~1800 mots)
- **Formule de calibration unifiée** : $\text{Mots} = \text{Durée (min)} \times \text{Vitesse utilisateur (mots/min)}$ (chargée depuis `users.reading_speed`) avec encadrement strict min/max au LLM
- **Calibrage syntaxique selon l'âge** :
  - **0-3 ans (Tout-petits)** : 5 à 8 mots par phrase max, structure directe Sujet+Verbe+Complément, zéro proposition subordonnée complexe, paragraphes courts de 2 phrases max.
  - **4-6 ans (Maternelle)** : 8 à 12 mots par phrase max, verbes d'action concrets, dialogues simples et vifs.
  - **7-9 ans (Primaire)** : 10 à 15 mots par phrase, 2-3 mots de vocabulaire contextualisés, esprit de déduction.
  - **10-12 ans & 13+** : Intrigues rythmées, dialogues spontanés, autodérision et maturité.
- Génération titre + résumé automatique
- Système de séries avec tomes numérotés
- Déduplication automatique (évite doublons et redondances de décors/acolytes)
- Quotas mensuels selon abonnement
- **Mode chatbot interactif** : Création guidée via conversation n8n avec boutons de choix

### Studio Vocal Familial & Clonage de Voix 🎙️
- Route `/app/voices` accessible à tous les abonnés ayant des quotas de clonage (`max_voice_clones > 0` : Calmidium, Calmix, Calmixxl)
- Enregistrement direct in-app ou invitation à distance pour les proches (Maman, Papa, Grands-parents)
- Découpage multi-voix et attribution intelligente des personnages (narrateur, maman, papa, animaux, créatures)

### Bibliothèque d'histoires
- Filtrage avancé : enfants, objectifs, favoris, statuts
- Recherche textuelle dans titres et contenu
- Swipe-to-delete sur mobile avec détection direction intelligente
- Pagination (configurable dans APP_CONFIG)
- Export EPUB et envoi Kindle

### Lecteur d'histoires (StoryReader + ReaderControls)
- **Interface immersive** avec mode plein écran
- **Audio ElevenLabs** intégré avec contrôles (génération via N8nAudioPlayer)
- **Musique de fond** par objectif (optionnel, désactivable)
- **Temps de lecture dynamique** : calculé avec la vitesse personnalisée du parent (`ReadingSpeedContext`)
- **Auto-scroll intelligent** avec détection vitesse de lecture (120 mots/min par défaut)
- **Thème adaptatif** sombre/clair avec préférences utilisateur persistantes
- **Taille de police ajustable** (3 niveaux : petit, moyen, grand)
- **Support Markdown** avec ReactMarkdown pour mise en forme enrichie
- **Bandeau rétractable optimisé** (ReaderControls) :
  - Layout horizontal centré sur desktop (une seule ligne)
  - Séparateurs visuels entre sections pour meilleure lisibilité
  - Compact et équilibré visuellement
  - Responsive mobile avec grille adaptative
  - Boutons avec tailles optimisées (sm/default selon contexte)
  - ReadingSpeedSelector avec 4 presets (lent, normal, rapide, très rapide)
- **Diagnostic technique** intégré pour debug (TechnicalDiagnosticButton)

### Partage et Export
- Partage via lien sécurisé avec token
- Export EPUB pour Kindle
- Envoi direct par email (webhook n8n)
- Contrôle d'accès granulaire

### Système d'abonnements
- 4 tiers : Calmini, Calmidium, Calmix, Calmixxl
- Trial automatique 1 mois pour nouveaux utilisateurs
- Quotas mensuels : histoires, audios, enfants, clonages de voix (`max_voice_clones`)
- Features premium : séries, communauté, musique, priorité, studio vocal, multi-voix
- Remise annuelle 20%
- Guards React : SubscriptionGuard, useQuotaChecker, useFeatureAccess

### Paramètres utilisateur
- Gestion compte et sécurité
- Accès Studio Vocal Familial 🎙️ (carte avec redirection)
- Préférences lecture (vitesse de lecture personnalisée `reading_speed`, auto-scroll)
- Notifications granulaires (email, in-app, système)
- Thème apparence (clair/sombre)
- Musique de fond activable
- Email Kindle pour envoi

## 4. Stack technique et Architecture

### Frontend Core
- **React** 18.3.1 avec Hooks avancés et Context API
- **TypeScript** 5.5.3 pour type safety
- **Vite** 5.0.12 comme bundler avec optimisations PWA
- **React Router DOM** 6.26.2 pour navigation SPA
- **TanStack React Query** 5.56.2 pour data fetching et cache
- **React Hook Form** 7.53.0 + Zod 3.23.8 pour formulaires

### UI/UX Stack
- **Design System** : shadcn/ui avec Radix UI primitives
- **Styling** : Tailwind CSS 3.4.11 avec tokens sémantiques (index.css)
- **Thème** : next-themes 0.3.0 (dark/light/system)
- **Icons** : Lucide React 0.462.0
- **Toast** : Sonner 1.5.0
- **Animations** : tailwindcss-animate + CSS custom

### Backend & Services
- **BaaS** : Supabase (Auth, Database PostgreSQL, Storage, Edge Functions, Realtime)
- **AI** : Lovable AI (GPT-4o-mini) via gateway
- **TTS** : ElevenLabs Text-to-Speech + @11labs/react
- **Automation** : n8n webhooks pour workflows audio
- **Storage** : 6 buckets Supabase (audio, EPUB, images, teddy photos, sounds)

### PWA & Performance
- **PWA** : vite-plugin-pwa 1.0.3 avec Workbox
- **Service Worker** : Cache stratégique par ressource
- **Offline** : Support offline avec fallback pages
- **Gestures** : PWAGestures custom pour swipe/scroll mobile
- **Bundle** : Code splitting vendor (React, Supabase, OpenAI)

### Sécurité
- **RLS** : Row Level Security sur toutes tables
- **Rate Limiting** : Système avancé par user/IP/endpoint
- **Audit** : security_audit_logs pour actions sensibles
- **Validation** : Zod schemas côté client et serveur
- **Secrets** : Stockage sécurisé Supabase (8 secrets)

## 5. API et Intégrations

### Lovable AI Gateway
- **Endpoint** : Gateway Lovable AI pour modèles OpenAI
- **Modèle** : gpt-4o-mini (coût-efficace, optimisé enfants)
- **Opérations** : generateStoryText, generateSummary, generateTitle
- **Fichiers** : `/supabase/functions/_shared/ai-operations.ts`
- **Config** : temperature: 0.7, max_tokens: 3500

### Supabase Edge Functions (13 fonctions)
**Génération histoires :**
- `generateStory` - Création histoire complète
- `regenerateStory` - Régénération avec settings custom
- `retry-story` - Relance génération échouée
- `create-story-sequel` - Suite histoire série

**Audio/TTS :**
- `tts-elevenlabs` - Génération audio ElevenLabs
- `get-tts-config` - Configuration dynamique provider TTS (ElevenLabs/Speechify)
- `n8n-audio-callback` - Callback audio n8n
- `upload-audio-from-n8n` - Upload audio depuis n8n

**Admin & Interface TTS :**
- Interface admin `/admin/tts-config` - Gestion provider TTS et métriques
- Hook `useTtsConfig` - Récupération config et métriques TTS
- Composants `TtsConfigPanel` et `TtsMetrics` - Dashboard admin TTS

**Utilitaires :**
- `connectivity-test` - Test connectivité
- `testConnection` - Diagnostic connexion
- `delete-user` - Suppression compte
- `upload-epub` - Export EPUB histoires

### Système TTS Multi-Provider (ElevenLabs / Speechify)
- **Providers supportés** : ElevenLabs (défaut) et Speechify
- **Switch dynamique** : Via secret Supabase `TTS_PROVIDER` ('elevenlabs' ou 'speechify')
- **Edge Function** : `get-tts-config` retourne configuration active (webhookUrl, provider, voiceId)
- **Voice ID** : '9BWtsMINqrJLrRacOk9x' (défaut ElevenLabs)
- **React Hook** : @11labs/react pour conversations AI
- **Workflow** : Génération asynchrone via n8n webhooks (URL dynamique selon provider)
- **Stockage** : Bucket Supabase `audio-files`
- **Hook frontend** : `useN8nAudioGeneration` avec appel automatique `get-tts-config`

#### Configuration Provider
1. **Secret `TTS_PROVIDER`** : Définir 'elevenlabs' ou 'speechify' dans Supabase Dashboard
2. **Secret `N8N_ELEVENLABS_WEBHOOK_URL`** : URL webhook n8n pour ElevenLabs
3. **Secret `N8N_SPEECHIFY_WEBHOOK_URL`** : URL webhook n8n pour Speechify
4. **Sélection automatique** : L'Edge Function `get-tts-config` lit `TTS_PROVIDER` et retourne la bonne config
5. **Fallback** : Si `TTS_PROVIDER` non défini, utilise ElevenLabs par défaut

### Chatbot Interactif n8n (Création Guidée)
- **Webhook** : `https://n8n.srv856374.hstgr.cloud/webhook/[id]`
- **Hook** : `useN8nChatbotStory` - Gestion conversation complète
- **Persistance** : `usePersistedChatbotState` - Session localStorage avec retry automatique
- **Types** : `ChatbotMessage`, `ChatbotResponse`, `ChatbotChoice`
- **Format réponse n8n** :
  ```json
  {
    "type": "message_with_choices",
    "content": "Question à l'utilisateur",
    "choiceType": "single" | "multiple",
    "choices": [
      { "id": "...", "label": "...", "value": "...", "icon": "Moon" }
    ]
  }
  ```
- **Composants** :
  - `ChatStoryCreator` : Interface principale chatbot
  - `ChatMessageBubble` : Affichage messages avec choix intégrés
  - `ChatChoiceButtons` : Boutons de sélection (single/multiple) avec icônes Lucide
- **Gestion erreurs** : AbortController silencieux avec retry automatique au retour page
- **Icônes supportées** : Moon, Brain, Heart, Sparkles, Star, Wand2, TreePine, Castle, Ship, Rocket, User

### Webhooks n8n
- **Email** : Partage histoires par email
- **Kindle** : Envoi EPUB vers Kindle
- **Audio** : Callbacks génération audio
- **Séries** : Création suites automatiques

## 6. Schéma de base de données PostgreSQL

### Tables Principales

**users** - Profils utilisateurs
- `id` (uuid, PK, ref auth.users)
- `email`, `firstname`, `lastname`
- `language` (default 'fr'), `timezone` (default 'Europe/Paris')
- `reading_speed` (integer, default 125 mots/min)
- `kindle_email`, notifications (email, inapp, story, system)
- `background_music_enabled`, `auto_scroll_enabled`

**children** - Profils enfants
- `id` (uuid, PK), `authorid` (FK users.id)
- `name`, `birthdate`, `gender` (boy/girl/pet)
- `interests` (text[]), `imaginaryworld` (text)
- `teddyname`, `teddydescription`, `teddyphotos` (jsonb)

**stories** - Histoires générées
- `id` (uuid, PK), `authorid` (FK users.id)
- `title`, `content` (6000-10000 mots), `summary`, `preview`
- `status` (pending/completed/read/error)
- `childrenids` (text[]), `childrennames` (text[])
- `objective` (sleep/focus/relax/fun)
- `series_id` (FK story_series), `tome_number`
- `sound_id` (FK sound_backgrounds)
- `image_path`, `story_analysis` (jsonb)
- `is_favorite`, `deduplication_key`
- `sharing` (jsonb), `error` (text)

**user_subscriptions** - Abonnements
- `id` (uuid, PK), `user_id` (FK users.id)
- `tier` (ENUM: calmini/calmidium/calmix/calmixxl)
- `status` (active/trial/expired/cancelled)
- `current_period_start/end` (timestamps)
- `stories_used_this_period`, `audio_generations_used_this_period`
- `is_annual`, `stripe_subscription_id`

**subscription_limits** - Limites par tier
- `tier` (PK), `stories_per_month`, `audio_generations_per_month`
- `max_children` (NULL = illimité)
- `has_story_series`, `has_background_music`, `has_priority_access`, `has_community_access`
- `monthly_price_usd`, `annual_price_usd`

**audio_files** - Audio ElevenLabs
- `id` (uuid, PK), `story_id` (FK stories.id)
- `text_content`, `audio_url`, `status`
- `voice_id`, `webhook_id`, `file_size`, `duration`

**story_series** - Séries histoires
- `id` (uuid, PK), `author_id`, `title`, `description`
- `total_tomes`, `is_active`, `image_path`

### Tables Sécurité & Admin

**user_roles** - Rôles (admin/moderator/user)
**security_audit_logs** - Logs sécurité complets
**rate_limits** - Limitation de débit avancée
**user_sessions** - Gestion sessions
**story_access_logs** - Logs accès histoires
**prompt_templates** + **prompt_template_versions** - Gestion prompts IA
**sound_backgrounds** - Musiques de fond par objectif

### Fonctions PostgreSQL Clés
- `check_user_quota(user_id, quota_type)` - Vérification quotas
- `increment_usage(user_id, usage_type)` - Incrémentation usage
- `has_feature_access(user_id, feature)` - Contrôle accès features
- `reset_monthly_quotas()` - Reset automatique quotas
- `check_story_duplicate()` - Prévention doublons
- `get_stories_count_by_children()` - Statistiques enfants

## 7. Routes & Navigation

### Architecture Navigation
- **Système centralisé** : `useAppNavigation` hook (UNIQUE source)
- **Router** : React Router DOM 6 avec Shell pattern
- **Source de vérité** : `location.pathname` (pas d'état local)
- **Documentation** : `/docs/NAVIGATION_RULES.md`

### Routes Publiques
- `/auth` - Authentification (login/signup)
- `/privacy`, `/terms`, `/cookies` - Pages légales
- `/contact`, `/documentation`, `/status` - Support
- `/shared/:token` - Partage histoires public
- `/story/:id` - Lecture publique
- `/404` - Page not found
- `/recovery.html`, `/offline.html` - PWA fallback

### Routes Authentifiées (Shell Layout)
- `/` - Accueil (Index) - Création rapide
- `/children` - Gestion profils enfants
- `/kids-profile` - Édition profil enfant
- `/library` - Bibliothèque avec filtres avancés
- `/reader/:id` - Lecteur immersif
- `/create-story/step-1,2,3` - Création guidée 3 étapes
- `/pricing` - Page tarification
- `/subscription` - Gestion abonnement
- `/settings` - Paramètres utilisateur (avec ThemeSection)
- `/admin/prompts` - Administration prompts (AdminGuard)

### Navigation Adaptive
- **Desktop** : Navigation top + menu latéral
- **Mobile** : Menu bottom 4 icônes + PWAGestures
- **Reader Mode** : Plein écran sans navigation
- **Components** : `<Navigation>` (desktop), `<MobileMenu>` (mobile)

## 8. Configuration de l'environnement

### Prérequis
- Node.js 20+, npm 9+
- Compte Supabase (BaaS)
- Clé Lovable AI
- Clé ElevenLabs (TTS)

### Variables d'environnement
```bash
# Supabase
VITE_SUPABASE_URL=https://[projet].supabase.co
VITE_SUPABASE_ANON_KEY=[clé publique]

# Webhooks (optionnel)
VITE_EMAIL_WEBHOOK_URL=[n8n webhook email]
VITE_KINDLE_WEBHOOK_URL=[n8n webhook kindle]
```

### Secrets Supabase (11 secrets)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` - Clé Lovable AI
- `ELEVENLABS_API_KEY` - Text-to-Speech ElevenLabs
- `N8N_SEQUEL_WEBHOOK_URL` - Webhooks n8n séries
- `TTS_PROVIDER` - Provider TTS actif ('elevenlabs' ou 'speechify')
- `N8N_ELEVENLABS_WEBHOOK_URL` - Webhook n8n ElevenLabs
- `N8N_SPEECHIFY_WEBHOOK_URL` - Webhook n8n Speechify
- `OPENAI_API_KEY` - Legacy (non utilisé, garder pour compatibilité)

### Développement local
```bash
npm install
npm run dev  # Port 8080
```

### Structure du projet
```
src/
├── components/
│   ├── auth/          # AuthGuard, SupabaseAuthProvider
│   ├── library/       # MobileStoryCard (swipe-to-delete)
│   ├── navigation/    # Navigation desktop/mobile
│   ├── settings/      # ThemeSection, ReadingPreferences
│   ├── story/         # StoryContent, StoryReader, ReaderControls
│   │   ├── chat/      # ChatStoryCreator, ChatMessageBubble, ChatChoiceButtons
│   │   └── reader/    # N8nAudioPlayer, ReadingSpeedSelector, TechnicalDiagnosticButton
│   └── ui/            # shadcn components
├── hooks/
│   ├── n8n/           # useN8nChatbotStory, usePersistedChatbotState
│   ├── navigation/    # useAppNavigation (CENTRAL)
│   ├── settings/      # useUserSettings
│   ├── story/         # useAutoScroll, useStoryReader
│   └── subscription/  # useSubscription, useQuotaChecker
├── contexts/          # SupabaseAuthContext, AppThemeContext, ReadingSpeedContext
├── pages/             # Routes principales
├── types/             # chatbot.ts, child.ts, etc.
├── integrations/      # Supabase types auto-générés
└── utils/             # Helpers, config, constants

supabase/
├── functions/         # 13 Edge Functions Deno
│   └── _shared/       # ai-operations, clients, database-ops
└── migrations/        # Migrations SQL (RLS, triggers, functions)

docs/
├── KNOWLEDGE.md                 # Ce fichier
├── ARCHITECTURE_AUTH_FIX.md     # Fix auth centralisé
├── STORY_CREATION_FIX.md        # Fix performance création
├── NAVIGATION_RULES.md          # Règles navigation SPA
└── PWA_ACTIVATION.md            # Guide activation PWA
```

## 9. Fonctionnalités Avancées

### PWA (Progressive Web App)
- **Status actuel** : Désactivée en dev (`vite.config.ts` ligne 22)
- **Activation** : Changer `false` en `true` avant prod
- **Features** : Installation écran accueil, mode offline, notifications push
- **Service Worker** : Cache stratégique (Supabase NetworkFirst, Fonts StaleWhileRevalidate, Images CacheFirst)
- **Gestures** : `PWAGestures.tsx` pour swipe/scroll mobile
- **Documentation** : `/docs/PWA_ACTIVATION.md`

### Swipe-to-Delete Mobile
- **Component** : `MobileStoryCard.tsx`
- **Logique** : Détection direction intelligente (vertical = scroll, horizontal = swipe)
- **États** : `detectedDirection` ref ('none'|'vertical'|'horizontal')
- **Seuils** : 10px détection, 40px validation, 80px max swipe
- **Attribution** : `data-swipe-card` pour éviter conflit PWAGestures

### Thème Sombre/Clair
- **Hook** : `useAppTheme()` wrapper next-themes
- **Modes** : light, dark, system
- **Components** : `ThemeToggle`, `SimpleThemeToggle`, `ThemeSection`
- **Persistance** : localStorage automatique
- **Localisation** : Settings page + Reader
- **Design System** : Tokens sémantiques dans `index.css`

### Système de Quotas
- **Hook** : `useQuotaChecker()` temps réel
- **Guards** : `SubscriptionGuard` pour routes premium
- **Fonction** : `check_user_quota(user_id, quota_type)` PostgreSQL
- **Reset** : Automatique à date anniversaire abonnement
- **Upgrade** : Proposé dynamiquement si limite atteinte

### Système de Vitesse de Lecture (ReadingSpeedContext)
- **Context global** : `ReadingSpeedContext` partagé dans toute l'application
- **Hook** : `useReadingSpeed()` pour accès et modification vitesse
- **Persistance** : Sauvegarde automatique en BDD (table `users.reading_speed`)
- **Synchronisation** : Mise à jour immédiate état local + BDD silencieuse
- **Valeur par défaut** : 125 mots/minute
- **Presets disponibles** : Lent (100), Normal (125), Rapide (175), Très rapide (250)
- **Utilisation** : Auto-scroll, estimations temps lecture, ReadingSpeedSelector
- **Provider** : Wrappé dans `<ReadingSpeedProvider>` au niveau racine

### Génération Audio Multi-Provider (ElevenLabs / Speechify)
- **Providers** : ElevenLabs (défaut) et Speechify
- **Switch** : Via secret `TTS_PROVIDER` dans Supabase Dashboard
- **Voice** : ID '9BWtsMINqrJLrRacOk9x' (ElevenLabs par défaut)
- **Workflow** : Asynchrone via n8n webhooks (URL dynamique selon provider)
- **Edge Function** : `get-tts-config` retourne configuration active
- **Status** : pending → completed/error
- **Stockage** : Bucket Supabase `audio-files`
- **Player / Pupitre Audio (`IntegratedAudioDeck.tsx`)** : Implémente une architecture responsive Mobile-First (`max-h-[85vh]`, `flex flex-col` avec zone de contenu `overflow-y-auto` et panneau de contrôle fixe en bas) pour garantir zéro troncature de boutons sur tous types d'écrans (mobile et desktop).
- **Hook** : `useN8nAudioGeneration` appelle automatiquement `get-tts-config`
- **Métriques** : Temps de génération, taille fichier, taux de succès automatiquement trackés
- **Interface Admin** : `/admin/tts-config` pour visualiser config et dashboard métriques

### Export & Partage
- **EPUB** : Génération Edge Function `upload-epub`
- **Kindle** : Envoi via webhook n8n
- **Partage** : Token sécurisé route `/shared/:token`
- **Email** : Webhook n8n avec template HTML

## 10. Sécurité & Conformité

### Row Level Security (RLS)
- **Status** : Activé sur TOUTES les tables
- **Politique** : Isolation stricte par utilisateur
- **Fonctions** : SECURITY DEFINER avec search_path sécurisé
- **Admin** : Contournement RLS avec SERVICE_ROLE_KEY

### Rate Limiting
- **Table** : `rate_limits` avec tracking user/IP/endpoint
- **Fonction** : `check_enhanced_rate_limit()` PostgreSQL
- **Seuils** : Configurables par endpoint et action
- **Blocage** : Temporaire avec `blocked_until` timestamp

### Audit & Logs
- **Table** : `security_audit_logs` pour actions sensibles
- **Contenu** : action, user_id, ip_address, metadata, result
- **Fonction** : `log_security_event()` PostgreSQL
- **Monitoring** : Supabase Analytics + logs

### Conformité
- **RGPD** : Gestion données personnelles enfants
- **COPPA** : Conformité protection enfants US
- **WCAG 2.1** : Accessibilité interface
- **Filtres IA** : Contenu approprié enfants

### Validation
- **Client** : Zod schemas pour formulaires
- **Serveur** : Validation Edge Functions
- **Types** : TypeScript strict mode
- **Sanitization** : Protection XSS/injection

## 11. Performance & Optimisation

### Bundle Optimization
- **Code Splitting** : Chunks vendor séparés (React, Supabase, OpenAI)
- **Lazy Loading** : Routes et composants lourds
- **Tree Shaking** : Import sélectif librairies
- **Size Warning** : 1000KB threshold rollup

### Data Fetching
- **TanStack Query** : Cache automatique avec staleTime
- **Optimistic Updates** : UI instantané avec rollback
- **Pagination** : Configurable via `APP_CONFIG.pagination`
- **Prefetching** : Données anticipées pour routes suivantes

### Caching Strategy
- **localStorage** : Cache 5min pour children (Story Creation Fix)
- **React Query** : Cache mémoire avec invalidation
- **Service Worker / PWA Cache** : Cache `CacheFirst` (30 jours) pour les images WebP (80 Ko) et médias audio/vidéo (`useStoryMediaPreloader`)
- **CDN Supabase Storage** : Rendu dynamique avec transformation `/render/image/public/`

### Optimisation du Stockage Supabase (Juillet 2026)
- **Gain global** : Empreinte de stockage réduite de **1,03 Go à 174 Mo (-83% d'espace disque total)**.
- **Images (`storyimages`)** : 292 images compressées en WebP (qualité 80%, max 1280px). Taille totale réduite de **710 Mo à 33 Mo** (-95,3%).
- **Vidéos (`storyvideos`)** : 30 vidéos d'intro re-compressées en H.264/AAC 720p. Taille réduite de **79 Mo à 13 Mo** (-83,5%).
- **Sons d'ambiance (`story_sounds`)** : 7 sons d'ambiance ré-encodés en MP3 96 kbps. Taille réduite de **108 Mo à 40 Mo** (-63,0%).
- **EPUB temporaires (`epub-files`)** : Purge automatique des anciens fichiers EPUB (> 30 jours). Bucket réduit de **39 Mo à 0 Mo**.
- **Purge BDD Postgres** : 8 471 lignes de logs d'audit et tokens expirés supprimés.
- **Automatisation cron (`pg_cron`)** :
  - `monthly_storage_orphan_cleanup` : Purge mensuelle des fichiers orphelins (le 1er du mois à 03h00 UTC).
  - `monthly_auth_logs_cleanup` : Purge mensuelle des logs d'audit (+30 jours) (le 1er du mois à 03h30 UTC).
  - `monthly_epub_files_cleanup` : Purge mensuelle des fichiers EPUB temporaires (+30 jours) (le 1er du mois à 03h45 UTC).

### Monitoring
- **Logs structurés** : `logger.debug()` avec métadonnées
- **Supabase Analytics** : Auth, DB, Edge Functions, Storage
- **Error Boundary** : Capture erreurs React
- **Audit Logs** : Actions sensibles trackées

## 12. Déploiement & CI/CD

### Environnements
- **Développement** : Local avec hot reload
- **Staging** : Lovable hosting avec Supabase dev
- **Production** : [calmi-99482.web.app](https://calmi-99482.web.app) + Supabase prod

### Déploiement Frontend
- **Platform** : Lovable hosting + Firebase legacy
- **Build** : `npm run build` → optimisé + PWA
- **Deploy** : Automatique via GitHub Actions sur `main`
- **Update** : Cliquer "Update" dans publish dialog

### Déploiement Backend
- **Edge Functions** : Déploiement immédiat et automatique
- **Migrations** : `supabase db push` ou via Supabase Dashboard
- **Secrets** : Gérés via Supabase Dashboard
- **Rollback** : Restauration versions précédentes Supabase

### Checks pré-déploiement
- [ ] Tests Vitest passés
- [ ] Build production réussi
- [ ] RLS policies validées
- [ ] Rate limits configurés
- [ ] Secrets Supabase à jour
- [ ] Edge Functions déployées
- [ ] PWA activée (si prod finale)
- [ ] Lighthouse score > 90

## 13. Troubleshooting & Debug

### Outils disponibles
- **Console logs** : Logs structurés avec préfixes
- **Network requests** : TanStack Query DevTools
- **Supabase logs** : Auth, DB, Edge Functions
- **React DevTools** : State et props inspection
- **Lighthouse** : Performance et PWA audit

### Problèmes fréquents

**Authentification bloquée**
- Vérifier `AuthGuard` centralisé (timeout 5s)
- Nettoyer Service Worker si nécessaire
- Flag `calmi-sw-cleaned-v2` localStorage

**Navigation ne fonctionne pas**
- Utiliser UNIQUEMENT `useAppNavigation`
- Jamais `window.location.href` en SPA
- Source de vérité : `location.pathname`

**Quotas non mis à jour**
- Fonction `reset_monthly_quotas()` PostgreSQL
- Vérifier `current_period_end` dans `user_subscriptions`
- Forcer reset manuel si nécessaire

**Swipe-to-delete conflit scroll**
- Vérifier attribut `data-swipe-card` sur carte
- PWAGestures ignore les cartes swipables
- Direction détectée via `detectedDirection` ref

**Audio ne se génère pas**
- Vérifier quota ElevenLabs restant
- Logs n8n webhook callback
- Status `audio_files` table (pending/completed/error)

**Thème ne persiste pas**
- `useAppTheme()` gère localStorage automatiquement
- Vérifier `mounted` avant render
- `next-themes` provider dans `main.tsx`

## 13. Standards Narratifs & Règles de Génération des Histoires

### Modèle en 2 Temps (Dissociation Hypnose / Objectif)
1. **Temps 1 : Induction & Focalisation (30-45s)** :
   - Rupture de pattern et absorption sensorielle (VAKOG adapté à l'objectif).
   - Ancrage et reconnexion au moment présent.
## 13. Standards Narratifs & Règles de Génération des Histoires (v3.4)

### 1. Modèle en 2 Temps (Dissociation Hypnose / Objectif)
1. **Temps 1 : Focalisation Sensorielle (30-45s)** : Accroche immédiate par un détail sensoriel curieux ou une rupture d'attente pour couper court aux ruminations et ancrer dans le présent.
2. **Temps 2 : Déploiement à 100% de l'Objectif** :
   - **S'amuser (`fun`)** : Énergie haute, péripéties comiques, quiproquos, bêtises innocentes, dialogues vifs. **Interdiction formelle de ton soporifique, de lenteur monotone ou de métaphores contemplatives**.
   - **Se concentrer (`focus`)** : Énigmes, mystères stimulants, détails d'observation concrets.
   - **Se détendre (`relax`)** : Sérénité et moments doux sans obligation de sommeil.
   - **S'endormir (`sleep`)** : Seul objectif avec décélération progressive vers le sommeil.
   - **Émotions & Situations (Jour)** : Dénouement sur un **élan d'action, de courage ou de fierté**, prêt à retourner agir dans le monde réel.

### 2. Trame Narrative de Cause à Effet Continue (Consistance & Captation)
- **Mini-enjeu / Défi dès la 1ère minute** : Problème concret à résoudre (ex: compte à rebours, objet égaré à rattraper, défi d'équipe).
- **Règle du « Et donc... / Mais alors... »** : Chaque action découle logiquement de la précédente. Pas de déambulation descriptive passive.
- **Enfants Moteurs & Décideurs (Empowerment)** : Ce sont les enfants qui prennent les décisions, ont les bonnes idées et résolvent l'énigme.

### 3. Règle « Zéro Métaphore Superflue » (Action First)
- **Plafond strict** : Maximum 1 à 2 comparaisons physiques simples dans toute l'histoire.
- **Interdiction formelle des comparaisons poétiques lentes** (*« comme du miel »*, *« comme une onde »*, *« comme une offrande »*, *« comme un pli dans le ciel »*). Privilégier les verbes d'action directs (courir, sauter, attraper, glisser, rire).

### 4. Calibrage Strict du Vocabulaire & Liste Noire
- **Liste noire proscrite (< 10 ans)** : *irisé, nacre, nacré, diaphane, béatitude, onde, offrande, cérémonieux, murmure machinal, alcôve, zéphyr, lueur feutrée, contemplation, indicible*.
- **0-3 ans** : Phrases très courtes (Sujet-Verbe-Complément), mots familiers du quotidien direct (doudou, chat, pomme, bain, dodo).
- **4-6 ans** : Vocabulaire simple, vivant, imagé et chaleureux. Verbes d'action concrets.
- **7-10 ans** : Vocabulaire scolaire fluide. 2 à 3 mots enrichissants contextualisés max par histoire.
- **11+ ans** : Dialogues vivants, ironie bienveillante, esprit critique sans infantilisation.

### 5. Règle Stricte sur les Onomatopées
- **Plafond absolu de 3 onomatopées par histoire** (ex: *Hop !*, *Plouf !*, *Chut...*).

### 6. Interdiction des Tics Hypnotiques Passifs
- Dans toute histoire hors `sleep` (fun, focus, émotions de jour), proscrire les phrases d'induction de relaxation corporelle (*« en laissant leurs épaules s'abaisser »*, *« peut-être en inspirant »*, etc.).

---

## 14. Roadmap & Évolutions

### Implémenté ✅
- Système abonnements 4 tiers complet
- PWA avec cache avancé et détection de version directe (`/version.json?_t=...`) + forçage de rechargement
- Directives UX/UI Mobile Calme : Zéro troncature (`...`), affichage 2 lignes pour titres d'histoires, filtres défilants complets
- Zéro scroll superflu : 3 cartes accueil calibrées sur la hauteur d'écran, footer masqué sur mobile, barres de stats compactes 1 ligne
- Politique stricte zéro pop-up/toast : interactions silencieuses pour réglages, sélection de voix, ouvertures de livre, pull-to-refresh et self-healing
- Génération histoires IA optimisée
- Standards narratifs V3.4 (Modèle 2 temps, Cause à effet, Zéro métaphore superflue, Vocabulaire calibré, Max 3 onomatopées)
- Audio ElevenLabs asynchrone & Studio vocal familial (clonage de voix)
- Bibliothèque filtres + swipe-to-delete
- Profils enfants détaillés
- Sécurité RLS + rate limiting
- Export EPUB/Kindle
- Thème clair/sombre dans settings
- Navigation SPA centralisée
- **Lecteur d'histoires optimisé** avec bandeau rétractable équilibré visuellement
- **ReadingSpeedContext** global pour synchronisation vitesse lecture
- **Auto-scroll intelligent** avec gestion pause/reprise et restart automatique
- **Interface réactive** avec séparateurs visuels et spacing optimisé
- **Chatbot interactif n8n** avec boutons de choix dynamiques (single/multiple)
- **Gestion erreurs AbortController** silencieuse avec retry automatique

### En cours 🚧
- Tests E2E complets
- Monitoring Sentry production
- Load testing capacité
- Analytics dashboard admin

### À venir 🚀
- Community features (tiers premium)
- Story series avancées avec UI dédiée
- Background music integration complète
- Notifications push PWA
- Multilingue (i18n)
- A/B testing génération histoires

---

## 10. Directives UX/UI Mobile Calme & Politique des Toasts (Standard de Production)

### 10.1 Zéro Troncature (`...`)
- Les titres d'histoires utilisent `line-clamp-2 leading-snug font-display` pour ne pas couper le texte.
- Les puces de filtres horizontaux défilent librement avec `overflow-x-auto whitespace-nowrap scrollbar-none`.
- Les badges ne doivent pas comprimer les champs de saisie (positionnement au-dessus du champ sur la ligne de label).

### 10.2 Zéro Scroll Superflu
- Les 3 cartes du menu principal de l'accueil doivent tenir dans la hauteur de l'écran mobile sans forcer le scroll.
- Le `<Footer />` desktop de 300px est conditionné à `!isMobile`.
- Les métriques secondaires (séries, profils) sont regroupées en grilles 2 colonnes ou barres horizontales d'une seule ligne.
- Le bouton flottant de feedback est compact (`w-9 h-9` rond avec icône) pour ne jamais gêner la navigation.

### 10.3 Politique Zéro Pop-Up Intempestif
- **Calme & Sérénité** : Les interactions de routine doivent être silencieuses.
- **Interdictions** : Aucun toast lors du changement de voix/paramètres, lors de l'ouverture du lecteur, lors du rafraîchissement d'une page ou lors de la récupération automatique d'une histoire.
- **Autorisations** : Uniquement les erreurs réelles bloquantes pour l'utilisateur (connexion, quota, échec) et les confirmations d'actions destructives (suppression).

---

**Dernière mise à jour** : 2026-08-25  
**Version** : 3.5 (Refonte UX/UI Mobile Calme, Zéro Troncature, Politique Zéro Toast Intempestif & Détection PWA)  
**Statut** : Production ready


