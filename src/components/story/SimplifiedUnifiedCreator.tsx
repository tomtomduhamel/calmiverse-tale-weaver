
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, CalendarClock, Lock } from "lucide-react";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryBackgroundOperations } from "@/hooks/stories/useStoryBackgroundOperations";
import { useStoryRoutines } from "@/hooks/useStoryRoutines";

interface SimplifiedUnifiedCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

const DAY_OPTIONS = [
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "M", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
  { label: "D", value: 7 },
];

/**
 * Créateur d'histoire simplifié avec toggle "Répéter automatiquement"
 * intégré harmonieusement dans le formulaire principal.
 */
const SimplifiedUnifiedCreator: React.FC<SimplifiedUnifiedCreatorProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const navigate = useNavigate();

  // États principaux
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // État du toggle "Répéter automatiquement"
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleTime, setScheduleTime] = useState("20:30");

  // Hook background
  const { createStoryInBackground, isSubmitting } = useStoryBackgroundOperations();

  // Hook routines (accès premium + création)
  const { createRoutine, hasAutoCreation, checkingAccess } = useStoryRoutines();

  // Objectifs
  const { objectives, isLoading: loadingObjectives } = useStoryObjectives();
  const { toast } = useToast();

  const defaultObjectives = [
    { id: "sleep", label: "s'endormir", value: "sleep" },
    { id: "focus", label: "se concentrer", value: "focus" },
    { id: "relax", label: "se détendre", value: "relax" },
    { id: "fun", label: "s'amuser", value: "fun" },
  ];

  const activeObjectives = objectives || defaultObjectives;

  // Sélection automatique au chargement
  useEffect(() => {
    if (children && children.length > 0 && selectedChildIds.length === 0) {
      setSelectedChildIds([children[0].id]);
    }
    if (activeObjectives && activeObjectives.length > 0 && !selectedObjective) {
      setSelectedObjective(activeObjectives[0].value);
    }
  }, [children, activeObjectives, selectedObjective, selectedChildIds]);

  // Gestionnaires
  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds(prev =>
      prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    );
  };

  const handleObjectiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedObjective(event.target.value);
  };

  const handleOpenCreateChildForm = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La création d'enfant directement depuis cette vue sera implémentée prochainement.",
    });
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleScheduleToggle = (checked: boolean) => {
    // Si pas d'accès premium, rediriger vers l'abonnement
    if (checked && hasAutoCreation === false) {
      navigate("/app/subscription");
      return;
    }
    setScheduleEnabled(checked);
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let validIds = selectedChildIds;
    let validObjective = selectedObjective;

    if (!validIds || validIds.length === 0) {
      if (children && children.length > 0) {
        validIds = [children[0].id];
        setSelectedChildIds(validIds);
      } else {
        setError("Aucun enfant disponible. Veuillez d'abord créer un profil enfant.");
        return;
      }
    }

    if (!validObjective && activeObjectives && activeObjectives.length > 0) {
      validObjective = activeObjectives[0].value;
      setSelectedObjective(validObjective);
    }

    if (scheduleEnabled && scheduleDays.length === 0) {
      setError("Sélectionnez au moins un jour pour la répétition automatique.");
      return;
    }

    try {
      setError(null);

      // 1. Créer l'histoire en background
      const storyId = await createStoryInBackground(
        { childrenIds: validIds, objective: validObjective },
        onSubmit
      );

      const tempStory: Story = {
        id: storyId,
        title: "Histoire en cours de génération",
        preview: "Génération en cours...",
        childrenIds: validIds,
        createdAt: new Date(),
        status: "pending",
        content: "",
        story_summary: "",
        objective: validObjective,
      };
      onStoryCreated(tempStory);

      // 2. Créer la routine si le toggle est activé
      if (scheduleEnabled && scheduleDays.length > 0) {
        try {
          await createRoutine({
            mode: "guided",
            objective: validObjective,
            child_ids: validIds,
            schedule_type: "weekly",
            days_of_week: scheduleDays,
            time_of_day: scheduleTime,
            duration_minutes: 10,
            timezone: "Europe/Paris",
            is_active: true,
          });
          toast({
            title: "Histoire générée + Routine créée ! 🎉",
            description: `Planifiée ${scheduleDays.length} jour(s)/semaine à ${scheduleTime}.`,
          });
        } catch (routineErr: any) {
          console.error("[SimplifiedUnifiedCreator] Erreur création routine:", routineErr);
          toast({
            title: "Histoire générée",
            description: "La routine n'a pas pu être créée. Réessayez depuis le menu Routines.",
            variant: "destructive",
          });
        }
      }

      // Réinitialisation
      setSelectedChildIds([]);
      setSelectedObjective("");
      setScheduleEnabled(false);
      setScheduleDays([]);
      setScheduleTime("20:30");
    } catch (err: any) {
      console.error("[SimplifiedUnifiedCreator] Erreur:", err);
      setError(err?.message || "Une erreur est survenue lors de la création de l'histoire");
    }
  };

  if (loadingObjectives) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Chargement des objectifs...</p>
      </div>
    );
  }

  const checkboxStyle = "h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-primary";

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-lg rounded-lg p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary">
        Créer une histoire personnalisée
      </h2>

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 rounded">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sélection des enfants */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pour qui est cette histoire ?</h3>

          {children && children.length > 0 ? (
            <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-md p-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    selectedChildIds.includes(child.id)
                      ? "bg-primary/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => toggleChildSelection(child.id)}
                  data-child-id={child.id}
                  data-selected={selectedChildIds.includes(child.id) ? "true" : "false"}
                >
                  <input
                    type="checkbox"
                    className={checkboxStyle}
                    checked={selectedChildIds.includes(child.id)}
                    onChange={() => {}}
                    id={`child-${child.id}`}
                  />
                  <label htmlFor={`child-${child.id}`} className="flex-grow cursor-pointer">
                    {child.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
              <p className="text-muted-foreground">Aucun profil enfant disponible</p>
            </div>
          )}

          <Button type="button" variant="outline" className="w-full" onClick={handleOpenCreateChildForm}>
            Ajouter un profil enfant
          </Button>
        </div>

        {/* Sélection de l'objectif */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quel est l'objectif de cette histoire ?</h3>

          <select
            value={selectedObjective}
            onChange={handleObjectiveChange}
            className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
            data-objective-selector="true"
          >
            <option value="">Sélectionnez un objectif</option>
            {activeObjectives.map((objective) => (
              <option key={objective.id} value={objective.value}>
                {objective.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Toggle "Répéter automatiquement" ─────────────────────────────── */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          {/* En-tête */}
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

          {/* Panneau de planification — visible si toggle ON */}
          {scheduleEnabled && (
            <div className="space-y-5 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
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
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
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
                  className="p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full py-6 text-lg font-semibold"
          disabled={isSubmitting}
          data-submit-button="true"
          data-submitting={isSubmitting ? "true" : "false"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Création en cours...
            </>
          ) : scheduleEnabled ? (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Générer + Planifier
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Générer l'histoire
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default SimplifiedUnifiedCreator;
