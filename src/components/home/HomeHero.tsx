
import React from "react";
import { BookOpen, Users, Library, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViewType } from "@/types/views";

interface HomeHeroProps {
  onViewChange: (view: ViewType) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ onViewChange }) => {
  console.log("Rendering HomeHero component with props:", !!onViewChange);
  
  const handleViewChange = (view: ViewType) => {
    console.log("HomeHero: Changing view to", view);
    if (typeof onViewChange === 'function') {
      onViewChange(view);
    } else {
      console.error("onViewChange is not a function or undefined");
    }
  };
  
  return (
    <div className="space-y-10 py-8 max-w-6xl mx-auto px-4 sm:px-6" data-testid="home-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-25 translate-x-1/4 transform">
          <div className="h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px]"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-25 -translate-x-1/4 transform">
          <div className="h-[250px] w-[250px] rounded-full bg-secondary/20 blur-[100px]"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[350px] w-[350px] rounded-full bg-accent/10 blur-[120px]"></div>
        </div>
      </div>

      {/* Header section */}
      <div className="text-center relative z-10">
        <div className="inline-block mb-3">
          <div className="flex items-center justify-center space-x-2 p-1.5 px-3 bg-white/50 dark:bg-white/10 rounded-full border border-primary/20 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary-foreground/80">Histoires personnalisées</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Bienvenue sur Calmi
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Créez des histoires personnalisées pour accompagner vos enfants dans leur bien-être et leur développement
        </p>
      </div>
      
      {/* Main cards container with grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Card 1: Créer une histoire */}
        <Card className="group overflow-hidden border-0 bg-gradient-to-br from-accent/20 to-white dark:to-transparent shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_30px_-8px_rgba(0,0,0,0.2)] transition-all duration-300">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="p-3 mb-4 bg-accent/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Créer une histoire</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-grow">
              Générez des histoires uniques adaptées aux besoins spécifiques de votre enfant
            </p>
            <Button 
              onClick={() => handleViewChange("create")}
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground group-hover:translate-y-0 translate-y-1 transition-transform"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Commencer
            </Button>
          </CardContent>
        </Card>
        
        {/* Card 2: Univers des enfants */}
        <Card className="group overflow-hidden border-0 bg-gradient-to-br from-primary/20 to-white dark:to-transparent shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_30px_-8px_rgba(0,0,0,0.2)] transition-all duration-300">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="p-3 mb-4 bg-primary/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Univers des enfants</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-grow">
              Gérez les profils et préférences de vos enfants pour une expérience personnalisée
            </p>
            <Button 
              onClick={() => handleViewChange("profiles")}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground group-hover:translate-y-0 translate-y-1 transition-transform"
            >
              <Users className="h-5 w-5 mr-2" />
              Explorer
            </Button>
          </CardContent>
        </Card>
        
        {/* Card 3: Bibliothèque */}
        <Card className="group overflow-hidden border-0 bg-gradient-to-br from-secondary/20 to-white dark:to-transparent shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_30px_-8px_rgba(0,0,0,0.2)] transition-all duration-300">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="p-3 mb-4 bg-secondary/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Library className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Bibliothèque</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-grow">
              Retrouvez toutes vos histoires et accédez à du contenu inspirant pour vos enfants
            </p>
            <Button 
              onClick={() => handleViewChange("library")}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground group-hover:translate-y-0 translate-y-1 transition-transform"
            >
              <Library className="h-5 w-5 mr-2" />
              Consulter
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer section */}
      <div className="flex justify-center pt-4 relative z-10">
        <Button
          variant="outline"
          onClick={() => handleViewChange("settings")}
          className="min-h-[48px] px-6 border border-muted-foreground/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300"
        >
          <Settings className="h-5 w-5 mr-2" />
          Paramètres
        </Button>
      </div>
    </div>
  );
};

export default HomeHero;
