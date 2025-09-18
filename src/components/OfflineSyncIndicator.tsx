import React from 'react';
import { WifiOff, Wifi, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const OfflineSyncIndicator: React.FC = () => {
  const { 
    isOnline, 
    queueSize, 
    pendingGenerations,
    processingGenerations,
    syncInProgress,
    forceSync,
    canSync,
    needsSync
  } = useOfflineSync();

  // Ne rien afficher si tout va bien
  if (isOnline && queueSize === 0 && !syncInProgress) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
        <CardContent className="p-4 space-y-3">
          {/* Status principal */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'En ligne' : 'Mode hors ligne'}
            </span>
            {syncInProgress && (
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Informations sur la queue */}
          {queueSize > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Histoires en attente</span>
              </div>
              
              <div className="flex gap-2">
                {pendingGenerations > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {pendingGenerations} en attente
                  </Badge>
                )}
                {processingGenerations > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {processingGenerations} en cours
                  </Badge>
                )}
              </div>

              {!isOnline && (
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Synchronisation à la reconnexion</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {needsSync && canSync && (
            <Button
              size="sm"
              variant="outline"
              onClick={forceSync}
              disabled={syncInProgress}
              className="w-full text-xs h-8"
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Synchroniser maintenant
                </>
              )}
            </Button>
          )}

          {syncInProgress && (
            <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
              Traitement des générations en cours...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};