import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Story, StorySeries, SequelData } from '@/types/story';

// URL du webhook N8N pour la génération des suites d'histoires
const N8N_SEQUEL_WEBHOOK_URL = 'https://n8n.srv856374.hstgr.cloud/webhook/5bdab9d2-f772-4fc7-aa22-0ab36b81b428';

/**
 * Hook pour gérer les séries/suites d'histoires
 */
export const useStorySeries = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Créer une nouvelle série à partir d'une histoire existante
   */
  const createSeries = useCallback(async (firstStoryId: string, seriesTitle: string): Promise<StorySeries | null> => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      setIsCreating(true);

      // 1. Créer la série
      const { data: series, error: seriesError } = await supabase
        .from('story_series')
        .insert({
          title: seriesTitle,
          author_id: user.id,
          total_tomes: 1
        })
        .select()
        .single();

      if (seriesError) throw seriesError;

      // 2. Mettre à jour l'histoire pour l'associer à la série
      const { error: storyError } = await supabase
        .from('stories')
        .update({
          series_id: series.id,
          tome_number: 1,
          is_series_starter: true
        })
        .eq('id', firstStoryId)
        .eq('authorid', user.id);

      if (storyError) throw storyError;

      toast({
        title: "Série créée",
        description: `La série "${seriesTitle}" a été créée avec succès`
      });

      return series;
    } catch (error: any) {
      console.error('❌ Erreur création série:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la série",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, toast]);

  /**
   * Créer une suite d'histoire
   */
  const createSequel = useCallback(async (sequelData: SequelData): Promise<string | null> => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      setIsCreating(true);

      // 1. Récupérer l'histoire précédente
      const { data: previousStory, error: fetchError } = await supabase
        .from('stories')
        .select('*, series:story_series(*)')
        .eq('id', sequelData.previousStoryId)
        .eq('authorid', user.id)
        .single();

      if (fetchError) throw fetchError;

      let seriesId = previousStory.series_id;
      let tomeNumber = (previousStory.tome_number || 0) + 1;

      // 2. Si pas de série, en créer une
      if (!seriesId && sequelData.seriesTitle) {
        const newSeries = await createSeries(sequelData.previousStoryId, sequelData.seriesTitle);
        if (!newSeries) return null;
        seriesId = newSeries.id;
        tomeNumber = 2;
      }

      // 3. Créer la nouvelle histoire (suite)
      const { data: newStory, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: `${previousStory.title} - Tome ${tomeNumber}`,
          authorid: user.id,
          childrenids: sequelData.childrenIds,
          childrennames: sequelData.childrenNames,
          objective: sequelData.objective,
          series_id: seriesId,
          tome_number: tomeNumber,
          previous_story_id: sequelData.previousStoryId,
          status: 'pending',
          preview: "Génération de la suite en cours...",
          content: ""
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Mettre à jour l'histoire précédente avec le lien vers la suite
      await supabase
        .from('stories')
        .update({ next_story_id: newStory.id })
        .eq('id', sequelData.previousStoryId);

      // 5. Appeler le webhook n8n pour générer la suite
      const payload = {
        action: 'create_story_sequel',
        storyId: newStory.id,
        previousStoryId: sequelData.previousStoryId,
        seriesId: seriesId,
        tomeNumber: tomeNumber,
        
        // Contexte de l'histoire précédente
        previousStoryContent: previousStory.content,
        previousStorySummary: previousStory.summary,
        
        // Analyse des éléments narratifs
        characters: previousStory.story_analysis?.characters || {},
        writingStyle: previousStory.story_analysis?.writingStyle,
        recurringPhrases: previousStory.story_analysis?.recurringPhrases || [],
        narrativeStructure: previousStory.story_analysis?.narrativeStructure,
        
        // Contexte des enfants
        childrenIds: sequelData.childrenIds,
        childrenNames: sequelData.childrenNames,
        objective: sequelData.objective,
        duration: sequelData.duration,
        
        // Instructions spéciales pour la suite
        sequelInstructions: sequelData.sequelInstructions || {
          maintainCharacterConsistency: true,
          referenceToEvents: true,
          evolutionOfCharacters: true,
          newChallengesIntroduced: true
        },
        
        userId: user.id,
        timestamp: new Date().toISOString()
      };

      // Appel du webhook n8n avec l'URL configurable
      const response = await supabase.functions.invoke('create-story-sequel', {
        body: {
          ...payload,
          webhookUrl: N8N_SEQUEL_WEBHOOK_URL
        }
      });

      if (response.error) {
        console.error('❌ Erreur webhook suite:', response.error);
        throw new Error('Erreur lors du déclenchement de la génération');
      }

      toast({
        title: "Suite créée",
        description: `Tome ${tomeNumber} en cours de génération`
      });

      return newStory.id;
    } catch (error: any) {
      console.error('❌ Erreur création suite:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la suite",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, toast, createSeries]);

  /**
   * Récupérer toutes les histoires d'une série
   */
  const getSeriesStories = useCallback(async (seriesId: string): Promise<Story[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, series:story_series(*)')
        .eq('series_id', seriesId)
        .eq('authorid', user.id)
        .order('tome_number', { ascending: true });

      if (error) throw error;

      return data.map(story => ({
        ...story,
        id: story.id,
        title: story.title,
        preview: story.preview || '',
        objective: story.objective || '',
        childrenIds: story.childrenids || [],
        childrenNames: story.childrennames || [],
        createdAt: new Date(story.createdat),
        status: story.status,
        content: story.content || '',
        story_summary: story.summary || '',
        authorId: story.authorid,
        isFavorite: story.is_favorite,
        updatedAt: story.updatedat ? new Date(story.updatedat) : undefined,
        sound_id: story.sound_id,
        image_path: story.image_path,
        story_analysis: story.story_analysis,
        series_id: story.series_id,
        tome_number: story.tome_number,
        is_series_starter: story.is_series_starter,
        previous_story_id: story.previous_story_id,
        next_story_id: story.next_story_id,
        series: story.series
      }));
    } catch (error: any) {
      console.error('❌ Erreur récupération série:', error);
      return [];
    }
  }, [user]);

  /**
   * Récupérer toutes les séries de l'utilisateur
   */
  const getUserSeries = useCallback(async (): Promise<StorySeries[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('story_series')
        .select('*')
        .eq('author_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(series => ({
        ...series,
        created_at: new Date(series.created_at),
        updated_at: new Date(series.updated_at)
      }));
    } catch (error: any) {
      console.error('❌ Erreur récupération séries:', error);
      return [];
    }
  }, [user]);

  return {
    createSeries,
    createSequel,
    getSeriesStories,
    getUserSeries,
    isCreating
  };
};