import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Sparkles, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useStoryRoutines,
  CreateRoutineData,
  StoryRoutine,
  estimateMonthly,
} from '@/hooks/useStoryRoutines';
import { useSupabaseChildren } from '@/hooks/useSupabaseChildren';
import {
  FAST_STORIES_REGULATION,
  FAST_STORIES_RENFORCEMENT,
  FAST_STORIES_SITUATIONS,
} from '@/config/fastStoryConfig';
import type { StoryDurationMinutes } from '@/types/story';
import { STORY_DURATION_OPTIONS } from '@/types/story';

// ─── Constantes ────────────────────────────────────────────────────────────────

const ALL_FAST_STORIES = [
  ...FAST_STORIES_REGULATION,
  ...FAST_STORIES_RENFORCEMENT,
  ...(FAST_STORIES_SITUATIONS ?? []),
];

const OBJECTIVES = [
  { value: 'sleep', label: '😴 S\'endormir' },
  { value: 'focus', label: '🎯 Se concentrer' },
  { value: 'relax', label: '🌿 Se détendre' },
  { value: 'fun', label: '🎉 S\'amuser' },
];

const DAYS_ISO = [
  { iso: 1, short: 'L', label: 'Lundi' },
  { iso: 2, short: 'M', label: 'Mardi' },
  { iso: 3, short: 'Me', label: 'Mercredi' },
  { iso: 4, short: 'J', label: 'Jeudi' },
  { iso: 5, short: 'V', label: 'Vendredi' },
  { iso: 6, short: 'S', label: 'Samedi' },
  { iso: 7, short: 'D', label: 'Dimanche' },
];

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'Europe/London', label: 'Londres (UTC+0/+1)' },
  { value: 'Europe/Brussels', label: 'Bruxelles (UTC+1/+2)' },
  { value: 'Europe/Zurich', label: 'Zurich (UTC+1/+2)' },
  { value: 'America/Montreal', label: 'Montréal (UTC-5/-4)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
];

// ─── QuotaBanner ───────────────────────────────────────────────────────────────

interface QuotaBannerProps {
  projected: number;
  limit: number;
  allowed: boolean;
  estimate: number;
}

