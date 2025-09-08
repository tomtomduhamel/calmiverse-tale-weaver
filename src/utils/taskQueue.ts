/**
 * Task Queue System - Phase 3 Commercial Publication
 * Système de files d'attente pour les tâches longues
 */

interface Task<T = any> {
  id: string;
  type: string;
  payload: T;
  priority: number;
  retries: number;
  maxRetries: number;
  createdAt: number;
  scheduledAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  progressCallback?: (progress: number) => void;
}

interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  throughput: number;
}

type TaskHandler<T = any> = (task: Task<T>) => Promise<any>;

class TaskQueue {
  private tasks = new Map<string, Task>();
  private handlers = new Map<string, TaskHandler>();
  private running = new Set<string>();
  private maxConcurrent = 3;
  private isProcessing = false;
  private processingStats = {
    totalProcessed: 0,
    totalProcessingTime: 0,
    lastHourProcessed: 0,
    lastHourStart: Date.now()
  };

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Enregistre un gestionnaire pour un type de tâche
   */
  registerHandler<T>(type: string, handler: TaskHandler<T>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Ajoute une tâche à la file
   */
  async addTask<T>(
    type: string,
    payload: T,
    options: {
      priority?: number;
      maxRetries?: number;
      delay?: number;
      progressCallback?: (progress: number) => void;
    } = {}
  ): Promise<string> {
    const taskId = this.generateTaskId();
    const now = Date.now();
    
    const task: Task<T> = {
      id: taskId,
      type,
      payload,
      priority: options.priority || 0,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: now,
      scheduledAt: options.delay ? now + options.delay : undefined,
      status: 'pending',
      progressCallback: options.progressCallback
    };

    this.tasks.set(taskId, task);
    
    // Démarre le traitement si pas déjà en cours
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return taskId;
  }

  /**
   * Récupère le statut d'une tâche
   */
  getTaskStatus(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Annule une tâche
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    
    if (!task || task.status === 'running') {
      return false;
    }

    task.status = 'cancelled';
    return true;
  }

  /**
   * Démarre le traitement des tâches
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Traite la file d'attente
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      // Vérifie s'il y a de la place pour de nouvelles tâches
      if (this.running.size >= this.maxConcurrent) {
        await this.sleep(100);
        continue;
      }

      // Trouve la prochaine tâche à traiter
      const nextTask = this.getNextTask();
      
      if (!nextTask) {
        // Pas de tâches, attend un peu
        await this.sleep(500);
        continue;
      }

      // Lance le traitement de la tâche
      this.processTask(nextTask);
    }
  }

  /**
   * Récupère la prochaine tâche à traiter
   */
  private getNextTask(): Task | null {
    const now = Date.now();
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'pending' && 
        (!task.scheduledAt || task.scheduledAt <= now)
      )
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);

    return pendingTasks[0] || null;
  }

  /**
   * Traite une tâche spécifique
   */
  private async processTask(task: Task): Promise<void> {
    const handler = this.handlers.get(task.type);
    
    if (!handler) {
      task.status = 'failed';
      task.error = `Aucun gestionnaire trouvé pour le type: ${task.type}`;
      return;
    }

    this.running.add(task.id);
    task.status = 'running';
    
    const startTime = Date.now();

    try {
      // Simule le progrès si callback fourni
      if (task.progressCallback) {
        this.simulateProgress(task);
      }

      const result = await handler(task);
      
      task.status = 'completed';
      task.result = result;
      
      // Met à jour les statistiques
      this.updateStats(Date.now() - startTime);
      
    } catch (error) {
      task.retries++;
      
      if (task.retries >= task.maxRetries) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : String(error);
      } else {
        // Remet en attente avec délai exponentiel
        task.status = 'pending';
        task.scheduledAt = Date.now() + Math.pow(2, task.retries) * 1000;
      }
    } finally {
      this.running.delete(task.id);
    }
  }

  /**
   * Simule le progrès d'une tâche
   */
  private simulateProgress(task: Task): void {
    if (!task.progressCallback) return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100 || task.status !== 'running') {
        clearInterval(interval);
        if (task.status === 'running') {
          task.progressCallback?.(100);
        }
        return;
      }
      
      task.progressCallback?.(Math.min(progress, 95));
    }, 500);
  }

  /**
   * Met à jour les statistiques de traitement
   */
  private updateStats(processingTime: number): void {
    this.processingStats.totalProcessed++;
    this.processingStats.totalProcessingTime += processingTime;
    
    // Calcul du throughput par heure
    const now = Date.now();
    if (now - this.processingStats.lastHourStart > 3600000) {
      this.processingStats.lastHourProcessed = 0;
      this.processingStats.lastHourStart = now;
    }
    this.processingStats.lastHourProcessed++;
  }

  /**
   * Récupère les statistiques de la file
   */
  getStats(): QueueStats {
    const tasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      runningTasks: tasks.filter(t => t.status === 'running').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      averageProcessingTime: this.processingStats.totalProcessed > 0 
        ? this.processingStats.totalProcessingTime / this.processingStats.totalProcessed 
        : 0,
      throughput: this.processingStats.lastHourProcessed
    };
  }

  /**
   * Nettoie les tâches terminées anciennes
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;
    
    for (const [id, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
        task.createdAt < cutoff
      ) {
        this.tasks.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Arrête le traitement
   */
  stop(): void {
    this.isProcessing = false;
  }

  /**
   * Génère un ID unique pour une tâche
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instance globale de la file de tâches
export const taskQueue = new TaskQueue(3);

// Gestionnaires spécialisés pour Calmiverse
export class StoryTaskQueue {
  private static instance: StoryTaskQueue;
  private queue = new TaskQueue(2); // Max 2 générations simultanées

  static getInstance(): StoryTaskQueue {
    if (!StoryTaskQueue.instance) {
      StoryTaskQueue.instance = new StoryTaskQueue();
    }
    return StoryTaskQueue.instance;
  }

  constructor() {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Gestionnaire pour la génération d'histoires
    this.queue.registerHandler('generateStory', async (task) => {
      const { storyId, objective, childrenData } = task.payload as {
        storyId: string;
        objective: string;
        childrenData: any[];
      };
      
      // Simule l'appel à l'Edge Function
      const response = await fetch('/api/generateStory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, objective, childrenData })
      });
      
      if (!response.ok) {
        throw new Error(`Génération échouée: ${response.statusText}`);
      }
      
      return await response.json();
    });

    // Gestionnaire pour la génération audio
    this.queue.registerHandler('generateAudio', async (task) => {
      const { storyId, textContent } = task.payload as {
        storyId: string;
        textContent: string;
      };
      
      // Simule l'appel pour la génération audio
      const response = await fetch('/api/generateAudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, textContent })
      });
      
      if (!response.ok) {
        throw new Error(`Génération audio échouée: ${response.statusText}`);
      }
      
      return await response.json();
    });
  }

  async queueStoryGeneration(
    storyId: string, 
    objective: string, 
    childrenData: any[],
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    return this.queue.addTask('generateStory', {
      storyId,
      objective,
      childrenData
    }, {
      priority: 10,
      maxRetries: 2,
      progressCallback
    });
  }

  async queueAudioGeneration(
    storyId: string, 
    textContent: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    return this.queue.addTask('generateAudio', {
      storyId,
      textContent
    }, {
      priority: 5,
      maxRetries: 3,
      progressCallback
    });
  }

  getTaskStatus(taskId: string): Task | null {
    return this.queue.getTaskStatus(taskId);
  }

  getStats(): QueueStats {
    return this.queue.getStats();
  }
}

export const storyTaskQueue = StoryTaskQueue.getInstance();