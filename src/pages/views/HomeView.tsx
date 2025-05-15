
import React from 'react';
import { Link } from 'react-router-dom';
import HomeHero from '@/components/home/HomeHero';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const HomeView = () => {
  return (
    <div className="px-4 py-8">
      <HomeHero />
      
      <div className="max-w-5xl mx-auto mt-10 flex flex-col items-center">
        <div className="grid gap-8 w-full max-w-4xl">
          {/* Bouton de création d'histoire simplifiée */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-muted hover:shadow-xl transition-all">
            <h2 className="text-xl font-bold mb-2 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
              Mode simple
            </h2>
            <p className="text-muted-foreground mb-4">
              Créez une histoire en utilisant notre nouveau mode simplifié et robuste, conçu pour contourner les problèmes techniques.
            </p>
            <Link to="/create-story-simple">
              <Button className="w-full sm:w-auto" variant="default">
                Créer une histoire (mode simplifié)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
