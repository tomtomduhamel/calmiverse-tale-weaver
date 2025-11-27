import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Sparkles, 
  Volume2, 
  MessageSquarePlus,
  Mail,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickStartPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenue dans la Beta de Calmi ! 🎉
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Merci de faire partie de nos premiers testeurs. Ce guide vous aidera à démarrer 
          et à nous partager vos précieux retours.
        </p>
      </div>

      {/* Getting Started Steps */}
      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Guide de démarrage rapide
        </h2>

        {/* Step 1 */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Créer un profil enfant
              </h3>
              <p className="text-muted-foreground mb-3">
                Commencez par créer un profil pour votre enfant avec ses informations : 
                prénom, âge, centres d'intérêt, et même son doudou préféré !
              </p>
              <Link to="/children">
                <Button variant="outline" size="sm">
                  Créer un profil <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Step 2 */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Générer votre première histoire
              </h3>
              <p className="text-muted-foreground mb-3">
                Choisissez l'objectif de l'histoire (aider à dormir, se concentrer, etc.) 
                et laissez notre IA créer une histoire personnalisée en quelques secondes.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mb-3">
                <p className="text-sm font-medium mb-2">💡 Astuce :</p>
                <p className="text-sm text-muted-foreground">
                  La génération prend environ 30 secondes. Vous pouvez quitter la page, 
                  une notification vous préviendra quand l'histoire sera prête !
                </p>
              </div>
              <Link to="/create-story/step-1">
                <Button variant="outline" size="sm">
                  Créer une histoire <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Step 3 */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lire et écouter l'histoire
              </h3>
              <p className="text-muted-foreground mb-3">
                Une fois l'histoire générée, vous pouvez la lire directement ou générer 
                une version audio pour une expérience immersive.
              </p>
              <div className="flex gap-2">
                <Link to="/library">
                  <Button variant="outline" size="sm">
                    Voir ma bibliothèque <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 4 */}
        <Card className="p-6 border-2 border-primary">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5" />
                Partagez votre feedback
              </h3>
              <p className="text-muted-foreground mb-3">
                Votre avis est essentiel ! Utilisez le bouton de feedback flottant 
                en bas à droite pour nous dire ce que vous pensez de l'application.
              </p>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">🎯 Nous voulons savoir :</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ce qui vous plaît</li>
                  <li>Ce qui pourrait être amélioré</li>
                  <li>Les bugs ou problèmes rencontrés</li>
                  <li>Les fonctionnalités que vous aimeriez voir</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Fonctionnalités clés à tester</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <Volume2 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Génération audio</h3>
            <p className="text-sm text-muted-foreground">
              Transformez vos histoires en audio avec notre voix de synthèse naturelle
            </p>
          </Card>
          <Card className="p-4">
            <Sparkles className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">IA personnalisée</h3>
            <p className="text-sm text-muted-foreground">
              Chaque histoire est unique et adaptée aux intérêts de votre enfant
            </p>
          </Card>
          <Card className="p-4">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Bibliothèque</h3>
            <p className="text-sm text-muted-foreground">
              Retrouvez toutes vos histoires organisées et accessibles hors ligne
            </p>
          </Card>
          <Card className="p-4">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Profils multiples</h3>
            <p className="text-sm text-muted-foreground">
              Créez des profils pour chacun de vos enfants avec leurs préférences
            </p>
          </Card>
        </div>
      </div>

      {/* Support Section */}
      <Card className="p-6 bg-muted/50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Besoin d'aide ?
        </h2>
        <p className="text-muted-foreground mb-4">
          Nous sommes là pour vous aider ! N'hésitez pas à nous contacter si vous rencontrez 
          le moindre problème ou si vous avez des questions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/contact">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Nous contacter
            </Button>
          </Link>
          <Link to="/documentation">
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation complète
            </Button>
          </Link>
        </div>
      </Card>

      {/* Thank You */}
      <div className="text-center mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
        <h2 className="text-2xl font-bold mb-3">Merci de votre confiance ! 🙏</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Votre participation à cette phase beta est précieuse. Ensemble, 
          nous allons créer la meilleure expérience pour vos enfants.
        </p>
      </div>
    </div>
  );
};
