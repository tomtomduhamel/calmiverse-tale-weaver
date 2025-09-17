interface QueuedStory {
  id: string;
  childrenIds: string[];
  objective: string;
  title?: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
}

type QueueSubscriber = () => void;

/**
 * File d'attente locale des générations d'histoires
 * Singleton pour gérer l'état global des générations en cours
 */
export class StoryGenerationQueue {
  private static instance: StoryGenerationQueue;
  private queue: QueuedStory[] = [];
  private subscribers: QueueSubscriber[] = [];
  private isProcessing = false;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): StoryGenerationQueue {
    if (!StoryGenerationQueue.instance) {
      StoryGenerationQueue.instance = new StoryGenerationQueue();
    }
    return StoryGenerationQueue.instance;
  }

  /**
   * Ajoute une histoire à la file d'attente
   */
  async addToQueue(story: Omit<QueuedStory, 'priority' | 'retryCount' | 'maxRetries'>): Promise<void> {
    const queuedStory: QueuedStory = {
      ...story,
      priority: 1,
      retryCount: 0,
      maxRetries: 3
    };

    this.queue.push(queuedStory);
    this.saveToStorage();
    this.notifySubscribers();
    
    console.log('[StoryGenerationQueue] Histoire ajoutée à la file:', story.id);
    
    // Démarrer le traitement si pas déjà en cours
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Met à jour le statut d'une histoire dans la file
   */
  updateStoryStatus(storyId: string, status: QueuedStory['status'], error?: string): void {
    const index = this.queue.findIndex(story => story.id === storyId);
    if (index !== -1) {
      this.queue[index].status = status;
      
      // Si terminé ou en erreur, retirer de la file après un délai
      if (status === 'completed' || status === 'error') {
        setTimeout(() => {
          this.removeFromQueue(storyId);
        }, 5000); // 5 secondes pour permettre à l'utilisateur de voir le statut
      }
      
      this.saveToStorage();
      this.notifySubscribers();
    }
  }

  /**
   * Retire une histoire de la file d'attente
   */
  removeFromQueue(storyId: string): void {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(story => story.id !== storyId);
    
    if (this.queue.length !== initialLength) {
      this.saveToStorage();
      this.notifySubscribers();
      console.log('[StoryGenerationQueue] Histoire retirée de la file:', storyId);
    }
  }

  /**
   * Obtient toutes les histoires en attente
   */
  getPendingStories(): QueuedStory[] {
    return this.queue.filter(story => story.status === 'pending');
  }

  /**
   * Obtient toutes les histoires en cours de traitement
   */
  getProcessingStories(): QueuedStory[] {
    return this.queue.filter(story => story.status === 'processing');
  }

  /**
   * Obtient la taille de la file d'attente
   */
  getQueueSize(): number {
    return this.queue.filter(story => 
      story.status === 'pending' || story.status === 'processing'
    ).length;
  }

  /**
   * Obtient toute la file d'attente
   */
  getQueue(): QueuedStory[] {
    return [...this.queue];
  }

  /**
   * Traite la file d'attente (pour usage futur avec traitement batch)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('[StoryGenerationQueue] Démarrage du traitement de la file');

    try {
      const pendingStories = this.getPendingStories();
      
      // Pour l'instant, marquer simplement comme 'processing'
      // Le traitement réel est géré par useBackgroundStoryGeneration
      for (const story of pendingStories.slice(0, 3)) { // Max 3 simultanés
        this.updateStoryStatus(story.id, 'processing');
      }
    } catch (error) {
      console.error('[StoryGenerationQueue] Erreur lors du traitement:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * S'abonne aux changements de la file d'attente
   */
  subscribe(callback: QueueSubscriber): void {
    this.subscribers.push(callback);
  }

  /**
   * Se désabonne des changements de la file d'attente
   */
  unsubscribe(callback: QueueSubscriber): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  /**
   * Notifie tous les abonnés des changements
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[StoryGenerationQueue] Erreur dans subscriber:', error);
      }
    });
  }

  /**
   * Sauvegarde la file en localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('calmiverse_story_queue', JSON.stringify({
        queue: this.queue,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[StoryGenerationQueue] Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Charge la file depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('calmiverse_story_queue');
      if (stored) {
        const { queue, timestamp } = JSON.parse(stored);
        
        // Ne charger que si moins de 24h
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          this.queue = queue || [];
          console.log('[StoryGenerationQueue] File rechargée depuis localStorage:', this.queue.length);
        }
      }
    } catch (error) {
      console.error('[StoryGenerationQueue] Erreur chargement localStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Nettoie la file d'attente (supprime les anciens éléments)
   */
  cleanup(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24h

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(story => 
      new Date(story.createdAt) > cutoff
    );

    if (this.queue.length !== initialLength) {
      this.saveToStorage();
      this.notifySubscribers();
      console.log('[StoryGenerationQueue] Nettoyage effectué, supprimé:', initialLength - this.queue.length);
    }
  }
}