/**
 * Service centralisé pour la gestion des notifications PWA natives
 * Remplace complètement Firebase FCM
 */

export interface CalmiNotificationData {
  action: 'read' | 'library' | 'create' | 'home';
  storyId?: string;
  storyTitle?: string;
  timestamp: number;
}

export interface CalmiNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: CalmiNotificationData;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Service de notifications PWA natif pour Calmi
 */
export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Vérifie si les notifications sont supportées
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  /**
   * Obtient le statut actuel des permissions
   */
  getPermission(): NotificationPermission {
    return this.isSupported() ? Notification.permission : 'denied';
  }
  
  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[NotificationService] Notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error requesting permission:', error);
      return false;
    }
  }
  
  /**
   * Envoie une notification
   */
  async send(options: CalmiNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      console.warn('[NotificationService] Cannot send notification:', {
        supported: this.isSupported(),
        permission: this.getPermission()
      });
      return null;
    }
    
    try {
      // Utiliser le Service Worker si disponible, sinon notification directe
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Envoyer via Service Worker pour fonctionner en arrière-plan
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: options.badge || '/icon-192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });
        
        console.log('[NotificationService] Notification sent via Service Worker:', options.title);
        return null; // Service Worker notifications don't return Notification object
      } else {
        // Fallback notification directe
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });
        
        this.setupNotificationHandlers(notification);
        console.log('[NotificationService] Direct notification sent:', options.title);
        return notification;
      }
    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error);
      return null;
    }
  }
  
  /**
   * Configure les gestionnaires d'événements pour les notifications directes
   */
  private setupNotificationHandlers(notification: Notification) {
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      const data = notification.data as CalmiNotificationData;
      if (data?.action) {
        this.handleNotificationAction(data);
      }
      
      notification.close();
    };
  }
  
  /**
   * Gère les actions des notifications
   */
  private handleNotificationAction(data: CalmiNotificationData) {
    switch (data.action) {
      case 'read':
        if (data.storyId) {
          window.location.href = `/reader/${data.storyId}`;
        }
        break;
      case 'library':
        window.location.href = '/library';
        break;
      case 'create':
        window.location.href = '/create-story/step-1';
        break;
      case 'home':
      default:
        window.location.href = '/';
        break;
    }
  }
  
  /**
   * Notifications prédéfinies pour Calmi
   */
  
  async notifyStoryReady(storyTitle: string, storyId: string): Promise<void> {
    await this.send({
      title: '✨ Histoire prête !',
      body: `"${storyTitle}" est maintenant disponible`,
      tag: `story-ready-${storyId}`,
      data: {
        action: 'read',
        storyId,
        storyTitle,
        timestamp: Date.now()
      },
      requireInteraction: true
    });
  }
  
  async notifyStoryError(storyTitle: string, storyId: string): Promise<void> {
    await this.send({
      title: '❌ Erreur de génération',
      body: `Impossible de créer "${storyTitle}". Cliquez pour réessayer.`,
      tag: `story-error-${storyId}`,
      data: {
        action: 'library',
        storyId,
        storyTitle,
        timestamp: Date.now()
      }
    });
  }
  
  async notifyTitleReady(storyId: string): Promise<void> {
    await this.send({
      title: '🎯 Titres disponibles !',
      body: 'Choisissez le titre parfait pour votre histoire',
      tag: `titles-ready-${storyId}`,
      data: {
        action: 'library',
        storyId,
        timestamp: Date.now()
      },
      requireInteraction: true
    });
  }
  
  async notifyAudioReady(storyTitle: string, storyId: string): Promise<void> {
    await this.send({
      title: '🎵 Audio disponible !',
      body: `L'audio de "${storyTitle}" est prêt`,
      tag: `audio-ready-${storyId}`,
      data: {
        action: 'read',
        storyId,
        storyTitle,
        timestamp: Date.now()
      }
    });
  }
  
  async notifyGeneralUpdate(title: string, body: string): Promise<void> {
    await this.send({
      title,
      body,
      tag: 'calmi-update',
      data: {
        action: 'home',
        timestamp: Date.now()
      }
    });
  }
}

// Instance singleton exportée
export const notificationService = NotificationService.getInstance();