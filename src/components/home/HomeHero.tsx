
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
    <div className="min-h-[calc(100vh-4rem)] relative flex flex-col justify-center">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-5 overflow-hidden">
        <div 
          className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/4 h-[250px] w-[250px] rounded-full bg-secondary/10 blur-[100px] animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-accent/5 blur-[120px] animate-pulse"
          style={{ animationDuration: '10s' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-12 py-8">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 p-2 px-4 shadow-lg">
              <span className="text-sm font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Histoires personnalisées
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
            Bienvenue sur Calmi
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Créez des histoires personnalisées pour accompagner vos enfants dans leur bien-être et leur développement
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Créer une histoire */}
          <Card className="group relative overflow-hidden border border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Créer une histoire</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Générez des histoires uniques adaptées aux besoins spécifiques de votre enfant
              </p>
              <Button 
                onClick={() => handleViewChange("create")}
                className="w-full bg-primary/90 hover:bg-primary group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="group relative overflow-hidden border border-secondary/10 bg-background/50 backdrop-blur-sm hover:border-secondary/30 transition-all duration-300">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-secondary/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Univers des enfants</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Gérez les profils et préférences de vos enfants pour une expérience personnalisée
              </p>
              <Button 
                onClick={() => handleViewChange("profiles")}
                className="w-full bg-secondary/90 hover:bg-secondary group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Explorer
              </Button>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="group relative overflow-hidden border border-accent/10 bg-background/50 backdrop-blur-sm hover:border-accent/30 transition-all duration-300">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 p-3 bg-accent/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Library className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bibliothèque</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Retrouvez toutes vos histoires et accédez à du contenu inspirant pour vos enfants
              </p>
              <Button 
                onClick={() => handleViewChange("library")}
                className="w-full bg-accent/90 hover:bg-accent group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
