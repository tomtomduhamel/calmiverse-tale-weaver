import React from "react";
import { BookOpen, Users, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViewType } from "@/types/views";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";

interface HomeHeroProps {
  children?: Child[];
}

/**
 * PHASE 2: HomeHero simplifié - plus de onViewChange
 * Utilise React Router directement pour la navigation
 */
const HomeHero: React.FC<HomeHeroProps> = ({
  children = []
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  
  const handleLibraryClick = () => {
    navigate("/library");
  };
  
  const handleTitleStoryClick = () => {
    navigate("/create-story/step-1");
  };

  console.log('[HomeHero] Enfants reçus dans HomeHero:', {
    childrenCount: children?.length || 0,
    children: children?.map(c => ({
      id: c.id,
      name: c.name
    })) || [],
    user: user?.id,
    childrenArray: children
  });

  return (
    <div className="flex flex-col min-h-screen max-h-screen overflow-hidden animate-fade-in px-3 py-1">
      {/* Arrière-plan avec gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-hero"></div>
      </div>
      
      {/* Contenu principal optimisé mobile */}
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col z-10 justify-between">
          <div className="text-center space-y-1 flex-shrink-0 pt-2 pb-1">
            <div className="inline-flex items-center justify-center">
              <div className="rounded-full bg-primary/20 px-2 py-0.5">
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Histoires personnalisées
                </span>
              </div>
            </div>
            
            <h1 className="text-lg sm:text-3xl md:text-5xl font-bold text-foreground">
              Bienvenue sur Calmi
            </h1>
            
            <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto px-2 leading-tight">
              Créez des histoires personnalisées pour accompagner vos enfants
            </p>
          </div>

        {/* Cartes ultra-compactes mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6 flex-1 min-h-0 pb-14 md:pb-4">
          {/* Création d'histoire */}
          <Card className="border border-primary/20 bg-card hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center h-full justify-between">
              <div className="flex flex-col items-center space-y-1 flex-grow">
                <div className="p-1.5 bg-primary/20 w-7 h-7 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-3 w-3 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-card-foreground">Créer une histoire</h3>
                <p className="text-muted-foreground text-xs leading-tight flex-grow">
                  Choisissez parmi 3 titres générés
                </p>
              </div>
              <Button 
                onClick={handleTitleStoryClick} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-7 sm:h-11 text-xs sm:text-sm mt-1"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="border border-secondary/20 bg-card hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center h-full justify-between">
              <div className="flex flex-col items-center space-y-1 flex-grow">
                <div className="p-1.5 bg-secondary/20 w-7 h-7 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                  <Users className="h-3 w-3 sm:h-5 sm:w-5 text-secondary-foreground" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-card-foreground">Univers des enfants</h3>
                <p className="text-muted-foreground text-xs leading-tight flex-grow">
                  Gérez les profils de vos enfants
                </p>
              </div>
              <Link to="/children" className="w-full mt-1">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-7 sm:h-11 text-xs sm:text-sm">
                  Explorer
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="border border-muted/20 bg-card hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center h-full justify-between">
              <div className="flex flex-col items-center space-y-1 flex-grow">
                <div className="p-1.5 bg-muted/20 w-7 h-7 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                  <Library className="h-3 w-3 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-muted-foreground">Bibliothèque</h3>
                <p className="text-muted-foreground text-xs leading-tight flex-grow">
                  Retrouvez vos histoires créées
                </p>
              </div>
              <Button 
                onClick={handleLibraryClick} 
                className="w-full bg-muted hover:bg-muted/80 text-muted-foreground h-7 sm:h-11 text-xs sm:text-sm mt-1"
              >
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pied de page minimal */}
        <div className="text-center flex-shrink-0 pb-1">
          <p className="text-xs text-muted-foreground/70">Histoires personnalisées pour le bien-être des enfants</p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;