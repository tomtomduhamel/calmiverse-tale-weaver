import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const AUTO_RELOAD_SECONDS = 10;

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, reloadApp, isReloading } = usePWA();
  const [countdown, setCountdown] = useState(AUTO_RELOAD_SECONDS);

  useEffect(() => {
    if (!updateAvailable) return;
    setCountdown(AUTO_RELOAD_SECONDS);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          console.log('[PWAUpdate] Auto-reload triggered');
          reloadApp();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateAvailable, reloadApp]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 animate-in slide-in-from-top-4">
      <Card className="border-primary/40 bg-primary/5 backdrop-blur-md shadow-2xl ring-2 ring-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm">Nouvelle version disponible</CardTitle>
              <CardDescription className="text-xs">
                {isReloading ? 'Mise à jour en cours…' : `Rechargement automatique dans ${countdown}s`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button onClick={reloadApp} disabled={isReloading} size="sm" className="w-full h-9 text-xs font-medium">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Mise à jour…' : 'Mettre à jour maintenant'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
