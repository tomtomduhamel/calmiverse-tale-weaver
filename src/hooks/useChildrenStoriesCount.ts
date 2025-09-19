import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useChildrenStoriesCount = () => {
  const [storiesCount, setStoriesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStoriesCount = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer toutes les histoires de l'utilisateur avec fallback
        const { data: stories, error } = await supabase
          .from('stories')
          .select('childrenids')
          .eq('authorid', user.id);
        
        if (error) {
          console.warn("Erreur Supabase lors du chargement des histoires:", error);
          // Continuer avec des données vides au lieu de planter
          setStoriesCount({});
          setError("Impossible de charger les statistiques des histoires");
          return;
        }
        
        // Compter le nombre d'histoires par enfant avec protection
        const countMap: Record<string, number> = {};
        
        if (stories && Array.isArray(stories)) {
          stories.forEach(story => {
            if (story?.childrenids && Array.isArray(story.childrenids)) {
              story.childrenids.forEach((childId: string) => {
                if (typeof childId === 'string' && childId.trim()) {
                  countMap[childId] = (countMap[childId] || 0) + 1;
                }
              });
            }
          });
        }
        
        setStoriesCount(countMap);
      } catch (error: any) {
        console.error("Erreur lors du chargement du nombre d'histoires:", error);
        setError("Erreur de connexion");
        // Utiliser des données vides en cas d'erreur pour éviter les crashes
        setStoriesCount({});
      } finally {
        setLoading(false);
      }
    };
    
    loadStoriesCount();
    
    // Configurer une souscription en temps réel pour les mises à jour des histoires
    const channel = supabase
      .channel('stories_count_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, () => {
        loadStoriesCount();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    storiesCount,
    loading,
    error
  };
};