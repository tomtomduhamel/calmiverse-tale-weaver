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
import { 
  Sparkles, 
  ChevronDown, 
  CalendarClock, 
  Lock, 
  Loader2, 
  Moon, 
  Users, 
  User, 
  Smile, 
  Focus, 
  Coffee, 
  Compass, 
  Clock
} from 'lucide-react';
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

export const getObjectiveIcon = (id?: string) => {
  switch (id) {
    case 'sleep':
      return <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />;
    case 'focus':
      return <Focus className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    case 'relax':
      return <Coffee className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
    case 'fun':
      return <Smile className="w-4 h-4 md:w-5 md:h-5 text-rose-500 dark:text-rose-400 shrink-0" />;
    default:
      return <Compass className="w-4 h-4 md:w-5 md:h-5 text-primary/70 shrink-0" />;
  }
};

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
    if (selectedChildrenIds.length === 0) return 'choisir les héros';
    if (selectedChildrenIds.length === 1) {
      const child = childrenList.find(c => c.id === selectedChildrenIds[0]);
      return child ? child.name : '1 héros';
    }
    if (selectedChildrenIds.length === 2) {
      const child1 = childrenList.find(c => c.id === selectedChildrenIds[0]);
      const child2 = childrenList.find(c => c.id === selectedChildrenIds[1]);
      return `${child1?.name} & ${child2?.name}`;
    }
    const firstChild = childrenList.find(c => c.id === selectedChildrenIds[0]);
    const remainingCount = selectedChildrenIds.length - 1;
    return `${firstChild?.name} + ${remainingCount} héros`;
  };

  const getSelectedObjectiveText = () => {
    if (!selectedObjective) return "l'intention du soir";
    const obj = objectives.find(o => o.id === selectedObjective);
    return obj ? obj.label.toLowerCase() : "l'intention du soir";
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
  const isReady = selectedChildrenCount > 0 && !!selectedObjective;

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
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8 space-y-6">

      {/* ── CARTE PRINCIPALE NARRATIVE ───────────────────────── */}
      <div className="relative w-full overflow-hidden bg-card/95 dark:bg-card/85 backdrop-blur-md rounded-3xl p-6 sm:p-10 md:p-12 shadow-floating border border-primary/20 transition-all duration-500">
        
        {/* Phrase narrative en typographie éditoriale */}
        <div className="text-center font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] text-foreground/90 leading-[1.8] sm:leading-[1.8] md:leading-[1.85]">
          <span>Ce soir, Calmi imagine une douce histoire avec </span>

          {/* Capsule Héros */}
          <button
            type="button"
            onClick={() => setIsChildrenDrawerOpen(true)}
            aria-label="Choisir les héros"
            className={`
              inline-flex items-center gap-2 align-baseline my-1 mx-1 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl md:rounded-full
              font-sans font-semibold text-lg sm:text-2xl md:text-3xl tracking-tight transition-all duration-300 transform hover:scale-[1.03] active:scale-95
              shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40
              ${selectedChildrenCount > 0
                ? 'bg-gradient-to-r from-primary/15 via-primary-soft/20 to-primary/10 text-primary border border-primary/40 hover:border-primary/60 shadow-glow-primary/20'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground border-2 border-dashed border-primary/30 hover:border-primary/50'}
            `}
          >
            {selectedChildrenCount > 1 ? (
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedChildrenCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            ) : (
              <User className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedChildrenCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
            <span className="truncate max-w-[200px] sm:max-w-none">{getSelectedChildrenText()}</span>
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 opacity-70 transition-transform ${isChildrenDrawerOpen ? 'rotate-180' : ''}`} />
          </button>

          <span> pour </span>

          {/* Capsule Objectif */}
          <button
            type="button"
            onClick={() => setIsObjectiveDrawerOpen(true)}
            aria-label="Choisir un objectif"
            className={`
              inline-flex items-center gap-2 align-baseline my-1 mx-1 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl md:rounded-full
              font-sans font-semibold text-lg sm:text-2xl md:text-3xl tracking-tight transition-all duration-300 transform hover:scale-[1.03] active:scale-95
              shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40
              ${selectedObjective
                ? 'bg-gradient-to-r from-accent/25 via-primary-soft/25 to-accent/15 text-foreground border border-primary/40 hover:border-primary/60 shadow-glow-primary/20'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground border-2 border-dashed border-primary/30 hover:border-primary/50'}
            `}
          >
            {getObjectiveIcon(selectedObjective)}
            <span className="truncate max-w-[200px] sm:max-w-none">{getSelectedObjectiveText()}</span>
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 opacity-70 transition-transform ${isObjectiveDrawerOpen ? 'rotate-180' : ''}`} />
          </button>

          <span>.</span>
        </div>

        {/* Bouton de validation d'action */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center">
          <Button
            size="lg"
            variant={isReady ? "glow" : "outline"}
            onClick={isReady ? handleContinue : undefined}
            disabled={!isReady || creatingRoutine}
            className={`
              rounded-full px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold transition-all duration-400 group
              ${isReady 
                ? 'shadow-glow-primary hover:-translate-y-1 scale-100 opacity-100 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed border-dashed'}
            `}
          >
            {creatingRoutine ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Préparation du conte…
              </>
            ) : scheduleEnabled ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Créer & Enregistrer le rituel
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2 text-primary-foreground group-hover:rotate-12 transition-transform" />
                {isReady ? 'Découvrir les 3 titres magiques' : 'Complétez la phrase ci-dessus'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── RITUEL DU SOIR / RÉPÉTITION AUTOMATIQUE ────────────────────────── */}
      <div className="w-full transition-all duration-400">
        <div className="bg-card/90 rounded-2xl border border-border/60 p-4 sm:p-5 shadow-soft space-y-4">

          {/* En-tête du rituel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Rituel du coucher</span>
                  {!checkingAccess && hasAutoCreation === false && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      <Lock className="h-3 w-3" />
                      Calmix
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Créer automatiquement cette histoire chaque semaine</p>
              </div>
            </div>
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={handleScheduleToggle}
              disabled={checkingAccess}
              aria-label="Activer le rituel du coucher"
            />
          </div>

          {/* Panneau de configuration du rituel */}
          {scheduleEnabled && (
            <div className="space-y-4 pt-3 border-t border-border/50 animate-fade-in">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Jours de l'histoire
                  </span>
                  {scheduleDays.length > 0 && (
                    <span className="text-xs font-medium text-primary">
                      {scheduleDays.length} jour{scheduleDays.length > 1 ? 's' : ''}/semaine
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  {DAY_OPTIONS.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all duration-200 ${
                        scheduleDays.includes(day.value)
                          ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                      aria-pressed={scheduleDays.includes(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  Heure du conte
                </div>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-xl bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lien discret */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => navigate('/app/routines')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
          >
            Gérer mes rituels et routines existantes
          </button>
        </div>
      </div>

      {/* Drawers */}
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
