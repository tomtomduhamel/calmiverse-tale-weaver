import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MigrationService } from '@/services/migration/MigrationService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  RotateCcw,
  Settings,
  BarChart3
} from 'lucide-react';

/**
 * Panneau de contrôle pour la migration progressive Phase 6
 */
export const MigrationControlPanel: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [migrationService] = useState(() => MigrationService.getInstance());
  const [stats, setStats] = useState(migrationService.getStats());
  const [isLoading, setIsLoading] = useState(false);

  // Rafraîchir les stats périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(migrationService.getStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [migrationService]);

  const handleInitializeMigration = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const group = await migrationService.initializeMigration(user.id);
      
      toast({
        title: "Migration initialisée",
        description: `Vous êtes assigné au groupe: ${group}`,
      });
      
      setStats(migrationService.getStats());
    } catch (error: any) {
      toast({
        title: "Erreur migration",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const success = await migrationService.rollbackUser(user.id, 'manual_request');
      
      if (success) {
        toast({
          title: "Rollback effectué",
          description: "Retour au système classique",
        });
      } else {
        toast({
          title: "Rollback échoué",
          description: "Le rollback n'est pas autorisé",
          variant: "destructive"
        });
      }
      
      setStats(migrationService.getStats());
    } catch (error: any) {
      toast({
        title: "Erreur rollback",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTestingMode = () => {
    migrationService.enableTestingMode();
    setStats(migrationService.getStats());
    
    toast({
      title: "Mode test activé",
      description: "Migration disponible pour tous les utilisateurs",
    });
  };

  const handleDisableTestingMode = () => {
    migrationService.disableTestingMode();
    setStats(migrationService.getStats());
    
    toast({
      title: "Mode test désactivé",
      description: "Retour au rollout graduel",
    });
  };

  const generateReport = () => {
    const report = migrationService.generateReport();
    
    // Afficher le rapport dans la console pour l'instant
    console.log('Rapport de migration:', report);
    
    toast({
      title: "Rapport généré",
      description: `${report.recommendations.length} recommandations disponibles`,
    });
  };

  const getTotalMigrated = () => {
    return stats.backgroundGroup + stats.hybridGroup;
  };

  const getMigrationPercentage = () => {
    if (stats.totalUsers === 0) return 0;
    return (getTotalMigrated() / stats.totalUsers) * 100;
  };

  const getSuccessRate = () => {
    const totalAttempts = stats.successRate + stats.errorRate;
    if (totalAttempts === 0) return 0;
    return (stats.successRate / totalAttempts) * 100;
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Migration Progressive - Phase 6</h2>
        <p className="text-muted-foreground mt-2">
          Contrôle et monitoring du déploiement graduel
        </p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Utilisateurs
                </p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Migrés
                </p>
                <p className="text-2xl font-bold">{getTotalMigrated()}</p>
                <p className="text-xs text-muted-foreground">
                  {getMigrationPercentage().toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Taux Succès
                </p>
                <p className="text-2xl font-bold">{getSuccessRate().toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 text-destructive" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Rollbacks
                </p>
                <p className="text-2xl font-bold">{stats.rollbackCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par groupe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Répartition par Groupe A/B
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Control</div>
              <div className="text-2xl font-bold">{stats.controlGroup}</div>
              <Badge variant="outline">Ancien système</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Background</div>
              <div className="text-2xl font-bold">{stats.backgroundGroup}</div>
              <Badge variant="default">Nouveau système</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Hybrid</div>
              <div className="text-2xl font-bold">{stats.hybridGroup}</div>
              <Badge variant="secondary">Système mixte</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression migration</span>
              <span>{getMigrationPercentage().toFixed(1)}%</span>
            </div>
            <Progress value={getMigrationPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contrôles de Migration
          </CardTitle>
          <CardDescription>
            Actions pour gérer la migration de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleInitializeMigration}
              disabled={isLoading || !user}
              variant="default"
            >
              🚀 Initialiser Migration
            </Button>
            <Button 
              onClick={handleRollback}
              disabled={isLoading || !user}
              variant="outline"
            >
              🔄 Rollback
            </Button>
            <Button 
              onClick={generateReport}
              variant="secondary"
            >
              📊 Générer Rapport
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Mode Test (Développeurs)</h4>
            <div className="flex gap-2">
              <Button 
                onClick={handleEnableTestingMode}
                variant="default"
                size="sm"
              >
                🧪 Activer Mode Test
              </Button>
              <Button 
                onClick={handleDisableTestingMode}
                variant="outline"
                size="sm"
              >
                🔄 Mode Normal
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le mode test permet la migration pour 100% des utilisateurs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertes et recommandations */}
      {(stats.errorRate > 10 || stats.rollbackCount > stats.totalUsers * 0.05) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertes Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.errorRate > 10 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Taux d'erreur élevé ({stats.errorRate}%) - Investiguer les causes
              </div>
            )}
            {stats.rollbackCount > stats.totalUsers * 0.05 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Taux de rollback élevé ({((stats.rollbackCount / stats.totalUsers) * 100).toFixed(1)}%) - Vérifier la stabilité
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug info pour développement */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug - États Internes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify({
                stats,
                userId: user?.id,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};