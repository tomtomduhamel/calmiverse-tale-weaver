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

  private constructor() { }

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
    try {
      return this.isSupported() ? Notification.permission : 'denied';
    } catch (e) {
      console.warn('[NotificationService] Error accessing permission:', e);
      return 'denied';
    }
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
      // Importer le helper de détection preview
      const { isPreviewIframe } = await import('@/utils/previewDetection');

      // En preview, toujours utiliser notification directe (pas de SW)
      if (isPreviewIframe()) {
        console.log('[NotificationService] Preview mode: using direct notification');
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });

        this.setupNotificationHandlers(notification);
        return notification;
      }

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
   * Gère les actions des notifications via événements custom (évite les reloads)
   */
  private handleNotificationAction(data: CalmiNotificationData) {
    console.log('[NotificationService] Handling notification action:', data);

    let path = '/';

    switch (data.action) {
      case 'read':
        if (data.storyId && this.isValidStoryId(data.storyId)) {
          console.log('[NotificationService] Navigating to story:', data.storyId);
          path = `/app/reader/${data.storyId}`;
        } else {
          console.warn('[NotificationService] Invalid storyId, redirecting to library:', data.storyId);
          path = '/app/library';
        }
        break;
      case 'library':
        console.log('[NotificationService] Navigating to library');
        path = '/app/library';
        break;
      case 'create':
        console.log('[NotificationService] Navigating to story creation');
        path = '/app/create-story/step-1';
        break;
      case 'home':
      default:
        console.log('[NotificationService] Navigating to home');
        path = '/app';
        break;
    }

    // Émettre un événement custom pour navigation SPA (écouté par Shell.tsx)
    const navEvent = new CustomEvent('calmi-navigate', { detail: { path } });
    window.dispatchEvent(navEvent);
  }

  /**
   * Valide si un storyId semble être un UUID valide
   */
  private isValidStoryId(storyId: string): boolean {
    if (!storyId) return false;

    // Vérifier si c'est un UUID valide (format basique)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(storyId);

    // Éviter les IDs temporaires qui commencent par des patterns connus
    const isTemporaryId = storyId.startsWith('temp-') || storyId.startsWith('title-') || storyId.length < 10;

    return isValidUUID && !isTemporaryId;
  }

  /**
   * Notifications prédéfinies pour Calmi
   */

  async notifyTitlesGenerated(): Promise<void> {
    await this.send({
      title: '✨ Titres créés !',
      body: 'Vos 3 titres personnalisés sont prêts. Sélectionnez votre préféré !',
      tag: `titles-generated-${Date.now()}`,
      data: {
        action: 'library' as const,
        timestamp: Date.now()
      },
      requireInteraction: true
    });
  }

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