const QuotaBanner: React.FC<QuotaBannerProps> = ({ projected, limit, allowed, estimate }) => {
  if (!estimate) return null;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
        allowed
          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      {allowed ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      <div>
        {allowed ? (
          <span>
            Cette routine ajoutera <strong>~{estimate} histoire{estimate > 1 ? 's' : ''}/mois</strong>.
            Total projeté : {projected}/{limit}.
          </span>
        ) : (
          <span>
            Quota dépassé. Cette routine génèrerait ~{projected} histoires/mois, ta limite est {limit}.
            Réduis la fréquence ou désactive une routine existante.
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Formulaire ────────────────────────────────────────────────────────────────

const RoutineFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    routines,
    loading: routinesLoading,
    hasAutoCreation,
    checkingAccess,
    createRoutine,
    updateRoutine,
    checkQuota,
  } = useStoryRoutines();

  const { children, loading: childrenLoading } = useSupabaseChildren();

  // ── État du formulaire ────────────────────────────────────────────────────
  const [mode, setMode] = useState<'guided' | 'fast'>('fast');
  const [objective, setObjective] = useState('sleep');
  const [childIds, setChildIds] = useState<string[]>([]);
  const [promptKey, setPromptKey] = useState('fast_story_fear');
  const [durationMinutes, setDurationMinutes] = useState<StoryDurationMinutes>(10);
  const [generateVideo, setGenerateVideo] = useState(false);
  const [scheduleType, setScheduleType] = useState<'weekly' | 'interval'>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Lundi par défaut
  const [intervalDays, setIntervalDays] = useState(7);
  const [timeOfDay, setTimeOfDay] = useState('20:00');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [isActive, setIsActive] = useState(true);

  // ── Quota ─────────────────────────────────────────────────────────────────
  const [quotaCheck, setQuotaCheck] = useState<{
    allowed: boolean; projected: number; limit: number; estimate: number
  } | null>(null);

  // ── Chargement (mode édition) ─────────────────────────────────────────────
  const [loadingForm, setLoadingForm] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || routinesLoading) return;
    const routine = routines.find(r => r.id === id);
    if (!routine) { navigate('/app/routines'); return; }

    setMode(routine.mode);
    setObjective(routine.objective ?? 'sleep');
    setChildIds(routine.child_ids ?? []);
    setPromptKey(routine.fast_story_prompt_key ?? 'fast_story_fear');
    setDurationMinutes((routine.duration_minutes as StoryDurationMinutes) ?? 10);
    setGenerateVideo(routine.generate_video);
    setScheduleType(routine.schedule_type);
    setDaysOfWeek(routine.days_of_week ?? [1]);
    setIntervalDays(routine.interval_days ?? 7);
    setTimeOfDay(routine.time_of_day?.slice(0, 5) ?? '20:00');
    setTimezone(routine.timezone ?? 'Europe/Paris');
    setIsActive(routine.is_active);
    setLoadingForm(false);
  }, [isEdit, id, routines, routinesLoading, navigate]);

  // ── Estimation quota en temps réel ────────────────────────────────────────
  const refreshQuota = useCallback(async () => {
    const estimate = estimateMonthly(
      scheduleType,
      scheduleType === 'weekly' ? daysOfWeek : [],
      scheduleType === 'interval' ? intervalDays : 1,
    );
    if (!estimate) { setQuotaCheck(null); return; }
    const result = await checkQuota(estimate, isEdit ? id : undefined);
    if (result) {
      setQuotaCheck({ allowed: result.allowed, projected: result.projected, limit: result.limit, estimate });
    }
  }, [scheduleType, daysOfWeek, intervalDays, checkQuota, isEdit, id]);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // ── Soumission ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (mode === 'guided') {
      if (!objective) { toast({ title: 'Sélectionne un objectif', variant: 'destructive' }); return; }
      if (childIds.length === 0) { toast({ title: 'Sélectionne au moins un enfant', variant: 'destructive' }); return; }
    } else {
      if (!promptKey) { toast({ title: 'Sélectionne un thème', variant: 'destructive' }); return; }
    }
    if (scheduleType === 'weekly' && daysOfWeek.length === 0) {
      toast({ title: 'Sélectionne au moins un jour', variant: 'destructive' }); return;
    }
    if (!timeOfDay) { toast({ title: 'Précise l\'heure', variant: 'destructive' }); return; }
    if (quotaCheck && !quotaCheck.allowed) {
      toast({ title: 'Quota dépassé', description: 'Réduis la fréquence de la routine.', variant: 'destructive' });
      return;
    }

    const data: CreateRoutineData = {
      mode,
      objective: mode === 'guided' ? objective : undefined,
      child_ids: mode === 'guided' ? childIds : undefined,
      fast_story_prompt_key: mode === 'fast' ? promptKey : undefined,
      duration_minutes: durationMinutes,
      generate_video: generateVideo,
      schedule_type: scheduleType,
      days_of_week: scheduleType === 'weekly' ? daysOfWeek : undefined,
      interval_days: scheduleType === 'interval' ? intervalDays : undefined,
      time_of_day: timeOfDay,
      timezone,
      is_active: isActive,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateRoutine(id, data);
        toast({ title: 'Routine mise à jour ✓' });
      } else {
        await createRoutine(data);
        toast({ title: 'Routine créée ✓' });
      }
      navigate('/app/routines');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (checkingAccess || loadingForm || (isEdit && routinesLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAutoCreation === false) {
    navigate('/app/routines');
    return null;
  }

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const toggleChildId = (cid: string) => {
    setChildIds(prev => prev.includes(cid) ? prev.filter(i => i !== cid) : [...prev, cid]);
  };

  const currentEstimate = estimateMonthly(
    scheduleType,
    scheduleType === 'weekly' ? daysOfWeek : [],
    scheduleType === 'interval' ? intervalDays : 1,
  );

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/routines')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{isEdit ? 'Modifier la routine' : 'Nouvelle routine'}</h1>
      </div>

      {/* ── Mode ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Type d'histoire</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[
            { value: 'fast', icon: <Zap className="w-4 h-4" />, label: 'Histoire rapide', desc: 'Thème prédéfini, sans personnage' },
            { value: 'guided', icon: <Sparkles className="w-4 h-4" />, label: 'Mode guidé', desc: 'Personnalisée pour tes enfants' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value as 'guided' | 'fast')}
              className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all gap-2 ${
                mode === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className={`p-2 rounded-lg ${mode === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {opt.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Contenu selon le mode ─────────────────────────────────────────── */}
      {mode === 'fast' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thème</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={promptKey} onValueChange={setPromptKey}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" disabled>Choisir un thème</SelectItem>
                {[
                  { label: '🌊 Émotions à apaiser', items: FAST_STORIES_REGULATION },
                  { label: '✨ Ressources à développer', items: FAST_STORIES_RENFORCEMENT },
                  ...(FAST_STORIES_SITUATIONS?.length
                    ? [{ label: '🧩 Situations du quotidien', items: FAST_STORIES_SITUATIONS }]
                    : []),
                ].map(group => (
                  <React.Fragment key={group.label}>
                    <SelectItem value={`__group_${group.label}`} disabled className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </SelectItem>
                    {group.items.map(item => (
                      <SelectItem key={item.promptKey} value={item.promptKey}>
                        {item.icon} {item.label}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Objectif & enfants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Objectif */}
            <div className="space-y-2">
              <Label>Objectif</Label>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.value}
                    type="button"
                    onClick={() => setObjective(obj.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      objective === obj.value
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Enfants */}
            <div className="space-y-2">
              <Label>Enfants</Label>
              {childrenLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
              ) : children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun profil enfant. Crée-en un depuis la section Profils.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {children.map(child => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChildId(child.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        childIds.includes(child.id)
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Durée ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Durée de lecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STORY_DURATION_OPTIONS.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  durationMinutes === mins
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Planification ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Type de récurrence */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'weekly', label: 'Jours de la semaine' },
              { value: 'interval', label: 'Tous les N jours' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScheduleType(opt.value as 'weekly' | 'interval')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  scheduleType === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Jours de la semaine (weekly) */}
          {scheduleType === 'weekly' && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Jours sélectionnés</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS_ISO.map(day => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => toggleDay(day.iso)}
                    aria-label={day.label}
                    className={`w-9 h-9 rounded-full border text-xs font-medium transition-all ${
                      daysOfWeek.includes(day.iso)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intervalle */}
          {scheduleType === 'interval' && (
            <div className="space-y-2">
              <Label htmlFor="interval-days" className="text-xs text-muted-foreground">
                Tous les combien de jours ?
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="interval-days"
                  type="number"
                  min={1}
                  max={30}
                  value={intervalDays}
                  onChange={e => setIntervalDays(Math.min(30, Math.max(1, Number(e.target.value))))}
                  className="w-20 px-3 py-2 border rounded-md text-sm bg-background"
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
          )}

          {/* Heure */}
          <div className="space-y-2">
            <Label htmlFor="time-of-day" className="text-xs text-muted-foreground">Heure de déclenchement</Label>
            <input
              id="time-of-day"
              type="time"
              value={timeOfDay}
              onChange={e => setTimeOfDay(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background w-full max-w-[10rem]"
            />
          </div>

          {/* Fuseau horaire */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimation */}
          {currentEstimate > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimation : <strong className="text-foreground">~{currentEstimate} histoire{currentEstimate > 1 ? 's' : ''}/mois</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Quota warning ────────────────────────────────────────────────── */}
      {quotaCheck && <QuotaBanner {...quotaCheck} />}

      {/* ── Options ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Routine active</p>
              <p className="text-xs text-muted-foreground">Décocher pour mettre en pause</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pb-8">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/app/routines')}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={saving || (quotaCheck !== null && !quotaCheck.allowed)}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEdit ? 'Enregistrer' : 'Créer la routine'}
        </Button>
      </div>
    </div>
  );
};

export default RoutineFormPage;
