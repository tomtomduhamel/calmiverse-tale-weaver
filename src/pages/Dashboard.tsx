import React from 'react';
import { MilkyWayBackground } from '@/components/dashboard/MilkyWayBackground';
import { StreakIndicator } from '@/components/dashboard/StreakIndicator';
import { ConstellationWidget } from '@/components/dashboard/ConstellationWidget';
import { StarLogbook } from '@/components/dashboard/StarLogbook';
import { useReadingStats } from '@/hooks/dashboard/useReadingStats';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useReadingStats();
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
    <MilkyWayBackground>
      {/* Header */}
      <div className="text-center animate-fade-in mb-8 relative z-20">
        <div className="flex justify-center items-center mb-3">
          <Sparkles className="w-8 h-8 text-blue-500 dark:text-yellow-300 mr-2 animate-pulse" />
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-600 dark:from-white dark:to-primary/50 pb-1">
            Mon Ciel
          </h1>
          <Sparkles className="w-8 h-8 text-blue-500 dark:text-yellow-300 ml-2 animate-pulse delay-150" />
        </div>
        <p className="text-lg md:text-xl font-medium text-foreground/80 dark:text-white/90 max-w-2xl mx-auto">
          Ton univers s'épanouit à chaque histoire. Découvre tes constellations !
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary/70 mb-4" />
          <p className="text-foreground/70 dark:text-primary-foreground/70 animate-pulse">Observation des étoiles en cours...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full max-w-5xl mx-auto relative z-20 animate-fade-in [animation-delay:200ms] opacity-0" style={{ animationFillMode: 'forwards' }}>
          
          {/* Colonne Gauche (Série & Stats Rapides) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <StreakIndicator currentStreak={stats.currentStreak} />
            
            {/* Call to action si aucune histoire lue */}
            {stats.totalReads === 0 && (
              <div className="p-6 rounded-2xl bg-primary/20 backdrop-blur-md border border-primary/30 text-center">
                <p className="text-primary-foreground mb-4">
                  Prêt à allumer ta première étoile ?
                </p>
                <Button 
                  onClick={() => navigate('/library')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Aller à la bibliothèque
                </Button>
              </div>
            )}
            
            {/* Optional extra stats block, e.g total reads */}
            {stats.totalReads > 0 && (
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-soft text-center flex flex-col items-center justify-center gap-2">
                <span className="text-3xl font-bold text-secondary">{stats.totalReads}</span>
                <span className="text-sm opacity-80">Histoires explorées au total</span>
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
          <div className="md:col-span-3 h-[250px] mb-6 md:mb-0">
            <StarLogbook recentReads={stats.recentReads} />
          </div>

        </div>
      )}
    </MilkyWayBackground>
  );
};

export default Dashboard;
