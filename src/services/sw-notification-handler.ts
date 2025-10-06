import { NotificationPersistence } from './NotificationPersistence';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PWANotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    storyId?: string;
    type?: 'story_ready' | 'story_error' | 'audio_ready' | 'general';
    url?: string;
  };
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

export class SWNotificationHandler {
  private notificationPersistence: NotificationPersistence;

  constructor() {
    this.notificationPersistence = new NotificationPersistence();
  }

  async showNotification(data: PWANotificationData): Promise<void> {
    try {
      // Importer le helper de détection preview
      const { isPreviewIframe } = await import('@/utils/previewDetection');
      
      // Skip SW operations in preview
      if (isPreviewIframe()) {
        console.log('[SWNotificationHandler] Preview mode: skipping notification');
        return;
      }
      
      // Enregistrer dans la persistance locale
      await this.notificationPersistence.addNotification({
        id: crypto.randomUUID(),
        title: data.title,
        body: data.body,
        type: data.data?.type || 'general',
        storyId: data.data?.storyId,
        timestamp: Date.now(),
        read: false
      });

      // Afficher la notification système
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          badge: data.badge || '/icon-72x72.png',
          tag: data.tag || `calmi-${Date.now()}`,
          data: data.data,
          requireInteraction: data.requireInteraction || false,
          vibrate: [200, 100, 200],
          silent: false
        } as any);
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  }

  async handleNotificationClick(event: any): Promise<void> {
    const notification = event.notification;
    const data = notification.data;

    notification.close();

    try {
      // Marquer comme lue dans la persistance
      if (data?.storyId) {
        await this.notificationPersistence.markAsRead(data.storyId);
      }

      // Gestion de l'action
      let targetUrl = '/';
      if (data?.url) {
        targetUrl = data.url;
      } else if (data?.storyId) {
        targetUrl = `/reader/${data.storyId}`;
      } else if (data?.type === 'story_ready') {
        targetUrl = '/library';
      }

      // Ouvrir ou focus sur la fenêtre
      const clients = await (self as any).clients.matchAll({ type: 'window' });
      const existingClient = clients.find((client: any) => 
        client.url.includes(new URL(targetUrl, (self as any).location.origin).pathname)
      );

      if (existingClient) {
        await existingClient.focus();
      } else if (clients.length > 0) {
        await clients[0].focus();
        await clients[0].navigate(targetUrl);
      } else {
        await (self as any).clients.openWindow(targetUrl);
      }
    } catch (error) {
      console.error('Erreur lors du clic sur la notification:', error);
    }
  }

  async handleBackgroundSync(event: any): Promise<void> {
    if (event.tag === 'story-generation-sync') {
      try {
        // Récupérer les générations en attente du cache
        const cache = await caches.open('offline-story-queue');
        const request = new Request('/offline-queue');
        const response = await cache.match(request);
        
        if (response) {
          const pendingGenerations = await response.json();
          
          // Traiter chaque génération en attente
          for (const generation of pendingGenerations) {
            try {
              await this.processOfflineGeneration(generation);
            } catch (error) {
              console.error('Erreur lors du traitement de la génération:', error);
            }
          }
          
          // Nettoyer le cache après traitement
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation background:', error);
      }
    }
  }

  private async processOfflineGeneration(generation: any): Promise<void> {
    try {
      // Simuler l'appel API de génération
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generation)
      });

      if (response.ok) {
        const result = await response.json();
        await this.showNotification({
          title: 'Histoire générée !',
          body: `"${result.title}" est maintenant disponible`,
          data: {
            type: 'story_ready',
            storyId: result.id,
            url: `/reader/${result.id}`
          },
          actions: [
            { action: 'read', title: 'Lire maintenant' },
            { action: 'close', title: 'Fermer' }
          ]
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la génération offline:', error);
    }
  }

  async scheduleBackgroundSync(): Promise<void> {
    try {
      // Importer le helper de détection preview
      const { isPreviewIframe } = await import('@/utils/previewDetection');
      
      // Skip SW operations in preview
      if (isPreviewIframe()) {
        console.log('[SWNotificationHandler] Preview mode: skipping background sync');
        return;
      }
      
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('story-generation-sync');
      }
    } catch (error) {
      console.error('Erreur lors de la planification du sync:', error);
    }
  }
}

// Instance globale pour le Service Worker
export const swNotificationHandler = new SWNotificationHandler();