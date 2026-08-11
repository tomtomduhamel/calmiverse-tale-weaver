# Guide de Déploiement & Configuration Meta Instagram Graph API — Calmi

Ce guide récapitule les composants déployés et les **4 étapes simples** à réaliser pour connecter votre compte Instagram professionnel à l'automatisation.

---

## 📦 Ce qui a été mis en place de manière autonome

| Composant | Statut | Emplacement / ID |
| :--- | :--- | :--- |
| **Table & Bucket Supabase** | ✅ Déployé | Table `marketing_publications` & Bucket `marketing-videos` |
| **Moteur Vidéo 9:16 (FFmpeg + Sharp)** | ✅ Testé & Validé | `scripts/generate_instagram_story_video.js` (vidéo 57s, 3.8 Mo) |
| **Client Meta Graph API** | ✅ Déployé | `scripts/instagram_api_client.js` (Gestion conteneur & publication) |
| **Orchestrateur Quotidien** | ✅ Testé & Validé | `scripts/publish_daily_story_marketing.js` |
| **Workflow n8n — Publications 6h / 12h / 19h** | ✅ Déployé sur votre n8n | Workflow ID: `Slm1jzF7eNalMA8i` |
| **Workflow n8n — Auto-DM Lead Magnet** | ✅ Déployé sur votre n8n | Workflow ID: `uJsfotVB4pBr3Bo6` |

---

## 🔑 Les 4 étapes pour connecter votre compte Instagram

Pour que Meta autorise n8n à publier automatiquement vos stories et répondre aux DM, suivez ces 4 étapes (durée : ~10 minutes) :

### Étape 1 : Passer le compte Instagram en Professionnel / Créateur
1. Ouvrez l'application **Instagram** sur votre smartphone avec le compte Calmi.
2. Allez dans **Profil** > **Paramètres et confidentialité** > **Type de compte et outils** > **Passer à un compte professionnel**.
3. Choisissez la catégorie (ex: *Application / Logiciel* ou *Éducation / Bien-être*).

---

### Étape 2 : Associer le compte Instagram à une Page Facebook
Meta exige qu'un compte Instagram Pro soit relié à une page Facebook :
1. Sur Facebook, créez une page simple nommée **"Calmi"** (ou utilisez une page existante).
2. Allez dans les **Paramètres de la Page Facebook** > **Comptes associés** > **Instagram**.
3. Cliquez sur **Connecter le compte** et connectez-vous avec vos identifiants Instagram Calmi.

---

### Étape 3 : Créer une Application sur Meta for Developers & Obtenir le Token
1. Rendez-vous sur le portail [developers.facebook.com](https://developers.facebook.com/) et connectez-vous avec votre compte Facebook.
2. Cliquez sur **Mes applications** > **Créer une application** :
   - Choisissez le type : **Autre** > **Entreprise** (Business).
   - Nommez-la : `Calmi Automation`.
3. Dans le tableau de bord de l'application, ajoutez les produits :
   - **Instagram Graph API**
4. Rendez-vous dans **Outils** > **Explorateur Graph API** ([Graph API Explorer](https://developers.facebook.com/tools/explorer/)) :
   - Dans le menu déroulant *Application*, sélectionnez votre application `Calmi Automation`.
   - Dans *Autorisations (Permissions)*, ajoutez les permissions suivantes :
     - `instagram_basic`
     - `instagram_content_publish`
     - `instagram_manage_messages`
     - `pages_show_list`
     - `pages_read_engagement`
   - Cliquez sur **Generate Access Token** et acceptez les autorisations.
5. Obtenez votre **Instagram Business Account ID** :
   - Dans l'explorateur Graph API, lancez la requête : `GET /me/accounts?fields=instagram_business_account,name`
   - Copiez l'identifiant numérique trouvé dans `instagram_business_account.id`.

> [!TIP]
> Pour convertir votre token temporaire en token longue durée (60 jours ou permanent via Utilisateur Système) :
> Rendez-vous dans l'outil [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) et cliquez sur **Extend Access Token**.

---

### Étape 4 : Renseigner les 2 variables dans n8n

Dans votre tableau de bord n8n ([n8n.srv856374.hstgr.cloud](https://n8n.srv856374.hstgr.cloud)) :
1. Allez dans **Settings** > **Variables** (ou dans les paramètres d'environnement de votre instance).
2. Ajoutez les 2 variables :
   - `INSTAGRAM_USER_ID` : *Votre identifiant Instagram Business Account ID (obtenu à l'étape 3)*
   - `INSTAGRAM_ACCESS_TOKEN` : *Votre token d'accès Meta Graph API*

Dès que ces 2 variables sont renseignées, activez le bouton **Active** sur les deux workflows n8n :
- `Calmi — Publications Automatiques Instagram (Stories & Reels)` (`Slm1jzF7eNalMA8i`)
- `Calmi — Auto-DM Lead Magnet Instagram (Chatbot)` (`uJsfotVB4pBr3Bo6`)

---

## 🎯 Résultat Attendu

Chaque jour, à **06h00**, **12h00** et **19h00** :
1. Une histoire 100% originale et inédite est créée par l'IA sans jamais toucher aux histoires des utilisateurs.
2. Une vidéo 9:16 haute qualité (1080x1920) est assemblée avec l'illustration, les 3 pages de lecture apaisante, l'écran de fin percutant et la boucle sonore d'ambiance Calmi.
3. La vidéo est publiée automatiquement en **Story Instagram** (et en **Reel** à 19h).
4. Tout utilisateur écrivant **"CALMI"** en message privé reçoit instantanément son invitation et son lien d'accès à l'application.
