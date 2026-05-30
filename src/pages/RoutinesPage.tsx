import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useStoryRoutines, describeSchedule, StoryRoutine, QuotaCheck } from '@/hooks/useStoryRoutines';
import { FAST_STORIES_REGULATION, FAST_STORIES_RENFORCEMENT, FAST_STORIES_SITUATIONS } from '@/config/fastStoryConfig';
import { useSupabaseChildren } from '@/hooks/useSupabaseChildren';
import { useSupabaseStories } from '@/hooks/stories/useSupabaseStories';
import { useN8nFastStory } from '@/hooks/stories/useN8nFastStory';
import { useN8nTitleGeneration } from '@/hooks/stories/useN8nTitleGeneration';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import {
  Loader2,
  Plus,
  Clock,
  Trash2,
  Pencil,
  Lock,
  CalendarClock,
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  ChevronRight,
  User,
  Heart,
  Volume2,
  AlertCircle
} from 'lucide-react';

// ─── Labels ────────────────────────────────────────────────────────────────────

const ALL_FAST_STORIES = [
  ...FAST_STORIES_REGULATION,
  ...FAST_STORIES_RENFORCEMENT,
  ...(FAST_STORIES_SITUATIONS ?? []),
];

const OBJECTIVE_LABELS: Record<string, string> = {
  sleep: '😴 S\'endormir',
  focus: '🎯 Se concentrer',
  relax: '🌿 Se détendre',
  fun: '🎉 S\'amuser',
};

function getFastLabel(promptKey: string): string {
  const item = ALL_FAST_STORIES.find(s => s.promptKey === promptKey);
  return item ? `${item.icon} ${item.label}` : promptKey;
}

// Helper to check if two dates fall on the same day
const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ─── PremiumGate ───────────────────────────────────────────────────────────────

const PremiumGate: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Fonctionnalité Calmix</h2>
        <p className="text-muted-foreground max-w-sm">
          Les routines automatiques te permettent de programmer la création d'histoires
          sur un calendrier — sans y penser. Disponible à partir du plan Calmix.
        </p>
      </div>
      <ul className="text-sm text-left space-y-2 max-w-xs">
        {[
          '📅 Histoires générées automatiquement',
          '⏰ Planification hebdomadaire ou par intervalle',
          '🎯 Mode guidé ou histoire rapide',
          '📊 Contrôle du quota mensuel',
        ].map(feat => (
          <li key={feat} className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>{feat}</span>
          </li>
        ))}
      </ul>
      <Button onClick={() => navigate('/app/subscription')} size="lg" className="gap-2">
        <Sparkles className="w-4 h-4" />
        Passer au plan Calmix
      </Button>
    </div>
  );
};

// ─── Page principale ───────────────────────────────────────────────────────────

const RoutinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks de routines
  const {
    routines,
    loading: loadingRoutines,
    error: routinesError,
    hasAutoCreation,
    checkingAccess,
    toggleActive,
    deleteRoutine,
    checkQuota,
    refreshRoutines,
  } = useStoryRoutines();

  // Hooks tierces
  const { children, loading: loadingChildren } = useSupabaseChildren();
  const { stories, forceRefresh: refreshStories, isLoading: loadingStories } = useSupabaseStories();
  const { createFastStory, isCreatingStory: isCreatingFast } = useN8nFastStory();
  const { generateTitles, isGeneratingTitles } = useN8nTitleGeneration();
  const { createStoryFromTitle, isCreatingStory: isCreatingGuided } = useN8nStoryFromTitle();

  // États locaux
  const [selectedRoutine, setSelectedRoutine] = useState<StoryRoutine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaCheck | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // 1. Calcul des jours de la semaine courante
  const weekDates = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Dimanche, 1 = Lundi...
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // Distance par rapport à Lundi
    const monday = new Date(now);
    monday.setDate(now.getDate() + distance);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const DAYS = useMemo(() => [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 7, label: 'Dimanche' }
  ], []);

  // 2. Fetch des informations de quota
  const fetchQuotaInfo = useCallback(async () => {
    setLoadingQuota(true);
    try {
      const info = await checkQuota(0);
      setQuotaInfo(info);
    } catch (e) {
      console.error('[RoutinesPage] Erreur fetch quota:', e);
    } finally {
      setLoadingQuota(false);
    }
  }, [checkQuota]);

  useEffect(() => {
    if (hasAutoCreation) {
      fetchQuotaInfo();
    }
  }, [routines, hasAutoCreation, fetchQuotaInfo]);

  // 3. Résolution des prénoms des enfants
  const getChildNames = useCallback((childIds?: string[] | null) => {
    if (!childIds || childIds.length === 0) return 'Tout le monde';
    const names = childIds
      .map(id => children.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) return 'Famille';
    if (names.length <= 2) return names.join(' & ');
    return `${names[0]} +${names.length - 1}`;
  }, [children]);

  // 4. Couleur des capsules de routines
  const getObjectiveColor = (routine: StoryRoutine) => {
    if (!routine.is_active) {
      return 'bg-muted border-muted-foreground/20 text-muted-foreground opacity-60';
    }
    if (routine.mode === 'fast') {
      return 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900/50 dark:text-sky-300';
    }
    switch (routine.objective) {
      case 'sleep':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-300';
      case 'focus':
        return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300';
      case 'relax':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300';
      case 'fun':
        return 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-300';
      default:
        return 'bg-primary-soft/10 border-primary-soft/20 text-primary dark:bg-primary-soft/5 dark:border-primary-soft/10 dark:text-primary-soft';
    }
  };

  // 5. Associer les routines à un jour donné
  const getRoutinesForDay = useCallback((dayValue: number, date: Date) => {
    return routines.filter(routine => {
      // Weekly schedule matching
      if (routine.schedule_type === 'weekly') {
        return routine.days_of_week?.includes(dayValue);
      }
      // Interval schedule matching next run date
      if (routine.schedule_type === 'interval' && routine.next_run_at) {
        return isSameDay(new Date(routine.next_run_at), date);
      }
      return false;
    }).sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
  }, [routines]);

  // 6. Action rapide Switch (Actif/Pause)
  const handleToggle = async (id: string, active: boolean) => {
    setTogglingId(id);
    try {
      await toggleActive(id, active);
      toast({
        title: active ? 'Routine activée ⏰' : 'Routine en pause ⏸️',
        description: active ? 'Elle se déclenchera selon le planning.' : 'Elle n\'émettra plus d\'histoires jusqu\'à sa réactivation.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // 7. Suppression confirmée
  const handleConfirmDelete = async () => {
    if (!routineToDelete) return;
    setDeleting(true);
    try {
      await deleteRoutine(routineToDelete);
      toast({ title: 'Routine supprimée' });
      setSelectedRoutine(null);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la routine.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setRoutineToDelete(null);
    }
  };

  // 8. Lancement manuel immédiat ("Lancer maintenant")
  const triggerManualRoutine = async (routine: StoryRoutine) => {
    setTriggeringId(routine.id);
    try {
      // Vérification du quota existant
      const quotaCheck = await checkQuota(0);
      if (quotaCheck && !quotaCheck.allowed) {
        toast({
          title: 'Quota mensuel atteint ⚠️',
          description: 'Votre forfait Calmix ne dispose plus de quotas d\'histoires libres.',
          variant: 'destructive',
        });
        return;
      }

      if (routine.mode === 'fast') {
        toast({
          title: 'Génération de l\'histoire rapide commencée 🚀',
          description: 'Nous préparons le contenu, cela prend environ une minute.',
        });
        
        await createFastStory({
          promptKey: routine.fast_story_prompt_key!,
          durationMinutes: routine.duration_minutes as any,
          generateVideo: routine.generate_video,
        });

        toast({
          title: 'Création terminée ! 🎉',
          description: 'Votre histoire rapide a été ajoutée à votre bibliothèque.',
        });
      } else {
        toast({
          title: 'Lancement de la routine guidée... 🪄',
          description: 'Génération automatique du titre en cours...',
        });

        // Récupérer les détails des enfants
        const childrenNames = children
          .filter(c => routine.child_ids?.includes(c.id))
          .map(c => c.name);
        const childrenGenders = children
          .filter(c => routine.child_ids?.includes(c.id))
          .map(c => c.gender || 'unknown');

        // Générer le titre
        const titles = await generateTitles({
          objective: routine.objective!,
          childrenIds: routine.child_ids || [],
          childrenNames,
          childrenGenders,
        });

        if (!titles || titles.length === 0) {
          throw new Error('Aucun titre n\'a pu être généré.');
        }

        const chosenTitle = titles[0].title;

        toast({
          title: 'Titre généré : ' + chosenTitle,
          description: 'Génération de l\'histoire complète en cours...',
        });

        // Générer l'histoire à partir de ce titre
        await createStoryFromTitle({
          selectedTitle: chosenTitle,
          objective: routine.objective!,
          childrenIds: routine.child_ids || [],
          childrenNames,
          childrenGenders,
          durationMinutes: routine.duration_minutes as any,
          generateVideo: routine.generate_video,
        });

        toast({
          title: 'Histoire générée avec succès ! 🎉',
          description: `"${chosenTitle}" est maintenant disponible dans votre bibliothèque.`,
        });
      }

      // Re-fetch stories et routines pour mettre à jour la bibliothèque
      refreshStories();
      refreshRoutines();
      setSelectedRoutine(null);

    } catch (err: any) {
      console.error('[RoutinesPage] Erreur trigger manuel:', err);
      toast({
        title: 'Échec de génération',
        description: err.message || 'Une erreur s\'est produite lors de la génération.',
        variant: 'destructive',
      });
    } finally {
      setTriggeringId(null);
    }
  };

  // 9. Filtrer les histoires générées récemment pour le journal d'activité
  const recentStories = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    return [...stories]
      .sort((a, b) => {
        const d1 = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const d2 = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return d2 - d1;
      })
      .slice(0, 4);
  }, [stories]);

  // Quota percentage progress calcul
  const quotaPercentage = useMemo(() => {
    if (!quotaInfo || quotaInfo.limit === 0) return 0;
    return Math.min(100, Math.round((quotaInfo.existing / quotaInfo.limit) * 100));
  }, [quotaInfo]);

  // ── Chargement accès ────────────────────────────────────────────────────────
  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Gate premium ────────────────────────────────────────────────────────────
  if (hasAutoCreation === false) {
    return <PremiumGate />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      
      {/* ─── EN-TÊTE DE LA PAGE ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Routines & Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Organisez et planifiez les moments d'histoires automatiques de vos enfants.
          </p>
        </div>
        <Button onClick={() => navigate('/app/routines/new')} className="gap-2 self-start sm:self-auto shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvelle routine
        </Button>
      </div>

      {routinesError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{routinesError}</span>
          </CardContent>
        </Card>
      )}

      {/* ─── SECTION 1 : TIME PLANNER (AGENDA HEBDOMADAIRE) 📅 ──────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Time Planner Hebdomadaire
          </h2>
          <Badge variant="secondary" className="font-normal text-xs">
            Semaine courante
          </Badge>
        </div>

        {loadingRoutines ? (
          <div className="flex items-center justify-center h-64 bg-muted/20 border rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : routines.length === 0 ? (
          <Card className="border-dashed bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarClock className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aucune routine programmée pour le moment</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Créez votre première routine automatique pour voir s'afficher l'agenda de la semaine.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/app/routines/new')} className="gap-2">
                <Plus className="w-4 h-4" />
                Planifier ma première routine
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* La grille de l'agenda hebdomadaire */
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS.map((day, index) => {
              const date = weekDates[index];
              const isToday = isSameDay(new Date(), date);
              const dayRoutines = getRoutinesForDay(day.value, date);

              // Formater l'en-tête du jour
              const dayName = day.label.slice(0, 3); // Lun, Mar...
              const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={day.value}
                  className={`flex flex-col border rounded-xl min-h-[180px] bg-background/50 backdrop-blur-sm transition-all shadow-sm ${
                    isToday
                      ? 'ring-2 ring-primary border-transparent dark:ring-primary/80 bg-primary/5'
                      : 'hover:border-foreground/20'
                  }`}
                >
                  {/* Jour Header */}
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between text-xs font-semibold rounded-t-xl ${
                      isToday ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <span>{dayName}</span>
                    <span className="font-normal">{formattedDate}</span>
                    {isToday && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full shadow-sm font-semibold tracking-wider uppercase">
                        Aujourd'hui
                      </span>
                    )}
                  </div>

                  {/* Corps du Jour (Capsules) */}
                  <div className="p-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[250px]">
                    {dayRoutines.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-6">
                        <span className="text-[10px] text-muted-foreground/40 italic">Calme</span>
                      </div>
                    ) : (
                      dayRoutines.map(routine => {
                        const timeStr = routine.time_of_day.split(':').slice(0, 2).join('h');
                        const isPaused = !routine.is_active;

                        return (
                          <button
                            key={routine.id}
                            onClick={() => setSelectedRoutine(routine)}
                            disabled={triggeringId === routine.id}
                            className={`w-full text-left p-2 rounded-lg border text-xs font-medium transition-all shadow-sm ${getObjectiveColor(
                              routine
                            )} hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-1 relative overflow-hidden`}
                          >
                            {/* Loader discret en cas de trigger */}
                            {triggeringId === routine.id && (
                              <div className="absolute inset-0 bg-background/80 dark:bg-background/90 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              </div>
                            )}

                            {/* Heure et mode */}
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                {timeStr}
                              </span>
                              {routine.generate_video && (
                                <span className="text-[9px] bg-foreground/5 text-foreground/70 px-1 rounded">
                                  🎬 Vidéo
                                </span>
                              )}
                            </div>

                            {/* Thématique ou Nom rapide */}
                            <p className="truncate font-semibold text-[11px] leading-tight">
                              {routine.mode === 'guided'
                                ? OBJECTIVE_LABELS[routine.objective ?? ''] || routine.objective
                                : getFastLabel(routine.fast_story_prompt_key ?? '')}
                            </p>

                            {/* Enfant(s) ciblé(s) */}
                            <span className="text-[9px] text-muted-foreground truncate block mt-0.5 flex items-center gap-1 font-normal">
                              <User className="w-2 h-2 flex-shrink-0" />
                              {getChildNames(routine.child_ids)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── SECTIONS INFERIEURES DOUBLE COLONNE (ANALYTICS & LATEST STORIES) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── SECTION 2 : DASHBOARD / ANALYTICS DE QUOTAS (5 colonnes) 📊 ─── */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Consommation & Quotas
          </h2>

          <Card className="shadow-md bg-gradient-to-br from-background via-background to-muted/10 border-primary-soft/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Projection de routines actives</CardTitle>
              <CardDescription className="text-xs">
                Vérifiez que vos routines rentrent bien dans votre forfait Calmix mensuel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {loadingQuota ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : quotaInfo ? (
                <div className="space-y-4">
                  {/* Jauge linéaire de quota */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Volume mensuel projeté</span>
                      <span className="font-semibold text-primary">
                        {quotaInfo.existing} / {quotaInfo.limit} histoires
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          quotaPercentage > 85
                            ? 'bg-destructive'
                            : quotaPercentage > 60
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${quotaPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <span>{quotaPercentage}% planifié</span>
                      <span>{quotaInfo.limit - quotaInfo.existing} libres</span>
                    </div>
                  </div>

                  {/* Alerte si proche du quota */}
                  {quotaPercentage >= 85 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Quota presque saturé</span>
                        <p className="mt-0.5">Vos routines occupent la quasi-totalité de votre forfait. Désactivez des jours ou réduisez les fréquences si nécessaire.</p>
                      </div>
                    </div>
                  )}

                  {/* Statistiques rapides */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 border rounded-xl bg-background/30 text-center space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                        Routines actives
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {routines.filter(r => r.is_active).length}
                      </span>
                    </div>
                    <div className="p-3 border rounded-xl bg-background/30 text-center space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                        Estimation/Mois
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        ~{quotaInfo.existing} histoires
                      </span>
                    </div>
                  </div>

                  {/* Conseils d'optimisation */}
                  <div className="p-3 bg-primary-soft/5 rounded-xl flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p>
                      Une routine programmée sur 3 jours consomme 13 histoires/mois. Les routines automatiques s'exécutent en tâche de fond et vous notifient sur votre appareil dès que l'histoire est prête.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Erreur de chargement des informations de quota.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── SECTION 3 : JOURNAL D'ACTIVITE RECENTS (7 colonnes) 🎧 ──────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Journal d'activité
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/library')}
              className="text-xs text-primary font-medium hover:bg-primary-soft/10 flex items-center gap-1"
            >
              Voir ma bibliothèque
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Card className="shadow-md">
            <CardContent className="p-4 space-y-3">
              {loadingStories ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentStories.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">Aucune histoire trouvée</p>
                  <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                    Dès que vos routines généreront des histoires automatiquement, elles s'afficheront ici.
                  </p>
                </div>
              ) : (
                <div className="divide-y space-y-3">
                  {recentStories.map((story, i) => {
                    const dateStr = new Date(story.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isReady = story.status === 'ready' || story.status === 'read' || story.status === 'completed';
                    const isError = story.status === 'error';
                    const isGenerating = story.status === 'pending' || story.status === 'regenerating';

                    return (
                      <div
                        key={story.id}
                        className={`pt-3 first:pt-0 flex items-start sm:items-center justify-between gap-3 ${
                          i > 0 ? 'mt-3' : ''
                        }`}
                      >
                        {/* Info histoire */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-semibold text-sm truncate pr-2 leading-tight">
                            {story.title || 'Histoire sans titre'}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                              {dateStr}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              🎯 {typeof story.objective === 'object' ? story.objective.name : story.objective}
                            </span>
                          </div>
                        </div>

                        {/* Actions & Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-center">
                          {isReady ? (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50 text-[10px] font-normal"
                              >
                                Prête ✨
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/app/reader/${story.id}`)}
                                className="h-7 px-2.5 text-xs gap-1 border-primary-soft/20 text-primary hover:bg-primary-soft/10 shadow-sm"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Lire</span>
                              </Button>
                            </>
                          ) : isError ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] font-normal"
                            >
                              Échoué ❌
                            </Badge>
                          ) : isGenerating ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                              <span className="hidden sm:inline">Création...</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ─── DIALOG CONTEXTUEL : DETAILS & ACTIONS RAPIDES ─── */}
      <Dialog open={!!selectedRoutine} onOpenChange={open => !open && setSelectedRoutine(null)}>
        <DialogContent className="max-w-[450px]">
          {selectedRoutine && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant={selectedRoutine.mode === 'guided' ? 'default' : 'secondary'} className="text-[10px]">
                    {selectedRoutine.mode === 'guided' ? (
                      <><Sparkles className="w-2.5 h-2.5 mr-1" />Mode guidé</>
                    ) : (
                      <><Zap className="w-2.5 h-2.5 mr-1" />Histoire rapide</>
                    )}
                  </Badge>
                  {!selectedRoutine.is_active && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
                      En pause
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg font-bold">
                  {selectedRoutine.mode === 'guided'
                    ? OBJECTIVE_LABELS[selectedRoutine.objective ?? ''] || selectedRoutine.objective
                    : getFastLabel(selectedRoutine.fast_story_prompt_key ?? '')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Gérez cette routine ou déclenchez-la manuellement à la demande.
                </DialogDescription>
              </DialogHeader>

              {/* Contenu */}
              <div className="space-y-4 my-2 border-y py-4 text-sm">
                
                {/* Programmation horaire */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-normal">Calendrier :</span>
                  <span className="font-semibold flex items-center gap-1.5 text-foreground">
                    <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    {describeSchedule(selectedRoutine)}
                  </span>
                </div>

                {/* Profil(s) ciblés */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-normal">Destinataire(s) :</span>
                  <span className="font-semibold flex items-center gap-1.5 text-foreground truncate max-w-[220px]">
                    <User className="w-4 h-4 text-primary flex-shrink-0" />
                    {getChildNames(selectedRoutine.child_ids)}
                  </span>
                </div>

                {/* Durée de l'histoire */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-normal">Longueur estimée :</span>
                  <span className="font-semibold text-foreground">
                    ⏱️ {selectedRoutine.duration_minutes} minutes de lecture
                  </span>
                </div>

                {/* Vidéo incluse ou non */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-normal">Format multimédia :</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    {selectedRoutine.generate_video ? '🎬 Livre audio + Vidéo animée' : '🎧 Livre audio uniquement'}
                  </span>
                </div>

                {/* Prochaine exécution planifiée */}
                {selectedRoutine.is_active && selectedRoutine.next_run_at && (
                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-dashed">
                    <span className="text-muted-foreground font-normal">Prochain créneau :</span>
                    <span className="font-medium text-primary text-xs">
                      📅 {new Date(selectedRoutine.next_run_at).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {/* Dernière exécution ignorée */}
                {selectedRoutine.last_skip_reason && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg text-xs text-amber-700 dark:text-amber-400 mt-2 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>
                      {selectedRoutine.last_skip_reason === 'quota_exceeded'
                        ? 'Dernier créneau ignoré : Quota d\'histoires mensuel saturé.'
                        : 'Dernier créneau ignoré : Fonctionnalité momentanément indisponible.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Pied de dialogue : Actions */}
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center w-full gap-3">
                {/* Pause/Actif rapide toggle */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Switch
                    checked={selectedRoutine.is_active}
                    disabled={togglingId === selectedRoutine.id}
                    onCheckedChange={checked => handleToggle(selectedRoutine.id, checked)}
                    id="dialog-active-toggle"
                  />
                  <label htmlFor="dialog-active-toggle" className="text-xs font-medium cursor-pointer">
                    {selectedRoutine.is_active ? 'Routine active' : 'Routine en pause'}
                  </label>
                </div>

                {/* Boutons d'édition & suppression & déclencheur manuel */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  
                  {/* Supprimer */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 h-9 w-9"
                    onClick={() => setRoutineToDelete(selectedRoutine.id)}
                    title="Supprimer la routine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Modifier */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-primary-soft/20 text-primary hover:bg-primary-soft/10"
                    onClick={() => navigate(`/app/routines/${selectedRoutine.id}`)}
                    title="Modifier la routine"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  {/* Déclencher maintenant (Action reine) */}
                  <Button
                    onClick={() => triggerManualRoutine(selectedRoutine)}
                    disabled={triggeringId === selectedRoutine.id || isGeneratingTitles || isCreatingFast || isCreatingGuided}
                    className="gap-1.5 shadow-sm font-semibold h-9 px-3"
                  >
                    {triggeringId === selectedRoutine.id || isGeneratingTitles || isCreatingFast || isCreatingGuided ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    Lancer maintenant
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ALERTDIALOG DE CONFIRMATION DE SUPPRESSION ─── */}
      <AlertDialog open={!!routineToDelete} onOpenChange={open => !open && setRoutineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement cette routine ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les planifications automatiques liées à cette routine s'arrêteront immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default RoutinesPage;
