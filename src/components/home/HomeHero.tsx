import React from "react";
import { BookOpen, Users, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewType } from "@/types/views";

interface HomeHeroProps {
  onViewChange: (view: ViewType) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ onViewChange }) => {
  return (
    <div className="text-center space-y-8 animate-fade-in relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 opacity-10">
          <div className="w-20 h-20 rounded-full bg-primary animate-pulse"></div>
        </div>
        <div className="absolute top-40 right-10 opacity-10">
          <div className="w-16 h-16 rounded-full bg-accent animate-pulse delay-300"></div>
        </div>
      </div>
      
      <h2 className="text-4xl font-bold mb-4 text-secondary">
        Bienvenue sur Calmi
      </h2>
      <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
        Créez des histoires personnalisées pour le bien-être de vos enfants
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <Button
          onClick={() => onViewChange("create")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground min-h-[48px] min-w-[200px] rounded-2xl shadow-lg transition-all hover:shadow-xl"
        >
          <BookOpen className="h-5 w-5 mr-2" />
          Créer une histoire
        </Button>
        <Button
          onClick={() => onViewChange("profiles")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[48px] min-w-[200px] rounded-2xl shadow-lg transition-all hover:shadow-xl"
        >
          <Users className="h-5 w-5 mr-2" />
          L'univers des enfants
        </Button>
        <Button
          onClick={() => onViewChange("library")}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground min-h-[48px] min-w-[200px] rounded-2xl shadow-lg transition-all hover:shadow-xl"
        >
          <Library className="h-5 w-5 mr-2" />
          Accéder à la bibliothèque
        </Button>
      </div>
    </div>
  );
};

export default HomeHero;