import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Check } from 'lucide-react';
import { useNativePWANotifications } from '@/hooks/notifications/useNativePWANotifications';

/**
 * Bannière pour encourager l'activation des notifications PWA
 * Apparaît de manière discrète et peut être fermée
 */
export const PWANotificationBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const { permission, isSupported, requestPermission } = useNativePWANotifications();

  // Vérifier si la bannière doit être affichée
  useEffect(() => {
    const hasBeenDismissed = localStorage.getItem('calmi-notification-banner-dismissed');
    if (hasBeenDismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Ne pas afficher si déjà accordé, non supporté, ou déjà fermé
  if (!isSupported || permission === 'granted' || permission === 'denied' || isDismissed) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsAsking(true);
    const granted = await requestPermission();
    setIsAsking(false);
    
    if (granted) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('calmi-notification-banner-dismissed', 'true');
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Activez les notifications
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                Recevez une notification quand vos histoires sont prêtes, même quand l'application est fermée.
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleRequestPermission}
                  disabled={isAsking}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAsking ? (
                    <>
                      <Check className="h-4 w-4 mr-1 animate-spin" />
                      Demande en cours...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-1" />
                      Activer
                    </>
                  )}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  Recommandé
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};