
import React from "react";
import { BookOpen, Users, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViewType } from "@/types/views";
import { Link, useNavigate } from "react-router-dom";

interface HomeHeroProps {
  onViewChange: (view: ViewType) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ onViewChange }) => {
  const navigate = useNavigate();

  const handleLibraryClick = () => {
    onViewChange("library");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex flex-col justify-center overflow-hidden animate-fade-in">
      {/* Arrière-plan avec gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-hero"></div>
      </div>
      
      {/* Contenu principal avec espacement réduit */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-6 z-10 py-4">
        {/* En-tête avec espacement réduit */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center mb-1">
            <div className="rounded-full bg-primary/20 px-4 py-1">
              <span className="text-sm font-medium text-primary-dark flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Histoires personnalisées
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-primary-dark animate-fade-in">
            Bienvenue sur Calmi
          </h1>
          
          <p className="text-base text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Créez des histoires personnalisées pour accompagner vos enfants 
            dans leur bien-être et leur développement
          </p>
        </div>

        {/* Cartes avec hauteur réduite */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Mode simple - Création d'histoire */}
          <Card className="border border-primary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="mb-3 p-2 bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-primary-dark">Créer une histoire</h3>
              <p className="text-muted-foreground text-xs mb-3 flex-grow">Générez facilement des histoires uniques pour vos enfants</p>
              <Link to="/create-story-simple" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
                  Commencer
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="border border-secondary/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="mb-3 p-2 bg-secondary/20 w-12 h-12 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-secondary-dark">Univers des enfants</h3>
              <p className="text-muted-foreground text-xs mb-3 flex-grow">
                Gérez les profils et préférences de vos enfants pour une expérience personnalisée
              </p>
              <Link to="/children" className="w-full">
                <Button className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground">
                  Explorer
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="border border-accent/20 bg-white/80 hover:shadow-md transition-all duration-300 hover-lift">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="mb-3 p-2 bg-accent/20 w-12 h-12 rounded-xl flex items-center justify-center">
                <Library className="h-5 w-5 text-accent-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-accent-dark">Bibliothèque</h3>
              <p className="text-muted-foreground text-xs mb-3 flex-grow">
                Retrouvez toutes vos histoires et accédez à du contenu inspirant pour vos enfants
              </p>
              <Button onClick={handleLibraryClick} className="w-full bg-accent hover:bg-accent-dark text-accent-foreground">
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pied de page avec espacement réduit */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground/70">
            Calmi - Histoires personnalisées pour le bien-être des enfants
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
