import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Clock, Trash2, Pencil, Lock, CalendarClock, Sparkles, Zap } from 'lucide-react';
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
import { useStoryRoutines, describeSchedule, StoryRoutine } from '@/hooks/useStoryRoutines';
import { FAST_STORIES_REGULATION, FAST_STORIES_RENFORCEMENT, FAST_STORIES_SITUATIONS } from '@/config/fastStoryConfig';

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

// ─── RoutineCard ───────────────────────────────────────────────────────────────

interface RoutineCardProps {
  routine: StoryRoutine;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ routine, onToggle, onEdit, onDelete }) => {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    try {
      await onToggle(routine.id, checked);
    } finally {
      setToggling(false);
    }
  };

  const scheduleLabel = describeSchedule(routine);

  const nextRun = routine.next_run_at
    ? new Date(routine.next_run_at).toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card className={`transition-opacity ${!routine.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={routine.mode === 'guided' ? 'default' : 'secondary'} className="text-xs">
                {routine.mode === 'guided' ? (
                  <><Sparkles className="w-3 h-3 mr-1" />Mode guidé</>
                ) : (
                  <><Zap className="w-3 h-3 mr-1" />Histoire rapide</>
                )}
              </Badge>
              {!routine.is_active && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  En pause
                </Badge>
              )}
            </div>

            {/* Thème / objectif */}
            <p className="font-medium text-sm truncate">
              {routine.mode === 'guided'
                ? OBJECTIVE_LABELS[routine.objective ?? ''] ?? routine.objective
                : getFastLabel(routine.fast_story_prompt_key ?? '')}
            </p>

            {/* Horaire */}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{scheduleLabel}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>~{routine.monthly_estimate} hist./mois</span>
            </div>

            {/* Prochaine exécution */}
            {nextRun && routine.is_active && (
              <div className="flex items-center gap-1 mt-1 text-xs text-primary/70">
                <CalendarClock className="w-3 h-3 flex-shrink-0" />
                <span>Prochaine : {nextRun}</span>
              </div>
            )}

            {/* Dernière exécution ignorée */}
            {routine.last_skip_reason && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ {routine.last_skip_reason === 'quota_exceeded'
                  ? 'Dernier déclenchement ignoré : quota atteint'
                  : 'Dernier déclenchement ignoré : fonctionnalité non disponible'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Toggle actif/pause */}
            <Switch
              checked={routine.is_active}
              onCheckedChange={handleToggle}
              disabled={toggling}
              aria-label={routine.is_active ? 'Mettre en pause' : 'Activer'}
            />

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(routine.id)}
                aria-label="Modifier"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(routine.id)}
                aria-label="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const {
    routines,
    loading,
    error,
    hasAutoCreation,
    checkingAccess,
    toggleActive,
    deleteRoutine,
  } = useStoryRoutines();

  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la routine.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!routineToDelete) return;
    setDeleting(true);
    try {
      await deleteRoutine(routineToDelete);
      toast({ title: 'Routine supprimée' });
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
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routines</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Histoires créées automatiquement selon ton planning
          </p>
        </div>
        <Button onClick={() => navigate('/app/routines/new')} className="gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />
          Nouvelle routine
        </Button>
      </div>

      {/* Erreur */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 px-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Chargement */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : routines.length === 0 ? (
        /* État vide */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <CalendarClock className="w-12 h-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">Aucune routine configurée</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Programme la création automatique d'histoires selon ton agenda
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/app/routines/new')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer ma première routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Liste */
        <div className="space-y-3">
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onToggle={handleToggle}
              onEdit={id => navigate(`/app/routines/${id}`)}
              onDelete={id => setRoutineToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Info quota global */}
      {routines.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">
                ~{routines.filter(r => r.is_active).reduce((s, r) => s + r.monthly_estimate, 0)} histoires/mois
              </span>{' '}
              projetées par tes routines actives
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation suppression */}
      <AlertDialog open={!!routineToDelete} onOpenChange={open => !open && setRoutineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette routine ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La routine sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
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
