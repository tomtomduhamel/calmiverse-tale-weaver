import React from 'react';
import { MilkyWayBackground } from '@/components/dashboard/MilkyWayBackground';
import { StreakIndicator } from '@/components/dashboard/StreakIndicator';
import { ConstellationWidget } from '@/components/dashboard/ConstellationWidget';
import { StarLogbook } from '@/components/dashboard/StarLogbook';

import { useReadingStats } from '@/hooks/dashboard/useReadingStats';
import { usePendingStoriesRecovery } from '@/hooks/stories/usePendingStoriesRecovery';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useReadingStats();
  usePendingStoriesRecovery();
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="w-full h-full min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-4">Une erreur est survenue lors de l'accès à votre Voie Lactée.</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col items-center animate-fade-in w-full max-w-7xl mx-auto">
      <MilkyWayBackground>
        {/* Header */}
      <div className="text-center animate-fade-up-slow mb-4 sm:mb-8 relative z-20">
        <div className="flex justify-center items-center mb-1 sm:mb-2">
          <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary mr-2 animate-glow-pulse" />
          <h1 className="font-display italic text-2xl sm:text-3xl md:text-5xl text-foreground tracking-tight pb-0.5">
            Mon ciel
          </h1>
          <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary ml-2 animate-glow-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Ton univers s'épanouit à chaque histoire. Découvre tes constellations !
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary/70 mb-4" />
          <p className="text-sm text-muted-foreground animate-pulse">Observation des étoiles en cours...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 flex-1 w-full max-w-5xl mx-auto relative z-20 animate-fade-in [animation-delay:200ms] opacity-0" style={{ animationFillMode: 'forwards' }}>
          
          {/* Colonne Gauche (Série & Stats Rapides en 2 colonnes sur mobile) */}
          <div className="md:col-span-1 grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-6">
            <StreakIndicator currentStreak={stats.currentStreak} />
            
            {/* Call to action si aucune histoire lue */}
            {stats.totalReads === 0 ? (
              <div className="p-3 sm:p-6 rounded-2xl bg-primary-soft/20 backdrop-blur-md border border-primary-soft/30 shadow-soft text-center flex flex-col items-center justify-center">
                <p className="text-xs sm:text-sm text-foreground mb-2">
                  Allume ta 1ère étoile !
                </p>
                <Button 
                  onClick={() => navigate('/library')}
                  variant="glow"
                  size="sm"
                  className="w-full text-xs"
                >
                  Bibliothèque
                </Button>
              </div>
            ) : (
              <div className="p-3 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary-soft/20 shadow-soft text-center flex flex-col items-center justify-center gap-1 sm:gap-2">
                <span className="font-display italic text-2xl sm:text-4xl text-foreground">{stats.totalReads}</span>
                <span className="text-xs text-muted-foreground leading-tight">Histoires explorées</span>
              </div>
            )}
          </div>

          {/* Colonne Centrale (Constellation) */}
          <div className="md:col-span-2 flex flex-col">
            <ConstellationWidget 
              totalReads={stats.totalReads} 
              objectiveStats={stats.objectiveStats} 
            />
          </div>

          {/* Ligne du bas (Carnet Stellaire) sur 3 colonnes de large md */}
          <div className="md:col-span-3 mb-6 md:mb-0">
            <StarLogbook recentReads={stats.recentReads} />
          </div>

        </div>
      )}
      </MilkyWayBackground>
    </div>
  );
};

export default Dashboard;
