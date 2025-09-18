export interface OfflineStoryGeneration {
  id: string;
  childrenIds: string[];
  childrenNames: string[];
  objective: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export class OfflineStoryQueue {
  private readonly STORAGE_KEY = 'calmi_offline_queue';
  private readonly MAX_RETRIES = 3;
  private readonly MAX_QUEUE_SIZE = 50;
  private syncInProgress = false;

  constructor() {
    this.cleanup();
    this.setupOnlineListener();
  }

  async addToQueue(generation: Omit<OfflineStoryGeneration, 'id' | 'timestamp' | 'status' | 'retryCount' | 'maxRetries'>): Promise<string> {
    const id = crypto.randomUUID();
    const offlineGeneration: OfflineStoryGeneration = {
      ...generation,
      id,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    const queue = this.getQueue();
    
    // Limiter la taille de la queue
    if (queue.length >= this.MAX_QUEUE_SIZE) {
      // Supprimer les plus anciens éléments terminés
      const filtered = queue
        .filter(item => item.status === 'pending' || item.status === 'processing')
        .slice(0, this.MAX_QUEUE_SIZE - 1);
      this.saveQueue([...filtered, offlineGeneration]);
    } else {
      queue.push(offlineGeneration);
      this.saveQueue(queue);
    }

    this.dispatchQueueUpdate();

    // Si on est en ligne, tenter de traiter immédiatement
    if (navigator.onLine && !this.syncInProgress) {
      this.processQueue();
    }

    return id;
  }

  getQueue(): OfflineStoryGeneration[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const queue = JSON.parse(stored);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de la queue offline:', error);
      return [];
    }
  }

  getPendingGenerations(): OfflineStoryGeneration[] {
    return this.getQueue().filter(item => item.status === 'pending');
  }

  getProcessingGenerations(): OfflineStoryGeneration[] {
    return this.getQueue().filter(item => item.status === 'processing');
  }

  getQueueSize(): number {
    return this.getPendingGenerations().length + this.getProcessingGenerations().length;
  }

  async updateStatus(id: string, status: OfflineStoryGeneration['status'], error?: string): Promise<void> {
    const queue = this.getQueue();
    const item = queue.find(g => g.id === id);
    
    if (item) {
      item.status = status;
      if (error) item.error = error;
      if (status === 'error') item.retryCount++;
      
      this.saveQueue(queue);
      this.dispatchQueueUpdate();
    }
  }

  async processQueue(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingGenerations = this.getPendingGenerations();
      
      for (const generation of pendingGenerations.slice(0, 3)) { // Traiter max 3 à la fois
        try {
          await this.updateStatus(generation.id, 'processing');
          await this.processGeneration(generation);
          await this.updateStatus(generation.id, 'completed');
        } catch (error) {
          console.error('Erreur lors du traitement de la génération:', error);
          
          if (generation.retryCount < generation.maxRetries) {
            await this.updateStatus(generation.id, 'pending', error instanceof Error ? error.message : 'Erreur inconnue');
          } else {
            await this.updateStatus(generation.id, 'error', error instanceof Error ? error.message : 'Erreur inconnue');
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processGeneration(generation: OfflineStoryGeneration): Promise<void> {
    // Simuler l'appel à l'API de génération d'histoire
    const response = await fetch('https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/generateStory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
      },
      body: JSON.stringify({
        childrenIds: generation.childrenIds,
        childrenNames: generation.childrenNames,
        objective: generation.objective
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    // Notifier la génération réussie
    this.notifyGenerationSuccess(result);
  }

  private notifyGenerationSuccess(result: any): void {
    // Créer une notification de succès
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Histoire générée !', {
        body: `"${result.title}" est maintenant disponible`,
        icon: '/icon-192x192.png',
        tag: `story-${result.id}`,
        data: { storyId: result.id, url: `/reader/${result.id}` }
      });
    }

    // Dispatch un événement personnalisé pour l'app
    window.dispatchEvent(new CustomEvent('story-generation-completed', {
      detail: { story: result }
    }));
  }

  private saveQueue(queue: OfflineStoryGeneration[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la queue:', error);
    }
  }

  private dispatchQueueUpdate(): void {
    window.dispatchEvent(new CustomEvent('offline-queue-updated', {
      detail: {
        queueSize: this.getQueueSize(),
        pending: this.getPendingGenerations().length,
        processing: this.getProcessingGenerations().length
      }
    }));
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Connexion rétablie - traitement de la queue offline');
      setTimeout(() => this.processQueue(), 1000); // Petit délai pour s'assurer que la connexion est stable
    });
  }

  private cleanup(): void {
    try {
      const queue = this.getQueue();
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      const validItems = queue.filter(item => 
        now - item.timestamp < maxAge || 
        (item.status === 'pending' || item.status === 'processing')
      );
      
      if (validItems.length !== queue.length) {
        this.saveQueue(validItems);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage de la queue:', error);
    }
  }

  // Méthodes utilitaires
  async clearQueue(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.dispatchQueueUpdate();
  }

  async removeFromQueue(id: string): Promise<void> {
    const queue = this.getQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    this.saveQueue(filteredQueue);
    this.dispatchQueueUpdate();
  }

  subscribeToUpdates(callback: (queueInfo: { queueSize: number; pending: number; processing: number }) => void): () => void {
    const handleUpdate = (event: CustomEvent) => callback(event.detail);
    
    window.addEventListener('offline-queue-updated', handleUpdate as EventListener);
    
    return () => window.removeEventListener('offline-queue-updated', handleUpdate as EventListener);
  }
}

// Instance singleton
export const offlineStoryQueue = new OfflineStoryQueue();