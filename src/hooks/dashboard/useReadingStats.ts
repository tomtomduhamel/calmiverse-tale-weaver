import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface ReadingStat {
  totalReads: number;
  currentStreak: number;
  recentReads: Array<{
    id: string;
    story_id: string;
    read_at: string;
    story: {
      title: string;
      objective: string | null;
    } | null;
  }>;
  objectiveStats: Record<string, number>;
}

export const useReadingStats = () => {
  const { user } = useSupabaseAuth();

  return useQuery({
    queryKey: ['reading-stats', user?.id],
    queryFn: async (): Promise<ReadingStat> => {
      if (!user) throw new Error("Non authentifié");

      // 1. Récupérer l'historique de lecture
      const { data: historyData, error: historyError } = await supabase
        .from('reading_history')
        .select(`
          id,
          story_id,
          read_at,
          completed,
          stories (
            id,
            title,
            objective
          )
        `)
        .eq('user_id', user.id)
        .order('read_at', { ascending: false });

      if (historyError) {
        console.error("Erreur récupération historique:", historyError);
        throw historyError;
      }

      const reads = historyData || [];
      const totalReads = reads.length;

      // 2. Calcul des stats par objectif
      const objectiveStats: Record<string, number> = {};
      
      reads.forEach(read => {
        // cast because Postgrest returns unknown or array for joined tables in some TS configs
        const story = Array.isArray(read.stories) ? read.stories[0] : read.stories;
        
        if (story && story.objective) {
          objectiveStats[story.objective] = (objectiveStats[story.objective] || 0) + 1;
        }
      });

      // 3. Calcul de la streak (jours consécutifs)
      let currentStreak = 0;
      if (reads.length > 0) {
        // Obtenir des dates uniques de lecture (ignorer les heures)
        const readDates = [...new Set(reads.map(r => new Date(r.read_at).toDateString()))]
          .map(d => new Date(d).getTime())
          .sort((a, b) => b - a); // du plus récent au plus ancien

        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Si la dernière lecture n'est ni aujourd'hui ni hier, le streak est brisé (0)
        if (readDates.length > 0 && (readDates[0] === today || readDates[0] === yesterday.getTime())) {
          currentStreak = 1;
          
          let currentDateT = readDates[0];
          
          // Compter à reculons par jours successifs
          for (let i = 1; i < readDates.length; i++) {
            const expectedPreviousDay = new Date(currentDateT);
            expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);
            
            if (readDates[i] === expectedPreviousDay.getTime()) {
              currentStreak++;
              currentDateT = readDates[i];
            } else {
              break;
            }
          }
        }
      }

      // formater les 10 dernières lectures pour le carnet
      const recentReads = reads.slice(0, 10).map(r => {
        const story = Array.isArray(r.stories) ? r.stories[0] : r.stories;
        return {
          id: r.id,
          story_id: r.story_id,
          read_at: r.read_at,
          story: story ? {
            title: story.title,
            objective: story.objective,
          } : null
        };
      });

      return {
        totalReads,
        currentStreak,
        recentReads,
        objectiveStats
      };
    },
    enabled: !!user,
  });
};
