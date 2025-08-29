import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useChildrenStoriesCount = () => {
  const [storiesCount, setStoriesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStoriesCount = async () => {
      try {
        setLoading(true);
        
        // Récupérer toutes les histoires de l'utilisateur
        const { data: stories, error } = await supabase
          .from('stories')
          .select('childrenids')
          .eq('authorid', user.id);
        
        if (error) throw error;
        
        // Compter le nombre d'histoires par enfant
        const countMap: Record<string, number> = {};
        
        stories?.forEach(story => {
          if (story.childrenids && Array.isArray(story.childrenids)) {
            story.childrenids.forEach((childId: string) => {
              countMap[childId] = (countMap[childId] || 0) + 1;
            });
          }
        });
        
        setStoriesCount(countMap);
      } catch (error: any) {
        console.error("Erreur lors du chargement du nombre d'histoires:", error);
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
    loading
  };
};