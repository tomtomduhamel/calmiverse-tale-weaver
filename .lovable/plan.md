# Correction de l'affichage "Calmiverse" dans le footer

## Diagnostic

Le code source est déjà correct :
- `src/lib/config.ts` → `APP_NAME: 'Calmi'` et `COMPANY.NAME: 'Calmi'`
- `src/components/Footer.tsx` lit `APP_CONFIG.APP_NAME` (pas de hardcode)
- Tous les autres fichiers ont été nettoyés au tour précédent (sed sur 37 fichiers)

Le problème est uniquement que la **version publiée** sur `calmi-stories.lovable.app` est antérieure aux changements (build `260517.1818` du 17 mai 14:18). Le mécanisme "Vérifier les mises à jour" compare le service worker local à la version publiée → il dit "à jour" car les deux sont identiques (et obsolètes).

## Actions à exécuter

### 1. Vérification finale du code (1 min)
- Re-grep `Calmiverse` (sensible et insensible à la casse) dans `src/`, `public/`, `index.html`
- S'assurer qu'aucune occurrence visible utilisateur n'a été ratée
- Garder volontairement intacts les emails `*@calmiverse.com` (adresses de support réelles)

### 2. Republier l'application (action utilisateur)
- Cliquer sur **Publish** dans Lovable pour générer un nouveau build
- Le nouveau build aura un nouveau numéro (ex. `260517.2030+`) et la nouvelle date de déploiement
- Le footer affichera alors "Calmi"

### 3. Forcer la mise à jour côté client (après republication)
Une fois republié, sur l'appareil de l'utilisateur :
- Ouvrir l'app → aller dans Paramètres
- Cliquer "Vérifier les mises à jour"
- Cette fois le bouton "Installer la mise à jour" apparaîtra (téléchargement du nouveau service worker)
- Cliquer dessus → l'app recharge avec le nouveau build et "Calmi" dans le footer

Note : si la PWA est installée en standalone (iOS/Android), il faut parfois la fermer complètement (swipe out) puis la rouvrir pour que le nouveau service worker s'active.

### 4. Vérification post-déploiement
- Confirmer en bas de la page Paramètres que le numéro de build a changé
- Confirmer que le footer affiche "Calmi"
- Re-tester sur 1-2 autres pages contenant le nom de l'app (Pricing, légal)

## Pourquoi pas de modification de code cette fois

Le bug visible n'est pas un bug de code mais un **cache de version publiée**. Toute nouvelle édition de code ne changerait rien tant que la republication n'a pas eu lieu. La seule action nécessaire est : **Publish**.
