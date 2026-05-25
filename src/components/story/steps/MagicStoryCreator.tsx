import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { useStoryObjectives } from '@/hooks/useStoryObjectives';
import { useToast } from '@/hooks/use-toast';
import { useStoryRoutines } from '@/hooks/useStoryRoutines';
import { MagicChildrenDrawer } from './MagicChildrenDrawer';
import { MagicObjectiveDrawer } from './MagicObjectiveDrawer';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, CalendarClock, Lock, Loader2 } from 'lucide-react';
import type { Child } from '@/types/child';

interface MagicStoryCreatorProps {
  childrenList: Child[];
  preSelectedChildId?: string;
}

const DAY_OPTIONS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 7 },
];

const MagicStoryCreator: React.FC<MagicStoryCreatorProps> = ({ childrenList, preSelectedChildId }) => {
  const {
    selectedChildrenIds,
    updateSelectedChildren,
    selectedObjective,
    updateSelectedObjective,
    hasPersistedSession
  } = useTitleGeneration();

  const { objectives } = useStoryObjectives();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Routines
  const { createRoutine, hasAutoCreation, checkingAccess } = useStoryRoutines();
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleTime, setScheduleTime] = useState('20:30');
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  const [isChildrenDrawerOpen, setIsChildrenDrawerOpen] = useState(false);
  const [isObjectiveDrawerOpen, setIsObjectiveDrawerOpen] = useState(false);

  // Présélection si spécifié
  useEffect(() => {
    if (preSelectedChildId && childrenList.length > 0 && !hasPersistedSession()) {
      const childExists = childrenList.find(c => c.id === preSelectedChildId);
      if (childExists && !selectedChildrenIds.includes(preSelectedChildId)) {
        updateSelectedChildren([preSelectedChildId]);
      }
    }
  }, [preSelectedChildId, childrenList, hasPersistedSession, selectedChildrenIds, updateSelectedChildren]);

  const getSelectedChildrenText = () => {
    if (selectedChildrenIds.length === 0) return 'Choisir les personnages';
    if (selectedChildrenIds.length === 1) {
      const child = childrenList.find(c => c.id === selectedChildrenIds[0]);
      return child ? child.name : '1 personnage';
    }
    if (selectedChildrenIds.length === 2) {
      const child1 = childrenList.find(c => c.id === selectedChildrenIds[0]);
      const child2 = childrenList.find(c => c.id === selectedChildrenIds[1]);
      return `${child1?.name} et ${child2?.name}`;
    }
    const firstChild = childrenList.find(c => c.id === selectedChildrenIds[0]);
    const remainingCount = selectedChildrenIds.length - 1;
    return `${firstChild?.name} et ${remainingCount} autre${remainingCount > 1 ? 's' : ''}`;
  };

  const getSelectedObjectiveText = () => {
    if (!selectedObjective) return 'Choisir un objectif';
    const obj = objectives.find(o => o.id === selectedObjective);
    return obj ? obj.label.toLowerCase() : 'Choisir un objectif';
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleScheduleToggle = (checked: boolean) => {
    if (checked && hasAutoCreation === false) {
      navigate('/app/subscription');
      return;
    }
    setScheduleEnabled(checked);
  };

  const selectedChildrenCount = selectedChildrenIds.length;
  const isReady = selectedChildrenCount > 0 && selectedObjective;

  const handleContinue = async () => {
    if (!isReady) return;

    // Créer la routine si le toggle est activé
    if (scheduleEnabled && scheduleDays.length > 0) {
      setCreatingRoutine(true);
      try {
        await createRoutine({
          mode: 'guided',
          objective: selectedObjective!,
          child_ids: selectedChildrenIds,
          schedule_type: 'weekly',
          days_of_week: scheduleDays,
          time_of_day: scheduleTime,
          duration_minutes: 10,
          timezone: 'Europe/Paris',
          is_active: true,
        });
        toast({
          title: '🎉 Routine créée !',
          description: `${scheduleDays.length} jour(s)/semaine à ${scheduleTime} — histoires automatiques activées.`,
        });
      } catch {
        toast({
          title: 'Routine non créée',
          description: 'Une erreur est survenue. Réessayez depuis Gérer mes routines.',
          variant: 'destructive',
        });
      } finally {
        setCreatingRoutine(false);
      }
    }

    navigate('/create-story-titles');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-vh-[70vh] px-4 py-8">

      {/* Carte principale — phrase magique */}
      <div className="w-full max-w-2xl bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/50 backdrop-blur-sm transition-all duration-500 hover:shadow-md">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.4] md:leading-[1.4] text-center text-foreground/90">
          Laissons Calmi préparer une histoire avec{' '}

          <button
            onClick={() => setIsChildrenDrawerOpen(true)}
            className={`
              inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl md:rounded-full
              font-bold text-2xl md:text-4xl lg:text-5xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95
              border-b-4 border-transparent
              ${selectedChildrenCount > 0
                ? 'text-primary bg-primary/10 hover:bg-primary/15'
                : 'text-muted-foreground bg-muted hover:bg-muted/80 border-dashed border-b-muted-foreground/30'}
            `}
          >
            {getSelectedChildrenText()}
            <ChevronDown className={`w-5 h-5 md:w-8 md:h-8 ${selectedChildrenCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>

          {' '}pour créer un beau moment et{' '}

          <button
            onClick={() => setIsObjectiveDrawerOpen(true)}
            className={`
              inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl md:rounded-full
              font-bold text-2xl md:text-4xl lg:text-5xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95
              border-b-4 border-transparent
              ${selectedObjective
                ? 'text-primary bg-primary-soft/15 hover:bg-primary-soft/25'
                : 'text-muted-foreground bg-muted hover:bg-muted/80 border-dashed border-b-muted-foreground/30'}
            `}
          >
            {getSelectedObjectiveText()}
            <ChevronDown className={`w-5 h-5 md:w-8 md:h-8 ${selectedObjective ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
          .
        </h1>

        {/* Bouton de validation */}
        <div className={`mt-12 flex justify-center transition-all duration-700 ease-out transform ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <Button
            size="lg"
            variant="glow"
            onClick={handleContinue}
            disabled={creatingRoutine}
            className="rounded-full px-8 py-6 text-lg font-semibold hover:-translate-y-1 transition-all group"
          >
            {creatingRoutine ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Création en cours…</>
            ) : scheduleEnabled ? (
              <><Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />Créer + Planifier</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2 text-primary-foreground/90 group-hover:rotate-12 transition-transform" />Création des 3 titres</>
            )}
          </Button>
        </div>
      </div>

      {/* ── Toggle "Répéter automatiquement" ───────────────────────────────── */}
      <div className={`w-full max-w-2xl mt-4 transition-all duration-500 ${isReady ? 'opacity-100' : 'opacity-50'}`}>
        <div className="bg-card rounded-2xl border border-border/50 px-6 py-4 space-y-4">

          {/* En-tête du toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Répéter automatiquement</span>
              {!checkingAccess && hasAutoCreation === false && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  <Lock className="h-3 w-3" />
                  Calmix
                </span>
              )}
            </div>
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={handleScheduleToggle}
              disabled={checkingAccess}
              aria-label="Activer la répétition automatique"
            />
          </div>

          {/* Panneau de planification */}
          {scheduleEnabled && (
            <div className="space-y-5 pt-3 border-t border-border/50 animate-fade-in">
              {/* Jours */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Jours de la semaine
                </p>
                <div className="flex gap-2">
                  {DAY_OPTIONS.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-9 h-9 rounded-full text-xs font-semibold transition-all duration-200 ${
                        scheduleDays.includes(day.value)
                          ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      aria-pressed={scheduleDays.includes(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {scheduleDays.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ~{Math.ceil(scheduleDays.length * 4.33)} histoires/mois
                  </p>
                )}
              </div>

              {/* Heure */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Heure
                </p>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="p-2 border border-border rounded-lg bg-background text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lien discret vers la gestion */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => navigate('/app/routines')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-2"
          >
            Gérer mes routines existantes
          </button>
        </div>
      </div>

      <MagicChildrenDrawer
        open={isChildrenDrawerOpen}
        onOpenChange={setIsChildrenDrawerOpen}
        children={childrenList}
        selectedChildrenIds={selectedChildrenIds}
        onToggleChild={(id) => {
          const newSelection = selectedChildrenIds.includes(id)
            ? selectedChildrenIds.filter(cId => cId !== id)
            : [...selectedChildrenIds, id];
          updateSelectedChildren(newSelection);
        }}
      />

      <MagicObjectiveDrawer
        open={isObjectiveDrawerOpen}
        onOpenChange={setIsObjectiveDrawerOpen}
        objectives={objectives}
        selectedObjective={selectedObjective}
        onSelectObjective={updateSelectedObjective}
      />
    </div>
  );
};

export default MagicStoryCreator;
