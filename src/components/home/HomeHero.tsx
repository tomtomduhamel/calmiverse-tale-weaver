import React from "react";
import { BookOpen, Users, Library, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
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
      desc: "3 titres magiques générés sur-mesure",
      cta: "Commencer",
      onClick: handleTitleStoryClick,
      primary: true,
    },
    {
      key: "children",
      icon: Users,
      title: "Univers des enfants",
      desc: "Gérez les profils et leurs préférences",
      cta: "Explorer",
      to: "/children",
    },
    {
      key: "library",
      icon: Library,
      title: "Bibliothèque",
      desc: "Retrouvez tous vos contes créés",
      cta: "Consulter",
      onClick: handleLibraryClick,
    },
  ];

  return (
    <div className="relative flex flex-col w-full flex-1 min-h-0 justify-between animate-fade-in px-3 sm:px-4 py-2 sm:py-3">
      {/* Halos d'ambiance */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary-soft/25 blur-3xl animate-drift" />
        <div className="absolute bottom-6 -right-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl animate-drift" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-6xl mx-auto w-full h-full flex flex-col z-10 justify-between flex-1 min-h-0">
        {/* Header Compact Mobile / Spacieux Desktop */}
        <header className="text-center space-y-1 sm:space-y-2 flex-shrink-0 pt-1 pb-1 sm:pt-2 sm:pb-3 animate-fade-up-slow">
          <div className="inline-flex items-center justify-center">
            <div className="rounded-full bg-primary-soft/30 backdrop-blur-sm border border-primary-soft/40 px-3 py-0.5 sm:px-3 sm:py-1">
              <span className="text-[11px] sm:text-xs font-medium text-primary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Histoires personnalisées
              </span>
            </div>
          </div>

          <h1 className="font-display italic text-2xl sm:text-4xl md:text-5xl tracking-tight text-foreground leading-tight">
            Bienvenue sur Calmi
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2 leading-snug">
            Créez des histoires personnalisées pour accompagner vos enfants
          </p>
        </header>

        {/* 3 Cartes : format compact sans ellipses sur mobile (<md), colonnes aérées sur desktop (>=md) */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6 flex-1 min-h-0 my-auto justify-center max-w-md md:max-w-none mx-auto w-full">
          {tiles.map((tile, i) => {
            const handleClick = tile.onClick || (() => tile.to && navigate(tile.to));

            return (
              <div
                key={tile.key}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                  }
                }}
                className="group cursor-pointer block h-full flex-1 md:flex-initial"
              >
                <Card
                  variant={tile.primary ? "elevated" : "default"}
                  className={`h-full border transition-all duration-200 ease-out active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-floating animate-fade-up-slow ${
                    tile.primary
                      ? "border-primary-soft/50 bg-gradient-to-br from-card via-card to-primary-soft/10 shadow-glow-primary"
                      : "border-border/70 hover:border-primary-soft/40"
                  }`}
                  style={{ animationDelay: `${100 + i * 60}ms` }}
                >
                  {/* Mobile Layout (< md) : Row compact avec texte intégral et chevron */}
                  <div className="flex md:hidden items-center justify-between p-3.5 gap-3 h-full">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          tile.primary
                            ? "bg-primary/20 text-primary shadow-soft"
                            : "bg-primary-soft/30 text-primary"
                        }`}
                      >
                        <tile.icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h3 className="font-display italic text-base font-semibold text-card-foreground leading-snug">
                          {tile.title}
                        </h3>
                        <p className="text-muted-foreground text-xs leading-normal mt-0.5">
                          {tile.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                        tile.primary
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "bg-primary-soft/30 text-primary"
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Desktop Layout (>= md) : Column spacious */}
                  <CardContent className="hidden md:flex p-5 flex-col items-center text-center h-full justify-between gap-4">
                    <div className="flex flex-col items-center space-y-2.5 flex-grow pt-2">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                          tile.primary
                            ? "bg-primary/20 shadow-glow-primary text-primary"
                            : "bg-primary-soft/25 text-primary"
                        }`}
                      >
                        <tile.icon className="h-6 w-6" strokeWidth={2} />
                      </div>
                      <h3 className="font-display italic text-lg text-card-foreground leading-tight">
                        {tile.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-snug max-w-[24ch]">
                        {tile.desc}
                      </p>
                    </div>
                    <Button
                      variant={tile.primary ? "glow" : "calm"}
                      className="w-full h-11 text-sm font-medium rounded-xl pointer-events-none"
                      tabIndex={-1}
                    >
                      {tile.cta}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Footer info compact */}
        <div className="text-center flex-shrink-0 pt-1 pb-1">
          <p className="text-[11px] text-muted-foreground/70">
            Histoires personnalisées pour le bien-être des enfants
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
