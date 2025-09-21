import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWorkflowTesting } from '@/hooks/testing/useWorkflowTesting';
import { useStoryWorkflowToggle } from '@/hooks/stories/useStoryWorkflowToggle';
import { Loader2, TestTube, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Panneau de test et contrôle pour la Phase 6
 * Permet aux développeurs de tester et basculer entre les workflows
 */
export const WorkflowTestingPanel: React.FC = () => {
  const testing = useWorkflowTesting();
  const workflow = useStoryWorkflowToggle();

  const renderTestResults = () => {
    if (!testing.results) return null;

    const { results } = testing;
    
    if (results.overall) {
      const { overall } = results;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {overall.success ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className="font-medium">
              {overall.success ? 'Tests réussis' : 'Tests échoués'}
            </span>
            <Badge variant={overall.success ? 'default' : 'destructive'}>
              {overall.successRate.toFixed(0)}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Durée totale: {overall.totalDuration}ms
          </p>
        </div>
      );
    }

    return (
      <div className="text-sm text-muted-foreground">
        Résultats disponibles après les tests
      </div>
    );
  };

  const getWorkflowBadgeVariant = (group: string) => {
    switch (group) {
      case 'background': return 'default';
      case 'hybrid': return 'secondary';
      case 'control': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Phase 6 - Tests & Validation</h2>
        <p className="text-muted-foreground mt-2">
          Panneau de contrôle pour tester et valider le nouveau système de notifications
        </p>
      </div>

      {/* Statut actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Statut du Workflow
          </CardTitle>
          <CardDescription>
            Configuration actuelle du système de notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Méthode création</div>
              <Badge variant={workflow.useBackgroundGeneration ? 'default' : 'outline'}>
                {workflow.getStoryCreationMethod()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Notifications</div>
              <Badge variant={workflow.useNativeNotifications ? 'default' : 'outline'}>
                {workflow.getNotificationMethod()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Groupe A/B</div>
              <Badge variant={getWorkflowBadgeVariant(workflow.abTestGroup)}>
                {workflow.abTestGroup}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Rollback</div>
              <Badge variant={workflow.canRollback ? 'default' : 'destructive'}>
                {workflow.canRollback ? 'Disponible' : 'Bloqué'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles de Workflow</CardTitle>
          <CardDescription>
            Basculer entre les différents modes de fonctionnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={workflow.enableNewWorkflow}
              variant="default"
              size="sm"
            >
              🚀 Nouveau Workflow
            </Button>
            <Button 
              onClick={workflow.enableHybridWorkflow}
              variant="secondary"
              size="sm"
            >
              ⚡ Mode Hybride
            </Button>
            <Button 
              onClick={workflow.enableOldWorkflow}
              variant="outline"
              size="sm"
              disabled={!workflow.canRollback}
            >
              🔄 Ancien Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Suite de Tests
          </CardTitle>
          <CardDescription>
            Valider le bon fonctionnement du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testing.runQuickTest}
              disabled={testing.isRunning}
              variant="default"
              size="sm"
            >
              {testing.isRunning && testing.currentTest === 'Test rapide' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              ⚡ Test Rapide
            </Button>
            <Button 
              onClick={testing.runFullTestSuite}
              disabled={testing.isRunning}
              variant="secondary"
              size="sm"
            >
              {testing.isRunning && testing.currentTest === 'Suite complète' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              🧪 Suite Complète
            </Button>
            <Button 
              onClick={testing.testNotificationPermissions}
              disabled={testing.isRunning}
              variant="outline"
              size="sm"
            >
              {testing.isRunning && testing.currentTest === 'Permissions notifications' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              🔔 Test Permissions
            </Button>
            <Button 
              onClick={testing.simulateStoryGeneration}
              disabled={testing.isRunning}
              variant="outline"
              size="sm"
            >
              {testing.isRunning && testing.currentTest === 'Simulation génération' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              🎭 Simuler Génération
            </Button>
          </div>

          {testing.isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Test en cours: {testing.currentTest}
            </div>
          )}

          {testing.error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Erreur: {testing.error}
            </div>
          )}

          <Separator />

          {/* Résultats des tests */}
          <div>
            <h4 className="font-medium mb-2">Résultats des Tests</h4>
            {renderTestResults()}
          </div>
        </CardContent>
      </Card>

      {/* Mode développement */}
      <Card>
        <CardHeader>
          <CardTitle>Mode Développement</CardTitle>
          <CardDescription>
            Outils pour les développeurs et les tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testing.enableTestingMode}
              variant="default"
              size="sm"
            >
              🧪 Activer Mode Test
            </Button>
            <Button 
              onClick={testing.disableTestingMode}
              variant="outline"
              size="sm"
            >
              🔄 Mode Normal
            </Button>
            <Button 
              onClick={testing.cleanup}
              variant="ghost"
              size="sm"
            >
              🧹 Nettoyer
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Mode test:</strong> Active toutes les nouvelles fonctionnalités pour validation complète
          </div>
        </CardContent>
      </Card>

      {/* Informations debug */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify({
                workflow: workflow.getWorkflowMetrics(),
                testing: {
                  isRunning: testing.isRunning,
                  currentTest: testing.currentTest,
                  hasResults: !!testing.results
                }
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};