import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, reloadApp } = usePWA();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-accent/20 bg-background/95 backdrop-blur-sm shadow-soft-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-2">
              <Download className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm">Mise à jour disponible</CardTitle>
              <CardDescription className="text-xs">
                Une nouvelle version de Calmi est prête
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={reloadApp}
            size="sm"
            className="w-full h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Mettre à jour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};