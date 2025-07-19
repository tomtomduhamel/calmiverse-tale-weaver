
# Knowledges pour Calmi

## 1. Vue d'ensemble du projet
Calmi est une application web qui génère des histoires personnalisées pour enfants à l'aide de l'intelligence artificielle. L'application permet aux parents de créer des profils pour leurs enfants avec leurs caractéristiques personnelles, puis de générer des histoires adaptées à chaque enfant. Ces histoires peuvent être lues en ligne, partagées ou envoyées sur Kindle.

## 2. Personas utilisateurs
- **Parents modernes (30-45 ans)** : Cherchent des contenus éducatifs et personnalisés pour leurs enfants.
- **Grands-parents connectés** : Souhaitent offrir des histoires personnalisées à leurs petits-enfants.
- **Enseignants/éducateurs** : Utilisent l'application pour créer du contenu adapté à leurs groupes d'élèves.
- **Parents d'enfants avec besoins spécifiques** : Recherchent des histoires qui abordent des situations particulières (anxiété, peurs, etc.).

## 3. Spécifications des fonctionnalités
- **Gestion des profils enfants** : Création et modification de profils avec nom, date de naissance, description du doudou et monde imaginaire.
- **Génération d'histoires** : Création d'histoires personnalisées basées sur les profils des enfants et des objectifs pédagogiques/éducatifs.
- **Bibliothèque d'histoires** : Stockage et organisation des histoires générées avec système de filtrage et recherche.
- **Lecteur d'histoires** : Interface de lecture adaptée aux enfants avec contrôles simples et texte-à-parole.
- **Partage d'histoires** : Options pour partager les histoires par email ou les envoyer sur Kindle.

## 4. Ressources de design
- **Palette de couleurs** : Tons pastels apaisants avec accents vifs pour les éléments interactifs.
- **Typographie** : Police principale accessible et ludique pour l'interface utilisateur, police de lecture confortable pour les histoires.
- **Composants UI** : Utilisation de shadcn-ui avec personnalisation pour une apparence douce et accueillante.
- **Iconographie** : Ensemble cohérent d'icônes arrondies et amicales représentant les concepts d'enfance et d'histoires.

## 5. Documentation API
- **API OpenAI** : Utilisation pour la génération du contenu des histoires avec paramètres optimisés pour les contenus enfants.
- **API Supabase** : Authentification, stockage des profils enfants, histoires et préférences utilisateurs.
- **Edge Functions Supabase** : Points de terminaison pour la génération d'histoires, le traitement asynchrone et les notifications.
- **Webhooks email** : Intégration pour le partage d'histoires par email.
- **Intégration Kindle** : Documentation sur le processus d'envoi des histoires au format compatible Kindle.

## 6. Schéma de base de données
- **Table users** : Informations utilisateur, préférences et paramètres de notification.
- **Table children** : Profils des enfants avec détails personnels et préférences.
- **Table stories** : Histoires générées avec contenu, métadonnées et relations avec les enfants.
- **Relations** : Utilisateur → Enfants (one-to-many), Enfants → Histoires (many-to-many).

## 7. Configuration de l'environnement
- **Prérequis** : Node.js 20+, npm 9+, compte Supabase et OpenAI.
- **Variables d'environnement** : Configuration pour Supabase, OpenAI et webhooks.
- **Développement local** : Instructions pour installer les dépendances et démarrer le serveur de développement.
- **Structure du projet** : Organisation des dossiers principales (components, hooks, pages, utils).

## 8. Directives de test
- **Tests unitaires** : Pour les fonctions d'utilitaires et les hooks avec Vitest.
- **Tests d'intégration** : Pour les workflows critiques comme la création de profil et la génération d'histoires.
- **Tests d'accessibilité** : S'assurer que l'interface est accessible aux utilisateurs de tous âges.
- **Tests de performance** : Benchmarks pour la génération d'histoires et le temps de chargement des pages.

## 9. Instructions de déploiement
- **Environnement de développement** : Configuration pour les tests locaux.
- **Environnement de staging** : Déploiement automatique via GitHub Actions pour tests pré-production.
- **Environnement de production** : Déploiement sur Supabase et services associés via GitHub Actions avec vérifications de sécurité.
- **Procédures de rollback** : Comment restaurer une version précédente en cas de problème.

## 10. Pratiques de gestion de version
- **Stratégie de branches** : Utilisation de main pour la production, develop pour l'intégration continue, branches de fonctionnalités pour le développement.
- **Conventions de commit** : Format type(scope): description (ex: feat(stories): ajout du partage via WhatsApp).
- **Revue de code** : Critères de qualité et checklist pour les pull requests.

## 11. Pratiques de sécurité
- **Gestion des clés API** : Stockage sécurisé des clés OpenAI et autres services externes dans les secrets Supabase.
- **Authentification** : Meilleures pratiques pour l'authentification Supabase.
- **Filtrage de contenu** : Mesures pour garantir que les histoires générées sont adaptées aux enfants.
- **RGPD** : Considérations spécifiques pour la gestion des données personnelles des enfants.

## 12. Exigences de conformité
- **RGPD** : Conformité avec les réglementations européennes sur la protection des données.
- **COPPA** : Considérations pour la conformité avec la loi américaine sur la protection de la vie privée des enfants.
- **Standards d'accessibilité** : Conformité avec WCAG 2.1 pour garantir l'accessibilité de l'interface.
- **Sécurité du contenu** : Filtres et vérifications pour assurer que le contenu généré est approprié pour les enfants.
