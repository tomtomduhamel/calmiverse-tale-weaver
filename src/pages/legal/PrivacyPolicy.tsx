import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Politique de Confidentialité
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Cette politique de confidentialité explique comment Calmiverse collecte, 
              utilise et protège vos données personnelles et celles de vos enfants, 
              conformément au RGPD et aux lois sur la protection des données.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Données collectées</h2>
            <h3 className="text-lg font-medium mb-2">Données utilisateur :</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Adresse email (inscription et communication)</li>
              <li>Nom et prénom (optionnel)</li>
              <li>Préférences de lecture et notifications</li>
              <li>Adresse email Kindle (optionnel, pour envoi d'histoires)</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2">Données enfants :</h3>
            <ul className="list-disc pl-6">
              <li>Prénom de l'enfant</li>
              <li>Date de naissance (pour adaptation du contenu)</li>
              <li>Centres d'intérêt et descriptions de doudous</li>
              <li>Photos de doudous (optionnel, stockage sécurisé)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Personnaliser les histoires selon les profils enfants</li>
              <li>Gérer votre compte et préférences</li>
              <li>Envoyer les notifications que vous avez choisies</li>
              <li>Améliorer nos services (données anonymisées)</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibend mb-4">4. Protection des données enfants</h2>
            <p>
              Nous appliquons des mesures spéciales pour protéger les données des mineurs :
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Collecte minimale de données nécessaires</li>
              <li>Chiffrement de toutes les données sensibles</li>
              <li>Accès restreint aux données enfants</li>
              <li>Respect du consentement parental</li>
              <li>Droit de suppression renforcé</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Stockage et sécurité</h2>
            <p>
              Vos données sont hébergées sur des serveurs européens sécurisés (Supabase). 
              Nous utilisons le chiffrement en transit et au repos, l'authentification 
              multi-facteurs et des sauvegardes automatiques.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Partage des données</h2>
            <p>
              Nous ne vendons jamais vos données. Le partage se limite à :
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Prestataires techniques (Supabase, OpenAI) sous contrat strict</li>
              <li>Obligations légales si requises par la justice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Vos droits</h2>
            <p>Vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Accès à vos données personnelles</li>
              <li>Rectification des données inexactes</li>
              <li>Suppression de votre compte et données</li>
              <li>Portabilité de vos données</li>
              <li>Opposition au traitement</li>
              <li>Limitation du traitement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Cookies et traceurs</h2>
            <p>
              Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement 
              de l'application. Aucun cookie de tracking publicitaire n'est utilisé.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Conservation des données</h2>
            <p>
              Les données sont conservées tant que votre compte est actif. Après suppression, 
              les données sont définitivement effacées sous 30 jours, sauf obligations légales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
            <p>
              Pour exercer vos droits ou toute question : privacy@calmiverse.com
              <br />
              Délégué à la protection des données : dpo@calmiverse.com
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};