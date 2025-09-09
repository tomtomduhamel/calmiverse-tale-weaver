import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Shield, Zap, Heart, Star } from "lucide-react";

export const DocumentationPage = () => {
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
            Documentation Calmiverse
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Tout ce que vous devez savoir pour utiliser Calmiverse efficacement
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <div className="flex items-center mb-4">
              <BookOpen className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Guide de démarrage</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">1. Créer un profil enfant</h3>
                <p className="text-sm text-muted-foreground">
                  Commencez par créer un profil pour votre enfant avec son prénom, 
                  âge et ses intérêts. Plus vous ajoutez de détails, plus les histoires 
                  seront personnalisées.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">2. Choisir un objectif</h3>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez l'objectif de l'histoire : aider à s'endormir, 
                  apprendre quelque chose de nouveau, ou simplement s'amuser.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">3. Générer l'histoire</h3>
                <p className="text-sm text-muted-foreground">
                  Notre IA crée une histoire unique adaptée à votre enfant. 
                  La génération prend généralement 30 secondes à 1 minute.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Gestion des profils enfants</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                <strong>Informations recommandées :</strong>
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Prénom et âge de l'enfant</li>
                <li>Centres d'intérêt (animaux, espace, princesses, etc.)</li>
                <li>Doudou ou objet préféré</li>
                <li>Peurs ou phobies à éviter dans les histoires</li>
                <li>Personnages favoris ou héros préférés</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Sécurité et éthique</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">✓ Contenu vérifié</h3>
                <p className="text-sm text-green-700">
                  Toutes nos histoires sont filtrées par notre IA spécialisée pour 
                  garantir un contenu approprié aux enfants.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">✓ Respect de la vie privée</h3>
                <p className="text-sm text-green-700">
                  Aucune donnée personnelle n'est partagée avec des tiers. 
                  Conformité RGPD et protection spéciale des données d'enfants.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">✓ Valeurs positives</h3>
                <p className="text-sm text-green-700">
                  Nos histoires promeuvent l'empathie, le courage, la bienveillance 
                  et la résolution pacifique des conflits.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Zap className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Fonctionnalités avancées</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Lecteur audio</h3>
                <p className="text-sm text-muted-foreground">
                  Écoutez les histoires avec notre synthèse vocale de qualité.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Partage famille</h3>
                <p className="text-sm text-muted-foreground">
                  Partagez vos histoires préférées avec les grands-parents.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Bibliothèque personnelle</h3>
                <p className="text-sm text-muted-foreground">
                  Retrouvez toutes vos histoires dans votre bibliothèque.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Mode hors ligne</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez vos histoires pour les lire sans connexion.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Conseils pour de meilleures histoires</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Plus vous ajoutez de détails dans le profil de votre enfant, 
                  plus l'histoire sera personnalisée et captivante.
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Mentionnez les situations que vit votre enfant (déménagement, 
                  nouveau bébé, rentrée scolaire) pour des histoires adaptées.
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Variez les objectifs pour découvrir différents types d'histoires 
                  et accompagner votre enfant dans tous les moments.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Besoin d'aide ?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Si vous ne trouvez pas la réponse à votre question dans cette documentation, 
              n'hésitez pas à nous contacter.
            </p>
            <Button 
              onClick={() => navigate('/contact')}
              className="w-full md:w-auto"
            >
              Nous contacter
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};