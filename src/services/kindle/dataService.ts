
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const kindleDataService = {
  /**
   * Récupère les données complètes de l'histoire pour Kindle
   */
  async getCompleteStoryData(storyId: string): Promise<Story> {
    console.log('📖 [KindleDataService] Récupération des données complètes de l\'histoire:', storyId);
    
    if (!storyId) {
      throw new Error("ID de l'histoire manquant");
    }
    
    try {
      console.log('🌐 [KindleDataService] Utilisation du client Supabase pour récupérer l\'histoire');
      
      const { data: storyData, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      if (error) {
        console.error('❌ [KindleDataService] Erreur Supabase:', error);
        throw new Error(`Erreur lors de la récupération de l'histoire: ${error.message}`);
      }
      
      if (!storyData) {
        console.error('❌ [KindleDataService] Aucune donnée retournée pour l\'histoire:', storyId);
        throw new Error("Histoire introuvable");
      }
      
      console.log('📥 [KindleDataService] Données reçues:', {
        id: storyData.id,
        title: storyData.title,
        hasContent: !!storyData.content,
        contentLength: storyData.content?.length || 0,
        authorId: storyData.authorid,
        hasAnalysis: !!storyData.story_analysis
      });
      
      // Validation du contenu depuis la colonne 'content'
      if (!storyData.content || storyData.content.length < 10) {
        console.error('❌ [KindleDataService] Contenu insuffisant:', {
          hasContent: !!storyData.content,
          contentLength: storyData.content?.length || 0
        });
        throw new Error("Le contenu de l'histoire est trop court ou manquant");
      }

      // Mapping correct des données - utiliser 'content' au lieu de 'story_text'
      const story: Story = {
        id: storyData.id,
        title: storyData.title || "Histoire sans titre",
        preview: storyData.preview || "",
        objective: storyData.objective || "",
        childrenIds: storyData.childrenids || [],
        childrenNames: storyData.childrennames || [],
        createdAt: new Date(storyData.createdat),
        status: storyData.status as any || 'ready',
        content: storyData.content,
        story_summary: storyData.summary || "",
        authorId: storyData.authorid,
        story_analysis: storyData.story_analysis || undefined
      };

      console.log('✅ [KindleDataService] Histoire mappée avec succès:', {
        id: story.id,
        title: story.title,
        contentLength: story.content.length,
        authorId: story.authorId,
        hasAnalysis: !!story.story_analysis
      });

      return story;
    } catch (error) {
      console.error('💥 [KindleDataService] Erreur lors de la récupération de l\'histoire:', error);
      
      // Messages d'erreur plus explicites pour l'utilisateur
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('introuvable')) {
          throw new Error("Cette histoire n'existe pas ou vous n'avez pas les droits pour y accéder.");
        }
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          throw new Error("Vous n'avez pas les permissions nécessaires pour accéder à cette histoire.");
        }
        throw error;
      }
      
      throw new Error("Erreur technique lors de la récupération de l'histoire. Veuillez réessayer.");
    }
  },

  /**
   * Récupère les informations de l'utilisateur pour Kindle
   */
  async getUserData(authorId: string) {
    console.log('👤 [KindleDataService] Récupération des données utilisateur pour:', authorId);
    
    if (!authorId) {
      throw new Error("ID de l'auteur manquant");
    }
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('firstname, lastname, kindle_email')
        .eq('id', authorId)
        .single();
      
      if (error) {
        console.error('❌ [KindleDataService] Erreur Supabase utilisateur:', error);
        throw new Error(`Erreur lors de la récupération des données utilisateur: ${error.message}`);
      }
      
      if (!userData) {
        console.error('❌ [KindleDataService] Utilisateur introuvable:', authorId);
        throw new Error("Utilisateur introuvable");
      }
      
      console.log('📥 [KindleDataService] Données utilisateur récupérées:', {
        hasFirstname: !!userData.firstname,
        hasLastname: !!userData.lastname,
        hasKindleEmail: !!userData.kindle_email
      });
      
      return userData;
    } catch (error) {
      console.error('💥 [KindleDataService] Erreur lors de la récupération des données utilisateur:', error);
      throw error;
    }
  }
};
