import type { Story } from '@/types/story';

interface StoryCompletionOptions {
  onNotification?: (title: string, message: string, storyId: string) => void;
  onNavigate?: (path: string) => void;
  onRefresh?: () => void;
}

/**
 * Actions centralisées pour la finalisation des histoires
 * Gère les étapes post-génération comme les notifications, la navigation, etc.
 */
export class StoryCompletionActions {
  private options: StoryCompletionOptions;

  constructor(options: StoryCompletionOptions = {}) {
    this.options = options;
  }

  /**
   * Actions à exécuter quand une histoire est terminée avec succès
   */
  async onStoryCompleted(story: Story): Promise<void> {
    try {
      console.log('[StoryCompletionActions] Histoire terminée:', story.id, story.title);

      // 1. Notification de réussite
      if (this.options.onNotification) {
        this.options.onNotification(
          '✨ Histoire terminée !',
          story.title || 'Votre histoire personnalisée est maintenant disponible',
          story.id
        );
      }

      // 2. Mise à jour des données en cache/état
      if (this.options.onRefresh) {
        this.options.onRefresh();
      }

      // 3. Analytics/tracking (optionnel)
      this.trackStoryCompletion(story);

      // 4. Actions post-traitement
      await this.performPostProcessing(story);

    } catch (error) {
      console.error('[StoryCompletionActions] Erreur lors de la finalisation:', error);
    }
  }

  /**
   * Actions à exécuter quand une histoire échoue
   */
  async onStoryFailed(storyId: string, error?: string): Promise<void> {
    try {
      console.log('[StoryCompletionActions] Histoire échouée:', storyId, error);

      // 1. Notification d'erreur
      if (this.options.onNotification) {
        this.options.onNotification(
          'Erreur de génération',
          error || 'Une erreur est survenue lors de la création de l\'histoire',
          storyId
        );
      }

      // 2. Mise à jour des données
      if (this.options.onRefresh) {
        this.options.onRefresh();
      }

      // 3. Logging de l'erreur
      this.trackStoryError(storyId, error);

    } catch (err) {
      console.error('[StoryCompletionActions] Erreur lors de la gestion d\'échec:', err);
    }
  }

  /**
   * Actions à exécuter quand l'audio est prêt
   */
  async onAudioReady(storyId: string, storyTitle?: string): Promise<void> {
    try {
      console.log('[StoryCompletionActions] Audio prêt:', storyId);

      // 1. Notification audio
      if (this.options.onNotification) {
        this.options.onNotification(
          '🔊 Audio disponible !',
          storyTitle ? `L'audio de "${storyTitle}" est prêt` : 'L\'audio de votre histoire est disponible',
          storyId
        );
      }

      // 2. Mise à jour des données
      if (this.options.onRefresh) {
        this.options.onRefresh();
      }

    } catch (error) {
      console.error('[StoryCompletionActions] Erreur lors de la finalisation audio:', error);
    }
  }

  /**
   * Navigation vers une histoire terminée
   */
  navigateToStory(storyId: string): void {
    if (this.options.onNavigate) {
      this.options.onNavigate(`/reader/${storyId}`);
    }
  }

  /**
   * Navigation vers la bibliothèque
   */
  navigateToLibrary(): void {
    if (this.options.onNavigate) {
      this.options.onNavigate('/library');
    }
  }

  /**
   * Traitement post-génération
   */
  private async performPostProcessing(story: Story): Promise<void> {
    // Génération automatique de l'audio si configuré
    if (this.shouldGenerateAudio(story)) {
      this.requestAudioGeneration(story.id);
    }

    // Mise à jour du statut de lecture si nécessaire
    if (story.status !== 'read') {
      this.updateStoryReadStatus(story.id);
    }
  }

  /**
   * Détermine si l'audio doit être généré automatiquement
   */
  private shouldGenerateAudio(story: Story): boolean {
    // Logique basée sur l'abonnement utilisateur, préférences, etc.
    return Boolean(story.content && !story.sound_id);
  }

  /**
   * Demande de génération audio
   */
  private async requestAudioGeneration(storyId: string): Promise<void> {
    try {
      // Ici, on pourrait déclencher la génération audio automatiquement
      console.log('[StoryCompletionActions] Demande de génération audio pour:', storyId);
      // Cette fonctionnalité pourrait être implémentée plus tard
    } catch (error) {
      console.warn('[StoryCompletionActions] Erreur lors de la demande audio:', error);
    }
  }

  /**
   * Mise à jour du statut de lecture
   */
  private async updateStoryReadStatus(storyId: string): Promise<void> {
    try {
      // Marquer comme non-lue par défaut pour les nouvelles histoires
      console.log('[StoryCompletionActions] Mise à jour du statut pour:', storyId);
    } catch (error) {
      console.warn('[StoryCompletionActions] Erreur lors de la mise à jour du statut:', error);
    }
  }

  /**
   * Tracking de réussite
   */
  private trackStoryCompletion(story: Story): void {
    try {
      // Analytics/metrics pour le succès
      console.log('[StoryCompletionActions] Story completion tracked:', {
        storyId: story.id,
        title: story.title,
        childrenCount: story.childrenIds?.length || 0,
        objective: story.objective,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('[StoryCompletionActions] Erreur de tracking:', error);
    }
  }

  /**
   * Tracking d'erreur
   */
  private trackStoryError(storyId: string, error?: string): void {
    try {
      // Analytics/metrics pour les erreurs
      console.error('[StoryCompletionActions] Story error tracked:', {
        storyId,
        error,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[StoryCompletionActions] Erreur de tracking d\'erreur:', err);
    }
  }
}