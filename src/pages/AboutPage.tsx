import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Heart, Shield, Star, Users, Award } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export const AboutPage = () => {
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

      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-4">
            {APP_CONFIG.APP_NAME}
          </CardTitle>
          <p className="text-xl text-muted-foreground mb-4">
            {APP_CONFIG.APP_DESCRIPTION}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <span>Version {APP_CONFIG.APP_VERSION}</span>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-500" />
              Notre Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Créer des moments magiques entre parents et enfants grâce à des histoires 
              personnalisées, éthiques et bienveillantes. Chaque histoire est unique et 
              adaptée à votre enfant pour nourrir son imagination et renforcer vos liens.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-6 w-6 mr-2 text-green-500" />
              Nos Valeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Protection et respect de l'enfance</li>
              <li>• Transparence et confiance</li>
              <li>• Innovation responsable</li>
              <li>• Bienveillance et empathie</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-blue-500" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Créez un profil</h3>
              <p className="text-sm text-muted-foreground">
                Partagez-nous les goûts et la personnalité de votre enfant
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Choisissez l'objectif</h3>
              <p className="text-sm text-muted-foreground">
                Endormissement, apprentissage, ou simple plaisir de lire
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Découvrez l'histoire</h3>
              <p className="text-sm text-muted-foreground">
                Une histoire unique créée spécialement pour votre enfant
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-6 w-6 mr-2 text-yellow-500" />
            Nos Garanties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✓ Contenu vérifié</h3>
              <p className="text-sm text-green-700">
                Chaque histoire est filtrée pour garantir un contenu adapté et bienveillant
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">✓ Données protégées</h3>
              <p className="text-sm text-blue-700">
                Conformité RGPD et protection renforcée des données d'enfants
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">✓ Sans publicité</h3>
              <p className="text-sm text-purple-700">
                Aucune publicité, aucun tracking, juste de belles histoires
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">✓ Support expert</h3>
              <p className="text-sm text-orange-700">
                Équipe pédagogique et support technique dédiés aux familles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Une Question ? Besoin d'Aide ?</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Notre équipe est là pour vous accompagner dans cette belle aventure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/contact')}>
              Nous contacter
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/documentation')}
            >
              Consulter la documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};