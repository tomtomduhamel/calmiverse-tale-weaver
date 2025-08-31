import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';

export const PWANotificationPrompt: React.FC = () => {
  const { permission, isSupported, requestPermission, sendTestNotification } = useNotifications();
  const { track } = usePWAAnalytics();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('calmi-notification-prompt-dismissed') === 'true';
    const shouldShow = isSupported && 
                      permission === 'default' && 
                      !isDismissed;

    setDismissed(isDismissed);
    
    if (shouldShow) {
      // Show prompt after 10 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
        track('notification_prompt_shown');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, track]);

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      track('notification_permission_granted');
      setShowPrompt(false);
      
      // Send welcome notification
      setTimeout(() => {
        sendTestNotification();
      }, 1000);
    } else {
      track('notification_permission_denied');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('calmi-notification-prompt-dismissed', 'true');
    setShowPrompt(false);
    setDismissed(true);
    track('notification_prompt_dismissed');
  };

  if (!showPrompt || dismissed || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-accent/20 bg-background/95 backdrop-blur-sm shadow-soft-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-accent/10 p-2">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm">Notifications</CardTitle>
                <CardDescription className="text-xs">
                  Soyez averti quand vos histoires sont prêtes
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleAllow}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              <Bell className="h-3 w-3 mr-1" />
              Autoriser
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              <BellOff className="h-3 w-3 mr-1" />
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};