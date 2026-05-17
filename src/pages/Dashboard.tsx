import React from 'react';
import { MilkyWayBackground } from '@/components/dashboard/MilkyWayBackground';
import { StreakIndicator } from '@/components/dashboard/StreakIndicator';
import { ConstellationWidget } from '@/components/dashboard/ConstellationWidget';
import { StarLogbook } from '@/components/dashboard/StarLogbook';
import { SubscriptionPlanCard } from '@/components/dashboard/SubscriptionPlanCard';
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
    <div className="p-4 md:p-8 flex-1 flex flex-col items-center animate-fade-in w-full max-w-7xl mx-auto">
      <MilkyWayBackground>
        {/* Header */}
      <div className="text-center animate-fade-up-slow mb-8 relative z-20">
        <div className="flex justify-center items-center mb-3">
          <Sparkles className="w-7 h-7 text-primary mr-2 animate-glow-pulse" />
          <h1 className="font-display italic text-3xl md:text-5xl text-foreground tracking-tight pb-1">
            Mon ciel
          </h1>
          <Sparkles className="w-7 h-7 text-primary ml-2 animate-glow-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Ton univers s'épanouit à chaque histoire. Découvre tes constellations !
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary/70 mb-4" />
          <p className="text-muted-foreground animate-pulse">Observation des étoiles en cours...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full max-w-5xl mx-auto relative z-20 animate-fade-in [animation-delay:200ms] opacity-0" style={{ animationFillMode: 'forwards' }}>
          
          {/* Colonne Gauche (Série & Stats Rapides) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <StreakIndicator currentStreak={stats.currentStreak} />
            
            {/* Call to action si aucune histoire lue */}
            {stats.totalReads === 0 && (
              <div className="p-6 rounded-2xl bg-primary-soft/20 backdrop-blur-md border border-primary-soft/30 shadow-soft text-center">
                <p className="text-foreground mb-4">
                  Prêt à allumer ta première étoile ?
                </p>
                <Button 
                  onClick={() => navigate('/library')}
                  variant="glow"
                  className="w-full"
                >
                  Aller à la bibliothèque
                </Button>
              </div>
            )}
            
            {/* Optional extra stats block, e.g total reads */}
            {stats.totalReads > 0 && (
              <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary-soft/20 shadow-soft text-center flex flex-col items-center justify-center gap-2">
                <span className="font-display italic text-3xl md:text-4xl text-foreground">{stats.totalReads}</span>
                <span className="text-sm text-muted-foreground">Histoires explorées au total</span>
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
    </div>
  );
};

export default Dashboard;
