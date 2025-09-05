import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CookiePolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Politique des Cookies
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Qu'est-ce qu'un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte stocké sur votre appareil lors de votre 
              visite sur un site web. Il permet de mémoriser des informations sur votre 
              navigation pour améliorer votre expérience utilisateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Cookies utilisés par Calmiverse</h2>
            
            <h3 className="text-lg font-medium mb-2">Cookies strictement nécessaires :</h3>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="font-medium">calmi-auth-token</p>
              <p className="text-sm text-muted-foreground">
                Durée : Session + 1 heure<br/>
                Finalité : Maintenir votre session de connexion sécurisée<br/>
                Suppression : Automatique à la déconnexion
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="font-medium">theme-preference</p>
              <p className="text-sm text-muted-foreground">
                Durée : 1 an<br/>
                Finalité : Mémoriser votre préférence de thème (clair/sombre)<br/>
                Suppression : Manuel via paramètres du navigateur
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Cookies que nous n'utilisons PAS</h2>
            <p>Calmiverse ne contient aucun des éléments suivants :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Cookies de tracking publicitaire</li>
              <li>Cookies de réseaux sociaux tiers</li>
              <li>Cookies d'analyse comportementale</li>
              <li>Cookies de profilage commercial</li>
              <li>Pixels de tracking externes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Gestion des cookies</h2>
            
            <h3 className="text-lg font-medium mb-2">Paramètres du navigateur :</h3>
            <p className="mb-4">
              Vous pouvez configurer votre navigateur pour refuser les cookies, 
              mais cela peut affecter le fonctionnement de l'application.
            </p>

            <div className="space-y-2 text-sm">
              <p><strong>Chrome :</strong> Paramètres {'->'} Confidentialité et sécurité {'->'} Cookies</p>
              <p><strong>Firefox :</strong> Paramètres {'->'} Vie privée et sécurité {'->'} Cookies</p>
              <p><strong>Safari :</strong> Préférences {'->'} Confidentialité {'->'} Cookies</p>
              <p><strong>Edge :</strong> Paramètres {'->'} Cookies et autorisations de site</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Cookies et données personnelles</h2>
            <p>
              Les cookies techniques utilisés par Calmiverse contiennent uniquement des 
              identifiants de session anonymes. Aucune donnée personnelle identifiable 
              n'est stockée dans les cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Mise à jour de cette politique</h2>
            <p>
              Cette politique peut être mise à jour pour refléter les changements dans 
              notre utilisation des cookies. Nous vous informerons de tout changement 
              significatif.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
            <p>
              Pour toute question sur notre utilisation des cookies : 
              cookies@calmiverse.com
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};