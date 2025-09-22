import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { useNotificationPermissions } from '@/hooks/notifications/useNotificationPermissions';
import { CheckCircle, XCircle, Clock, Bell } from 'lucide-react';

/**
 * Composant de diagnostic complet pour les notifications
 * Permet de tester les différents types de notifications et leur navigation
 */
export const NotificationDiagnostic: React.FC = () => {
  const { permission, isSupported, requestPermission, canNotify } = useNotificationPermissions();
  const { 
    notifyTitlesGenerated, 
    notifyStoryReady, 
    notifyStoryError, 
    notifyAudioReady 
  } = useStoryNotifications();
  
  const [isTestingSequence, setIsTestingSequence] = useState(false);

  const getPermissionIcon = () => {
    if (!isSupported) return <XCircle className="h-5 w-5 text-destructive" />;
    if (permission === 'granted') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (permission === 'denied') return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getPermissionBadge = () => {
    if (!isSupported) return <Badge variant="destructive">Non supporté</Badge>;
    if (permission === 'granted') return <Badge variant="default" className="bg-green-500">Autorisé</Badge>;
    if (permission === 'denied') return <Badge variant="destructive">Refusé</Badge>;
    return <Badge variant="secondary">En attente</Badge>;
  };

  const testNotificationSequence = async () => {
    setIsTestingSequence(true);
    
    try {
      // Test 1: Titres générés (navigation vers library)
      console.log('[NotificationDiagnostic] Test 1: Titles generated');
      await notifyTitlesGenerated();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 2: Histoire prête (navigation vers reader - avec storyId valide)
      console.log('[NotificationDiagnostic] Test 2: Story ready');
      await notifyStoryReady('Histoire de Test', '12345678-1234-1234-1234-123456789012');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 3: Erreur d'histoire (navigation vers library)
      console.log('[NotificationDiagnostic] Test 3: Story error');
      await notifyStoryError('Histoire Échouée', 'error-story-id');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 4: Audio prêt (navigation vers reader)
      console.log('[NotificationDiagnostic] Test 4: Audio ready');
      await notifyAudioReady('Histoire Audio', '12345678-1234-1234-1234-123456789012');
      
      console.log('[NotificationDiagnostic] ✅ Séquence de test terminée');
    } catch (error) {
      console.error('[NotificationDiagnostic] Erreur lors du test:', error);
    } finally {
      setIsTestingSequence(false);
    }
  };

  const testSpecificNotification = async (type: string) => {
    try {
      switch (type) {
        case 'titles':
          await notifyTitlesGenerated();
          break;
        case 'story':
          await notifyStoryReady('Test Story', '12345678-1234-1234-1234-123456789012');
          break;
        case 'error':
          await notifyStoryError('Test Error', 'invalid-id');
          break;
        case 'audio':
          await notifyAudioReady('Test Audio', '12345678-1234-1234-1234-123456789012');
          break;
      }
    } catch (error) {
      console.error(`[NotificationDiagnostic] Erreur test ${type}:`, error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Diagnostic des Notifications
        </CardTitle>
        <CardDescription>
          Testez le système de notifications et la navigation associée
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statut des permissions */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getPermissionIcon()}
            <div>
              <p className="font-medium">Statut des notifications</p>
              <p className="text-sm text-muted-foreground">
                {isSupported ? `Permission: ${permission}` : 'Navigateur non compatible'}
              </p>
            </div>
          </div>
          {getPermissionBadge()}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!canNotify && (
            <Button 
              onClick={requestPermission} 
              className="w-full"
              variant="default"
            >
              Autoriser les notifications
            </Button>
          )}
          
          {canNotify && (
            <>
              <Button
                onClick={testNotificationSequence}
                disabled={isTestingSequence}
                className="w-full"
                variant="default"
              >
                {isTestingSequence ? 'Test en cours...' : 'Tester la séquence complète'}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => testSpecificNotification('titles')}
                  variant="outline"
                  size="sm"
                >
                  Test Titres
                </Button>
                <Button
                  onClick={() => testSpecificNotification('story')}
                  variant="outline"
                  size="sm"
                >
                  Test Histoire
                </Button>
                <Button
                  onClick={() => testSpecificNotification('error')}
                  variant="outline"
                  size="sm"
                >
                  Test Erreur
                </Button>
                <Button
                  onClick={() => testSpecificNotification('audio')}
                  variant="outline"
                  size="sm"
                >
                  Test Audio
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Informations sur les tests */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Types de notifications testés :</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Titres générés</strong> → Navigation vers bibliothèque</li>
            <li><strong>Histoire prête</strong> → Navigation vers lecteur (storyId valide)</li>
            <li><strong>Erreur d'histoire</strong> → Navigation vers bibliothèque (storyId invalide)</li>
            <li><strong>Audio prêt</strong> → Navigation vers lecteur</li>
          </ul>
          <p className="text-xs mt-2">
            💡 Vérifiez la console pour voir les logs de navigation et validation
          </p>
        </div>
      </CardContent>
    </Card>
  );
};