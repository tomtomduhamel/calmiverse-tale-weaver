
# Calmiverse

Progressive Web App (PWA) de génération d'histoires personnalisées pour enfants avec intelligence artificielle.

## À propos du projet

Calmiverse est une plateforme complète qui permet aux parents de créer des histoires personnalisées pour leurs enfants en utilisant l'IA, avec système d'abonnements, génération audio, et bibliothèque avancée.

## URL du projet

**Production**: [https://calmi-99482.web.app](https://calmi-99482.web.app)

## Technologies utilisées

### Frontend
- React 18.3.1 + TypeScript 5.5.3
- Vite 5.0.12 avec PWA plugin
- shadcn-ui + Radix UI + Tailwind CSS 3.4.11
- TanStack React Query 5.56.2
- React Router DOM 6.26.2
- React Hook Form + Zod validation

### Backend & Services
- Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime)
- Lovable AI (GPT-4o-mini) pour génération histoires
- ElevenLabs Text-to-Speech pour audio
- n8n webhooks pour automation

### Features
- PWA avec Service Worker et mode offline
- Système d'abonnements 4 tiers
- Thème sombre/clair
- Swipe-to-delete mobile
- Export EPUB/Kindle

## Développement local

### Prérequis

- Node.js 20 ou supérieur
- npm 9 ou supérieur

### Installation

1. Clonez le dépôt:
```sh
git clone <YOUR_GIT_URL>
cd calmi
```

2. Installez les dépendances:
```sh
npm install
```

3. Configurez les variables d'environnement:
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez vos variables d'environnement:
   ```bash
   # Supabase
   VITE_SUPABASE_URL=https://[projet].supabase.co
   VITE_SUPABASE_ANON_KEY=votre_clé_publique
   
   # Webhooks (optionnel)
   VITE_EMAIL_WEBHOOK_URL=n8n_webhook_email
   VITE_KINDLE_WEBHOOK_URL=n8n_webhook_kindle
   ```
   
   - Configurez les secrets Supabase (via Dashboard):
     - `LOVABLE_API_KEY` - Clé Lovable AI
     - `ELEVENLABS_API_KEY` - Text-to-Speech
     - `SUPABASE_SERVICE_ROLE_KEY` - Clé service
     - `N8N_SEQUEL_WEBHOOK_URL` - Webhooks n8n

4. Lancez le serveur de développement:
```sh
npm run dev
```

## Déploiement

### Frontend
Le déploiement frontend est automatisé via Lovable hosting.
- Build: `npm run build`
- Deploy: Push vers `main` ou cliquer "Update" dans Lovable publish dialog
- Production: https://calmi-99482.web.app

### Backend (Edge Functions)
Les Edge Functions se déploient automatiquement et immédiatement:
```bash
supabase functions deploy [nom-fonction]
# ou déployer toutes:
supabase functions deploy
```

### PWA
⚠️ Actuellement désactivée en développement.
Pour activer avant production: changer `false` en `true` dans `vite.config.ts` ligne 22.
Voir `/docs/PWA_ACTIVATION.md` pour guide complet.

## Documentation

- **Base de connaissances complète**: `/docs/KNOWLEDGE.md`
- **Architecture authentification**: `/docs/ARCHITECTURE_AUTH_FIX.md`
- **Fix performance création**: `/docs/STORY_CREATION_FIX.md`
- **Règles navigation SPA**: `/docs/NAVIGATION_RULES.md`
- **Guide activation PWA**: `/docs/PWA_ACTIVATION.md`

## Structure du projet

```
src/
├── components/        # Composants React
│   ├── auth/         # AuthGuard centralisé
│   ├── library/      # MobileStoryCard avec swipe
│   ├── settings/     # ThemeSection, préférences
│   └── ui/           # shadcn components
├── hooks/            # Hooks personnalisés
│   ├── navigation/   # useAppNavigation (CENTRAL)
│   └── subscription/ # useQuotaChecker, useFeatureAccess
├── pages/            # Pages/routes principales
├── contexts/         # React contexts (Auth, Theme)
└── integrations/     # Supabase types auto-générés

supabase/
├── functions/        # 13 Edge Functions Deno
│   └── _shared/      # ai-operations, clients, db-ops
└── migrations/       # Migrations PostgreSQL

docs/                 # Documentation complète
```

## Fonctionnalités principales

✅ Génération histoires IA personnalisées (Lovable AI)  
✅ 4 tiers d'abonnement avec quotas  
✅ Audio ElevenLabs avec génération asynchrone  
✅ Bibliothèque avec filtres avancés  
✅ Swipe-to-delete sur mobile  
✅ Thème sombre/clair dans paramètres  
✅ Export EPUB et envoi Kindle  
✅ PWA avec mode offline (désactivée dev)  
✅ Sécurité RLS + rate limiting  
✅ Navigation SPA optimisée  

## License

Ce projet est sous licence [MIT](LICENSE).

