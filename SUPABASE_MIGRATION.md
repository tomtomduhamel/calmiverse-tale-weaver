
# Migration de Firebase vers Supabase

Ce document explique la migration progressive de notre application de Firebase vers Supabase.

## Étapes réalisées

1. Installation des dépendances Supabase
2. Configuration du client Supabase
3. Création du contexte d'authentification Supabase
4. Création des hooks pour gérer les enfants avec Supabase
5. Création des hooks pour gérer les histoires avec Supabase

## Étapes à venir

1. Migrer les données existantes de Firebase vers Supabase
2. Créer des fonctions edge Supabase pour remplacer les Firebase Functions
3. Migrer le stockage de fichiers
4. Mettre à jour les composants UI pour utiliser les nouveaux hooks

## Structure de la base de données Supabase

Pour que cette migration fonctionne, vous devez créer les tables suivantes dans Supabase:

### Table `users`
- id (uuid, primary key)
- email (text)
- firstName (text)
- lastName (text) 
- created_at (timestamp with time zone)

### Table `children`
- id (uuid, primary key)
- name (text)
- birthDate (timestamp with time zone)
- authorId (uuid, foreign key to users.id)
- interests (text array)
- gender (text)
- createdAt (timestamp with time zone)

### Table `stories`
- id (uuid, primary key)
- title (text)
- content (text)
- summary (text)
- preview (text)
- status (text, enum: 'pending', 'completed', 'read', 'error')
- childrenIds (text array)
- childrenNames (text array)
- objective (text)
- authorId (uuid, foreign key to users.id)
- createdAt (timestamp with time zone)
- updatedAt (timestamp with time zone)
- error (text, nullable)

## Configuration des Edge Functions Supabase

Vous devrez créer deux fonctions edge dans Supabase:

1. `generateStory` - Pour générer une nouvelle histoire
2. `retryStory` - Pour réessayer une histoire échouée

## Migration des données

Pour migrer les données existantes de Firebase vers Supabase, nous vous recommandons d'utiliser un script personnalisé qui:

1. Lit les données depuis Firebase Firestore
2. Transforme les données au format Supabase
3. Insère les données dans les tables Supabase

## Prochaines étapes

1. Mettez à jour vos variables d'environnement avec vos clés Supabase
2. Créez les tables dans Supabase
3. Migrez progressivement les composants pour utiliser les hooks Supabase au lieu des hooks Firebase
