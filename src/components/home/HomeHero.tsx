import React from "react";
import { BookOpen, Users, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";

interface HomeHeroProps {
  children?: Child[];
}

const HomeHero: React.FC<HomeHeroProps> = ({ children = [] }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  const handleLibraryClick = () => navigate("/library");
  const handleTitleStoryClick = () => navigate("/create-story/step-1");

  const tiles = [
    {
      key: "create",
      icon: BookOpen,
      title: "Créer une histoire",
      desc: "Choisissez parmi 3 titres générés",
      cta: "Commencer",
      onClick: handleTitleStoryClick,
      primary: true,
    },
    {
      key: "children",
      icon: Users,
      title: "Univers des enfants",
      desc: "Gérez les profils de vos enfants",
      cta: "Explorer",
      to: "/children",
    },
    {
      key: "library",
      icon: Library,
      title: "Bibliothèque",
      desc: "Retrouvez vos histoires créées",
      cta: "Consulter",
      onClick: handleLibraryClick,
    },
  ];

  return (
    <div className="relative flex flex-col w-full flex-1 min-h-[calc(100dvh-5rem)] md:min-h-screen animate-fade-in px-3 py-2">
      {/* Halos d'ambiance */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary-soft/30 blur-3xl animate-drift" />
        <div className="absolute bottom-10 -right-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl animate-drift" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-6xl mx-auto w-full h-full flex flex-col z-10 justify-between">
        {/* Header */}
        <header className="text-center space-y-2 flex-shrink-0 pt-3 pb-2 animate-fade-up-slow">
          <div className="inline-flex items-center justify-center">
            <div className="rounded-full bg-primary-soft/30 backdrop-blur-sm border border-primary-soft/40 px-3 py-1">
              <span className="text-[11px] font-medium text-primary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Histoires personnalisées
              </span>
            </div>
          </div>

          <h1 className="font-display italic text-2xl sm:text-4xl md:text-5xl tracking-tight text-foreground leading-[1.15]">
            Bienvenue sur Calmi
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto px-2 leading-snug">
            Créez des histoires personnalisées pour accompagner vos enfants
          </p>
        </header>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 md:gap-6 flex-1 min-h-0 pb-14 md:pb-4 mt-3">
          {tiles.map((tile, i) => {
            const Inner = (
              <Card
                variant={tile.primary ? "elevated" : "default"}
                className="h-full group hover:-translate-y-0.5 hover:shadow-floating transition-all duration-400 ease-calm animate-fade-up-slow"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center h-full justify-between gap-3">
                  <div className="flex flex-col items-center space-y-2 flex-grow">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-400 ease-calm group-hover:scale-105 ${tile.primary ? "bg-primary/15 shadow-glow-primary" : "bg-primary-soft/25"}`}>
                      <tile.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-display italic text-base sm:text-lg text-card-foreground leading-tight">
                      {tile.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-snug max-w-[22ch]">
                      {tile.desc}
                    </p>
                  </div>
                  <Button
                    variant={tile.primary ? "glow" : "calm"}
                    onClick={tile.onClick}
                    className="w-full h-10 sm:h-11 text-sm"
                  >
                    {tile.cta}
                  </Button>
                </CardContent>
              </Card>
            );
            return tile.to ? (
              <Link to={tile.to} key={tile.key} className="block h-full">
                {Inner}
              </Link>
            ) : (
              <div key={tile.key} className="h-full">
                {Inner}
              </div>
            );
          })}
        </div>

        <div className="text-center flex-shrink-0 pb-1">
          <p className="text-[11px] text-muted-foreground/70">Histoires personnalisées pour le bien-être des enfants</p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
