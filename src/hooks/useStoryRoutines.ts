import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoryRoutine {
  id: string;
  user_id: string;
  mode: 'guided' | 'fast';
  objective?: string | null;
  child_ids?: string[] | null;
  fast_story_prompt_key?: string | null;
  duration_minutes: number;
  generate_video: boolean;
  schedule_type: 'weekly' | 'interval';
  days_of_week?: number[] | null;
  interval_days?: number | null;
  time_of_day: string; // "HH:MM:SS"
  timezone: string;
  is_active: boolean;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_story_id?: string | null;
  last_skip_reason?: string | null;
  monthly_estimate: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoutineData {
  mode: 'guided' | 'fast';
  // Guided
  objective?: string;
  child_ids?: string[];
  // Fast
  fast_story_prompt_key?: string;
  // Commun
  duration_minutes: number;
  generate_video?: boolean;
  schedule_type: 'weekly' | 'interval';
  days_of_week?: number[];   // ISO 1=lun … 7=dim
  interval_days?: number;
  time_of_day: string;       // "HH:MM"
  timezone?: string;
  is_active?: boolean;
}

export interface QuotaCheck {
  allowed: boolean;
  projected: number;
  existing: number;
  limit: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStoryRoutines = () => {
  const { user } = useSupabaseAuth();
  const [routines, setRoutines] = useState<StoryRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoCreation, setHasAutoCreation] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // ── Vérification du droit premium ─────────────────────────────────────────
  const checkAccess = useCallback(async () => {
    if (!user) {
      setHasAutoCreation(false);
      setCheckingAccess(false);
      return;
    }
    try {
      const { data } = await supabase.rpc('has_feature_access', {
        p_user_id: user.id,
        p_feature: 'auto_creation',
      });
      setHasAutoCreation(Boolean(data));
    } catch {
      setHasAutoCreation(false);
    } finally {
      setCheckingAccess(false);
    }
  }, [user]);

  // ── Chargement des routines ────────────────────────────────────────────────
  const fetchRoutines = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: dbErr } = await supabase
        .from('story_routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (dbErr) throw dbErr;
      setRoutines((data ?? []) as StoryRoutine[]);
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors du chargement des routines');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
    fetchRoutines();
  }, [checkAccess, fetchRoutines]);

  // ── Quota : estimation avant save ─────────────────────────────────────────
  const checkQuota = async (
    candidateMonthly: number,
    excludeId?: string,
  ): Promise<QuotaCheck | null> => {
    if (!user) return null;
    try {
      const { data } = await supabase.rpc('check_auto_routine_quota', {
        p_user_id: user.id,
        p_candidate_monthly: candidateMonthly,
        p_exclude_routine: excludeId ?? null,
      });
      return data as QuotaCheck;
    } catch {
      return null;
    }
  };

  // ── Calcul de la prochaine exécution (via RPC) ────────────────────────────
  const computeNextRun = async (
    scheduleType: 'weekly' | 'interval',
    daysOfWeek: number[] | null,
    intervalDays: number | null,
    timeOfDay: string,
    timezone: string,
  ): Promise<string | null> => {
    try {
      const { data } = await supabase.rpc('compute_next_run', {
        p_schedule_type: scheduleType,
        p_days_of_week: daysOfWeek,
        p_interval_days: intervalDays,
        p_time_of_day: timeOfDay,
        p_timezone: timezone,
      });
      return (data as string) ?? null;
    } catch {
      return null;
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createRoutine = async (data: CreateRoutineData): Promise<StoryRoutine> => {
    if (!user) throw new Error('Non authentifié');

    const next_run_at = await computeNextRun(
      data.schedule_type,
      data.days_of_week ?? null,
      data.interval_days ?? null,
      data.time_of_day,
      data.timezone ?? 'Europe/Paris',
    );

    const { data: created, error: dbErr } = await supabase
      .from('story_routines')
      .insert({
        user_id: user.id,
        mode: data.mode,
        objective: data.objective ?? null,
        child_ids: data.child_ids ?? null,
        fast_story_prompt_key: data.fast_story_prompt_key ?? null,
        duration_minutes: data.duration_minutes,
        generate_video: data.generate_video ?? false,
        schedule_type: data.schedule_type,
        days_of_week: data.days_of_week ?? null,
        interval_days: data.interval_days ?? null,
        time_of_day: data.time_of_day,
        timezone: data.timezone ?? 'Europe/Paris',
        is_active: data.is_active ?? true,
        next_run_at,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;
    const routine = created as StoryRoutine;
    setRoutines(prev => [routine, ...prev]);
    return routine;
  };

  const updateRoutine = async (
    id: string,
    data: Partial<CreateRoutineData>,
  ): Promise<void> => {
    const current = routines.find(r => r.id === id);

    // Recalcul de next_run_at si le schedule a changé
    let next_run_at: string | null | undefined;
    const scheduleChanged =
      data.schedule_type != null ||
      data.days_of_week != null ||
      data.interval_days != null ||
      data.time_of_day != null ||
      data.timezone != null;

    if (scheduleChanged && current) {
      next_run_at = await computeNextRun(
        data.schedule_type ?? current.schedule_type,
        data.days_of_week ?? current.days_of_week ?? null,
        data.interval_days ?? current.interval_days ?? null,
        data.time_of_day ?? current.time_of_day,
        data.timezone ?? current.timezone,
      );
    }

    const payload: any = { ...data, updated_at: new Date().toISOString() };
    if (next_run_at !== undefined) payload.next_run_at = next_run_at;

    const { data: updated, error: dbErr } = await supabase
      .from('story_routines')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (dbErr) throw dbErr;
    setRoutines(prev =>
      prev.map(r => (r.id === id ? (updated as StoryRoutine) : r)),
    );
  };

  const deleteRoutine = async (id: string): Promise<void> => {
    const { error: dbErr } = await supabase
      .from('story_routines')
      .delete()
      .eq('id', id);
    if (dbErr) throw dbErr;
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const toggleActive = async (id: string, isActive: boolean): Promise<void> => {
    const { error: dbErr } = await supabase
      .from('story_routines')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (dbErr) throw dbErr;
    setRoutines(prev =>
      prev.map(r => (r.id === id ? { ...r, is_active: isActive } : r)),
    );
  };

  return {
    routines,
    loading,
    error,
    hasAutoCreation,
    checkingAccess,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    toggleActive,
    checkQuota,
    refreshRoutines: fetchRoutines,
  };
};

// ─── Helpers utilitaires (utilisés par les composants) ───────────────────────

const DAY_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
  7: 'Dim',
};

/** Description lisible d'une routine ("Lun, Mer à 20h00" ou "Tous les 3 jours à 19h30") */
export function describeSchedule(routine: Pick<StoryRoutine, 'schedule_type' | 'days_of_week' | 'interval_days' | 'time_of_day'>): string {
  const timeParts = routine.time_of_day.split(':');
  const timeLabel = `${timeParts[0]}h${timeParts[1]}`;

  if (routine.schedule_type === 'weekly') {
    const days = (routine.days_of_week ?? [])
      .slice()
      .sort((a, b) => a - b)
      .map(d => DAY_LABELS[d] ?? '?')
      .join(', ');
    return `${days} à ${timeLabel}`;
  }
  const n = routine.interval_days ?? 1;
  return n === 1 ? `Chaque jour à ${timeLabel}` : `Tous les ${n} jours à ${timeLabel}`;
}

/** Estimation mensuelle pour une configuration de schedule donnée */
export function estimateMonthly(
  scheduleType: 'weekly' | 'interval',
  daysOfWeek: number[],
  intervalDays: number,
): number {
  if (scheduleType === 'weekly') {
    return Math.ceil((daysOfWeek.length) * 4.33);
  }
  return Math.ceil(30 / Math.max(intervalDays, 1));
}
