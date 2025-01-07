import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <h1 className="text-3xl font-bold text-secondary mb-8">Règles de Confidentialité</h1>
      
      <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Introduction</h2>
          <p>
            Bienvenue dans la politique de confidentialité de Calmi. Nous accordons une grande importance à la protection de vos données personnelles et de celles de vos enfants.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Collecte des Données</h2>
          <p>
            Nous collectons uniquement les informations nécessaires au bon fonctionnement de l'application :
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Profils des enfants (prénom, âge, préférences)</li>
            <li>Historique des histoires générées</li>
            <li>Préférences de lecture</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Utilisation des Données</h2>
          <p>
            Les données collectées sont utilisées exclusivement pour :
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Personnaliser les histoires selon les profils</li>
            <li>Améliorer l'expérience utilisateur</li>
            <li>Sauvegarder les préférences de lecture</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Protection des Données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Chiffrement des données sensibles</li>
            <li>Accès restreint aux données personnelles</li>
            <li>Mise à jour régulière de nos systèmes de sécurité</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Droits des Utilisateurs</h2>
          <p>
            Vous disposez des droits suivants concernant vos données :
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit à la portabilité des données</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-4">Contact</h2>
          <p>
            Pour toute question concernant notre politique de confidentialité, vous pouvez nous contacter à l'adresse : privacy@calmi.app
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;