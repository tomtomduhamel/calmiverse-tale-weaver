import React from "react";
import { BookOpen, Users, Library, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViewType } from "@/types/views";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";
interface HomeHeroProps {
  onViewChange: (view: ViewType) => void;
  children?: Child[];
}
const HomeHero: React.FC<HomeHeroProps> = ({
  onViewChange,
  children = []
}) => {
  const navigate = useNavigate();
  const {
    user
  } = useSupabaseAuth();
  const handleLibraryClick = () => {
    navigate("/library");
  };
  const handleTitleStoryClick = () => {
    navigate("/create-story-titles");
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
  return <div className="flex flex-col justify-start overflow-hidden animate-fade-in px-4 py-4 sm:py-6">
      {/* Arrière-plan avec gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-hero"></div>
      </div>
      
      {/* Contenu principal optimisé mobile */}
      <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 z-10">
        {/* En-tête compact */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center justify-center mb-1">
            <div className="rounded-full bg-primary/20 px-3 py-1">
              <span className="text-xs sm:text-sm font-medium text-primary-dark flex items-center gap-1 sm:gap-2">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                Histoires personnalisées
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary-dark animate-fade-in">
            Bienvenue sur Calmi
          </h1>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto animate-fade-in px-2">
            Créez des histoires personnalisées pour accompagner vos enfants 
            dans leur bien-être et leur développement
          </p>
        </div>

        {/* Cartes optimisées mobile - maintenant avec 3 options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Création d'histoire avec sélection de titres */}
          <Card className="border border-primary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center h-full">
              <div className="mb-2 sm:mb-3 p-2 bg-primary/20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-dark" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 text-primary-dark">Créer une histoire</h3>
              <p className="text-muted-foreground text-xs mb-2 sm:mb-3 flex-grow leading-relaxed">
                Choisissez parmi 3 titres générés pour créer votre histoire
              </p>
              <Button onClick={handleTitleStoryClick} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground h-10 sm:h-11 text-sm mt-auto">
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="border border-secondary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center h-full">
              <div className="mb-2 sm:mb-3 p-2 bg-secondary/20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 text-secondary-dark">Univers des enfants</h3>
              <p className="text-muted-foreground text-xs mb-2 sm:mb-3 flex-grow leading-relaxed">
                Gérez les profils et préférences de vos enfants
              </p>
              <Link to="/children" className="w-full mt-auto">
                <Button className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground h-10 sm:h-11 text-sm">
                  Explorer
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="border border-muted/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center h-full">
              <div className="mb-2 sm:mb-3 p-2 bg-muted/20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto">
                <Library className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 text-muted-foreground">Bibliothèque d'histoires</h3>
              <p className="text-muted-foreground text-xs mb-2 sm:mb-3 flex-grow leading-relaxed">
                Retrouvez toutes vos histoires créées
              </p>
              <Button onClick={handleLibraryClick} className="w-full bg-muted hover:bg-muted/80 text-muted-foreground h-10 sm:h-11 text-sm mt-auto">
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pied de page compact */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground/70">
            Calmi - Histoires personnalisées pour le bien-être des enfants
          </p>
        </div>
      </div>
    </div>;
};
export default HomeHero;