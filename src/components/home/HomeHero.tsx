
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
    <div className="space-y-8 animate-fade-in relative py-6" data-testid="home-hero">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Bienvenue sur Calmi
        </h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
          Créez des histoires personnalisées pour le bien-être de vos enfants
        </p>
      </div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 opacity-10">
          <div className="w-20 h-20 rounded-full bg-primary animate-pulse"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-10">
          <div className="w-16 h-16 rounded-full bg-accent animate-pulse delay-300"></div>
        </div>
        <div className="absolute top-40 right-1/4 opacity-10">
          <div className="w-12 h-12 rounded-full bg-secondary animate-pulse delay-500"></div>
        </div>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Créer une histoire */}
        <Card className="bg-gradient-to-br from-accent/30 to-accent/10 border-accent/20 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">Créer une histoire</h3>
            <p className="text-muted-foreground text-center mb-4">
              Créez des histoires uniques adaptées aux besoins de votre enfant
            </p>
            <Button
              onClick={() => handleViewChange("create")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground mt-auto w-full"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Commencer
            </Button>
          </CardContent>
        </Card>
        
        {/* Univers des enfants */}
        <Card className="bg-gradient-to-br from-primary/30 to-primary/10 border-primary/20 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">Univers des enfants</h3>
            <p className="text-muted-foreground text-center mb-4">
              Gérez les profils de vos enfants et personnalisez leur expérience
            </p>
            <Button
              onClick={() => handleViewChange("profiles")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground mt-auto w-full"
            >
              <Users className="h-5 w-5 mr-2" />
              Explorer
            </Button>
          </CardContent>
        </Card>
        
        {/* Bibliothèque */}
        <Card className="bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/20 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Library className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">Bibliothèque</h3>
            <p className="text-muted-foreground text-center mb-4">
              Retrouvez toutes vos histoires et accédez à du contenu inspirant
            </p>
            <Button
              onClick={() => handleViewChange("library")}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground mt-auto w-full"
            >
              <Library className="h-5 w-5 mr-2" />
              Consulter
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Feature Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 pt-4">
        <Button
          variant="outline"
          onClick={() => handleViewChange("settings")}
          className="min-h-[48px] min-w-[200px] rounded-xl border-2 hover:bg-muted/20 transition-all"
        >
          <Settings className="h-5 w-5 mr-2" />
          Paramètres
        </Button>
      </div>
    </div>
  );
};

export default HomeHero;
