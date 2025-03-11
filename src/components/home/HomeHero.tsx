
import React from "react";
import { BookOpen, Users, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViewType } from "@/types/views";

interface HomeHeroProps {
  onViewChange: (view: ViewType) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ onViewChange }) => {
  const handleViewChange = (view: ViewType) => {
    if (typeof onViewChange === 'function') {
      onViewChange(view);
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex flex-col justify-center overflow-hidden animate-fade-in">
      {/* Arrière-plan avec gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-hero"></div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-12 py-8 z-10">
        {/* En-tête */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center mb-2">
            <div className="rounded-full bg-primary/20 px-4 py-1">
              <span className="text-sm font-medium text-primary-dark flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Histoires personnalisées
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-primary-dark animate-fade-in">
            Bienvenue sur Calmi
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Créez des histoires personnalisées pour accompagner vos enfants 
            dans leur bien-être et leur développement
          </p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Créer une histoire */}
          <Card className="border border-primary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-primary/20 w-14 h-14 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-dark">Créer une histoire</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Générez des histoires uniques adaptées aux besoins spécifiques de votre enfant
              </p>
              <Button 
                onClick={() => handleViewChange("create")}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="border border-secondary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-secondary/20 w-14 h-14 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-secondary-dark">Univers des enfants</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Gérez les profils et préférences de vos enfants pour une expérience personnalisée
              </p>
              <Button 
                onClick={() => handleViewChange("profiles")}
                className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground"
              >
                Explorer
              </Button>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="border border-accent/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-accent/20 w-14 h-14 rounded-xl flex items-center justify-center">
                <Library className="h-6 w-6 text-accent-dark" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-accent-dark">Bibliothèque</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Retrouvez toutes vos histoires et accédez à du contenu inspirant pour vos enfants
              </p>
              <Button 
                onClick={() => handleViewChange("library")}
                className="w-full bg-accent hover:bg-accent-dark text-accent-foreground"
              >
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pied de page */}
        <div className="text-center pt-8">
          <p className="text-xs text-muted-foreground/70">
            Calmi - Histoires personnalisées pour le bien-être des enfants
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
