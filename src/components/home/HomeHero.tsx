
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
    <div className="min-h-[calc(100vh-4rem)] relative flex flex-col justify-center overflow-hidden">
      {/* Enhanced Gradient Background with multiple layers for depth */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-hero" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      </div>
      
      {/* Animated Background Elements - Enhanced with varying sizes and animations */}
      <div className="absolute inset-0 -z-5 overflow-hidden">
        <div 
          className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow"
          style={{ animationDuration: '15s' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/4 h-[250px] w-[250px] rounded-full bg-secondary/20 blur-[100px] animate-pulse-slow"
          style={{ animationDuration: '12s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-accent/15 blur-[120px] animate-pulse-slow"
          style={{ animationDuration: '10s' }}
        />
        <div 
          className="absolute top-3/4 right-1/3 h-[200px] w-[200px] rounded-full bg-primary-dark/10 blur-[80px] animate-pulse-slow"
          style={{ animationDuration: '18s' }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 -z-5 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/30 animate-float" 
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-12 py-8 z-10">
        {/* Header Section - Enhanced with better spacing and animations */}
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-2">
            <div className="rounded-full bg-primary/15 backdrop-blur-sm border border-primary/20 p-2 px-4 shadow-lg hover-lift">
              <span className="text-sm font-medium text-primary-dark flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Histoires personnalisées
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary-dark via-secondary to-accent bg-clip-text text-transparent animate-gradient">
            Bienvenue sur Calmi
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Créez des histoires personnalisées pour accompagner vos enfants 
            dans leur bien-être et leur développement
          </p>
        </div>

        {/* Cards Grid - Enhanced with glass effects and better animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Créer une histoire */}
          <Card className="group relative overflow-hidden border border-primary/20 bg-white/50 backdrop-blur-md hover:border-primary/50 transition-all duration-500 hover-lift shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 flex flex-col h-full relative z-10">
              <div className="mb-4 p-3 bg-primary/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                <BookOpen className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-dark">Créer une histoire</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Générez des histoires uniques adaptées aux besoins spécifiques de votre enfant
              </p>
              <Button 
                onClick={() => handleViewChange("create")}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Univers des enfants */}
          <Card className="group relative overflow-hidden border border-secondary/20 bg-white/50 backdrop-blur-md hover:border-secondary/50 transition-all duration-500 hover-lift shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 flex flex-col h-full relative z-10">
              <div className="mb-4 p-3 bg-secondary/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-secondary/30 transition-all duration-300">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-secondary-dark">Univers des enfants</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Gérez les profils et préférences de vos enfants pour une expérience personnalisée
              </p>
              <Button 
                onClick={() => handleViewChange("profiles")}
                className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Explorer
              </Button>
            </CardContent>
          </Card>

          {/* Bibliothèque */}
          <Card className="group relative overflow-hidden border border-accent/20 bg-white/50 backdrop-blur-md hover:border-accent/50 transition-all duration-500 hover-lift shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 flex flex-col h-full relative z-10">
              <div className="mb-4 p-3 bg-accent/20 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/30 transition-all duration-300">
                <Library className="h-6 w-6 text-accent-dark" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-accent-dark">Bibliothèque</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Retrouvez toutes vos histoires et accédez à du contenu inspirant pour vos enfants
              </p>
              <Button 
                onClick={() => handleViewChange("library")}
                className="w-full bg-accent hover:bg-accent-dark text-accent-foreground group-hover:translate-y-0 translate-y-1 transition-all duration-300"
              >
                Consulter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer element with subtle design */}
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
