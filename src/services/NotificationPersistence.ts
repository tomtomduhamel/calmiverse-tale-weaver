export interface PersistedNotification {
  id: string;
  title: string;
  body: string;
  type: 'story_ready' | 'story_error' | 'audio_ready' | 'general';
  storyId?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export class NotificationPersistence {
  private readonly STORAGE_KEY = 'calmi_notifications';
  private readonly MAX_NOTIFICATIONS = 100;
  private readonly RETENTION_DAYS = 30;

  constructor() {
    this.cleanup();
  }

  async addNotification(notification: PersistedNotification): Promise<void> {
    try {
      const notifications = this.getNotifications();
      
      // Ajouter en début de liste (plus récent en premier)
      notifications.unshift(notification);
      
      // Limiter le nombre de notifications
      if (notifications.length > this.MAX_NOTIFICATIONS) {
        notifications.splice(this.MAX_NOTIFICATIONS);
      }
      
      this.saveNotifications(notifications);
      this.dispatchUpdateEvent();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la notification:', error);
    }
  }

  getNotifications(): PersistedNotification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const notifications: PersistedNotification[] = JSON.parse(stored);
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  getUnreadNotifications(): PersistedNotification[] {
    return this.getNotifications().filter(n => !n.read);
  }

  getNotificationsByType(type: PersistedNotification['type']): PersistedNotification[] {
    return this.getNotifications().filter(n => n.type === type);
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        this.saveNotifications(notifications);
        this.dispatchUpdateEvent();
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const notifications = this.getNotifications();
      notifications.forEach(n => n.read = true);
      this.saveNotifications(notifications);
      this.dispatchUpdateEvent();
    } catch (error) {
      console.error('Erreur lors du marquage de toutes comme lues:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = this.getNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      this.saveNotifications(filteredNotifications);
      this.dispatchUpdateEvent();
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.dispatchUpdateEvent();
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
    }
  }

  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  private saveNotifications(notifications: PersistedNotification[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notifications:', error);
    }
  }

  private cleanup(): void {
    try {
      const notifications = this.getNotifications();
      const now = Date.now();
      const retentionMs = this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
      
      const validNotifications = notifications.filter(n => 
        now - n.timestamp < retentionMs
      );
      
      if (validNotifications.length !== notifications.length) {
        this.saveNotifications(validNotifications);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications:', error);
    }
  }

  private dispatchUpdateEvent(): void {
    // Émettre un événement personnalisé pour notifier les composants React
    window.dispatchEvent(new CustomEvent('notifications-updated', {
      detail: {
        count: this.getUnreadCount(),
        notifications: this.getNotifications()
      }
    }));
  }

  // Méthodes utilitaires pour l'intégration avec les hooks React
  subscribeToUpdates(callback: (notifications: PersistedNotification[]) => void): () => void {
    const handleUpdate = () => callback(this.getNotifications());
    
    window.addEventListener('notifications-updated', handleUpdate);
    
    // Retourner une fonction de cleanup
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }

  // Méthodes pour l'export/import (utile pour le debug)
  exportNotifications(): string {
    return JSON.stringify(this.getNotifications(), null, 2);
  }

  async importNotifications(jsonData: string): Promise<void> {
    try {
      const notifications = JSON.parse(jsonData);
      if (Array.isArray(notifications)) {
        this.saveNotifications(notifications);
        this.dispatchUpdateEvent();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import des notifications:', error);
      throw new Error('Format de données invalide');
    }
  }
}