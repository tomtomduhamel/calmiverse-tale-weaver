import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, FileText } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Contactez-nous
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Notre équipe est là pour vous aider avec Calmiverse
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Support technique</h2>
            <p className="text-muted-foreground mb-4">
              Vous rencontrez un problème technique ou avez une question sur l'utilisation de Calmiverse ?
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Email de support</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Réponse sous 24h en semaine
              </p>
              <a 
                href={`mailto:${APP_CONFIG.COMPANY.EMAIL}`}
                className="text-primary hover:underline font-medium"
              >
                {APP_CONFIG.COMPANY.EMAIL}
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Questions sur la confidentialité</h2>
            <p className="text-muted-foreground mb-4">
              Questions concernant la protection des données de vos enfants ou la conformité RGPD.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Délégué à la protection des données</span>
              </div>
              <a 
                href={`mailto:${APP_CONFIG.COMPANY.DPO_EMAIL}`}
                className="text-primary hover:underline font-medium"
              >
                {APP_CONFIG.COMPANY.DPO_EMAIL}
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Suggestions et commentaires</h2>
            <p className="text-muted-foreground mb-4">
              Vous avez une idée pour améliorer Calmiverse ? Partagez-la avec nous !
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Feedback et suggestions</span>
              </div>
              <a 
                href={`mailto:feedback@calmiverse.com?subject=Suggestion pour Calmiverse`}
                className="text-primary hover:underline font-medium"
              >
                feedback@calmiverse.com
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Partenariats et médias</h2>
            <p className="text-muted-foreground mb-4">
              Journalistes, influenceurs ou partenaires potentiels.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Relations presse</span>
              </div>
              <a 
                href={`mailto:presse@calmiverse.com`}
                className="text-primary hover:underline font-medium"
              >
                presse@calmiverse.com
              </a>
            </div>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Engagement qualité</h2>
            <p className="text-sm text-muted-foreground">
              Chez Calmiverse, nous nous engageons à créer des histoires de qualité, 
              éthiques et adaptées aux enfants. Notre équipe pédagogique valide chaque 
              histoire générée pour s'assurer qu'elle respecte nos standards de qualité 
              et de bienveillance.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};