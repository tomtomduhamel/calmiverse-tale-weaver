import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, Clock, Trash2, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  type: 'story_ready' | 'story_error' | 'audio_ready' | 'general';
  timestamp: Date;
  storyId?: string;
  read: boolean;
}

interface NotificationHistoryModalProps {
  trigger?: React.ReactNode;
}

/**
 * Modal d'historique des notifications PWA
 * Affiche l'historique complet des notifications reçues
 */
export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ trigger }) => {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Charger l'historique depuis le localStorage au montage
  useEffect(() => {
    const loadNotificationHistory = () => {
      try {
        const stored = localStorage.getItem('calmi_notification_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convertir les timestamps en objets Date
          const withDates = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setNotifications(withDates);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement de l\'historique des notifications:', error);
      }
    };

    if (isOpen) {
      loadNotificationHistory();
    }
  }, [isOpen]);

  // Vider l'historique
  const clearHistory = () => {
    localStorage.removeItem('calmi_notification_history');
    setNotifications([]);
  };

  // Marquer comme lu
  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
    localStorage.setItem('calmi_notification_history', JSON.stringify(updated));
  };

  // Obtenir l'icône selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story_ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'story_error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'audio_ready':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Obtenir le badge selon le type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'story_ready':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Histoire</Badge>;
      case 'story_error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'audio_ready':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Audio</Badge>;
      default:
        return <Badge variant="outline">Général</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="relative">
            <History className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historique des notifications
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune notification pour le moment</p>
              <p className="text-sm">Les notifications apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.read
                        ? 'bg-muted/30 border-muted'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {getTypeBadge(notification.type)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                              locale: fr
                            })}
                          </span>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};