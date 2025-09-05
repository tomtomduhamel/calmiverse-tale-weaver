import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Conditions Générales d'Utilisation
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Objet</h2>
            <p>
              Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation 
              de l'application Calmiverse, plateforme de génération d'histoires personnalisées 
              pour enfants utilisant l'intelligence artificielle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Acceptation des conditions</h2>
            <p>
              L'utilisation de Calmiverse implique l'acceptation pleine et entière des présentes CGU. 
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Description du service</h2>
            <p>
              Calmiverse permet aux utilisateurs de créer des profils d'enfants et de générer 
              des histoires personnalisées adaptées à chaque enfant. Le service inclut :
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Création et gestion de profils enfants</li>
              <li>Génération d'histoires personnalisées par IA</li>
              <li>Bibliothèque d'histoires avec fonctions de lecture</li>
              <li>Partage d'histoires par email ou envoi sur Kindle</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Compte utilisateur</h2>
            <p>
              Pour utiliser Calmiverse, vous devez créer un compte. Vous êtes responsable 
              de maintenir la confidentialité de vos identifiants et de toutes les activités 
              qui se produisent sous votre compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Protection des données des enfants</h2>
            <p>
              Nous nous engageons à protéger les données des enfants conformément au RGPD et 
              aux réglementations sur la protection de l'enfance. Les données collectées sont 
              strictement limitées à la personnalisation des histoires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Contenu généré</h2>
            <p>
              Le contenu des histoires est généré automatiquement par intelligence artificielle. 
              Bien que nous mettions en place des filtres de sécurité, nous recommandons 
              la supervision parentale lors de la lecture.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Propriété intellectuelle</h2>
            <p>
              Les histoires générées vous appartiennent. Calmiverse conserve une licence 
              pour améliorer ses services. La plateforme et ses technologies restent 
              notre propriété exclusive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitation de responsabilité</h2>
            <p>
              Calmiverse est fourni "en l'état". Nous ne pouvons garantir la disponibilité 
              continue du service ni l'exactitude complète du contenu généré par IA.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit 
              de suspendre l'accès en cas de violation des présentes conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
            <p>
              Pour toute question concernant ces CGU, contactez-nous à : support@calmiverse.com
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};