import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, reloadApp, isReloading } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 animate-in slide-in-from-top-4">
      <Card className="border-primary/40 bg-background/95 backdrop-blur-md shadow-2xl ring-2 ring-primary/20">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
            aria-label="Ignorer la mise à jour pour le moment"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-2 pr-6">
            <div className="rounded-lg bg-primary/15 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">Mise à jour disponible</CardTitle>
              <CardDescription className="text-xs">
                Une nouvelle version de Calmi est prête.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button 
              onClick={reloadApp} 
              disabled={isReloading} 
              size="sm" 
              className="flex-1 h-8 text-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isReloading ? 'animate-spin' : ''}`} />
              {isReloading ? 'Mise à jour…' : 'Mettre à jour'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDismissed(true)}
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

