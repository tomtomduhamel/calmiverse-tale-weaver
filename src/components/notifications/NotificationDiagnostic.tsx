import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNotificationPermissions } from '@/hooks/notifications/useNotificationPermissions';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';

export const NotificationDiagnostic: React.FC = () => {
  const { 
    permission, 
    isSupported, 
    isLoading, 
    requestPermission, 
    canNotify 
  } = useNotificationPermissions();
  
  const { 
    notifyTitlesReady, 
    notifyStoryReady, 
    notifyStoryError, 
    notifyAudioReady 
  } = useStoryNotifications();

  const getPermissionIcon = () => {
    if (!isSupported) return <XCircle className="h-4 w-4" />;
    if (permission === 'granted') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (permission === 'denied') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getPermissionBadge = () => {
    if (!isSupported) return <Badge variant="destructive">Non supporté</Badge>;
    if (permission === 'granted') return <Badge variant="default" className="bg-green-500">Activées</Badge>;
    if (permission === 'denied') return <Badge variant="destructive">Refusées</Badge>;
    return <Badge variant="secondary">En attente</Badge>;
  };

  const testNotifications = async () => {
    try {
      await notifyTitlesReady('test-story');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await notifyStoryReady('Histoire de test', 'test-story');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await notifyAudioReady('Histoire de test', 'test-story');
    } catch (error) {
      console.error('Erreur test notifications:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Diagnostic Notifications
        </CardTitle>
        <CardDescription>
          Vérifiez si vos notifications fonctionnent correctement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPermissionIcon()}
            <span className="text-sm font-medium">État des notifications</span>
          </div>
          {getPermissionBadge()}
        </div>

        {!isSupported && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            ❌ Votre navigateur ne supporte pas les notifications natives
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            ⚠️ Notifications refusées. Activez-les dans les paramètres de votre navigateur
          </div>
        )}

        {isSupported && permission === 'default' && (
          <Button 
            onClick={requestPermission} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Demande en cours...' : 'Activer les notifications'}
          </Button>
        )}

        {canNotify && (
          <div className="space-y-2">
            <Button 
              onClick={testNotifications}
              variant="outline"
              className="w-full"
            >
              Tester les notifications
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Cliquez pour recevoir des notifications de test
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>✨ Titres d'histoire prêts</div>
          <div>📖 Histoire complète</div>
          <div>🎵 Audio disponible</div>
          <div>❌ Erreurs de génération</div>
        </div>
      </CardContent>
    </Card>
  );
};